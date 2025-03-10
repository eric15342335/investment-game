/**
 * Application Store
 * Implements Redux-like state management pattern
 */
import { AppConfig } from '../config/AppConfig.js';
import { AssetConfig } from '../config/AssetConfig.js';
import { Portfolio } from '../models/Portfolio.js';
import { Asset } from '../models/Asset.js';
import { StrategyManager } from '../strategies/StrategyManager.js';

// Action Types
export const ActionTypes = {
    // Portfolio actions
    UPDATE_PORTFOLIO: 'UPDATE_PORTFOLIO',
    SELECT_ASSET: 'SELECT_ASSET',
    EXECUTE_TRADE: 'EXECUTE_TRADE',
    UPDATE_PRICES: 'UPDATE_PRICES',
    
    // Strategy actions
    ACTIVATE_STRATEGY: 'ACTIVATE_STRATEGY',
    DEACTIVATE_STRATEGY: 'DEACTIVATE_STRATEGY',
    UPDATE_STRATEGY: 'UPDATE_STRATEGY',
    
    // UI actions
    UPDATE_CHART_TYPE: 'UPDATE_CHART_TYPE',
    TOGGLE_INDICATOR: 'TOGGLE_INDICATOR',
    SET_THEME: 'SET_THEME',
    SET_SPEED: 'SET_SPEED'
};

export class Store {
    constructor() {
        this.state = {
            portfolio: null,
            strategyManager: null,
            settings: {
                chartType: 'line', // 'line' or 'candlestick'
                indicators: {
                    sma: true,
                    rsi: true,
                    volume: true
                },
                theme: 'dark',
                speedMultiplier: 1
            }
        };
        
        this.subscribers = new Set();
        this.initialize();
    }
    
    /**
     * Initialize store with default state
     */
    initialize() {
        // Initialize portfolio
        const portfolio = this.loadPortfolio() || new Portfolio();
        
        // Initialize assets
        // Initialize assets from AssetConfig
        Object.values(AssetConfig).forEach(config => {
            portfolio.addAsset(new Asset(config));
        });
        
        // Initialize strategy manager
        const strategyManager = new StrategyManager();
        
        this.state.portfolio = portfolio;
        this.state.strategyManager = strategyManager;
        
        this.saveState();
    }
    
    /**
     * Subscribe to state changes
     * @param {Function} callback - Subscriber callback
     * @returns {Function} - Unsubscribe function
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }
    
    /**
     * Notify all subscribers of state change
     */
    notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.state));
    }
    
    /**
     * Dispatch an action to update state
     * @param {Object} action - Action object
     */
    dispatch(action) {
        switch (action.type) {
            case ActionTypes.UPDATE_PORTFOLIO:
                this.state.portfolio = action.payload;
                break;
                
            case ActionTypes.SELECT_ASSET:
                console.log(`Store: Selecting asset ${action.payload}`);
                this.state.portfolio.selectAsset(action.payload);
                break;
                
            case ActionTypes.EXECUTE_TRADE: {
                const { symbol, type, amount } = action.payload;
                if (type === 'BUY') {
                    this.state.portfolio.buyAsset(symbol, amount);
                } else if (type === 'SELL') {
                    this.state.portfolio.sellAsset(symbol, amount);
                }
                break;
            }
                
            case ActionTypes.UPDATE_PRICES:
                action.payload.forEach(({ symbol, price, volume, open, high, low, close }) => {
                    const asset = this.state.portfolio.getAsset(symbol);
                    if (asset) {
                        // Ensure price is a valid number
                        asset.price = typeof price === 'number' && !isNaN(price) ? price : asset.price;
                        
                        // Update chart data
                        if (!asset.chartData) {
                            asset.chartData = {
                                labels: [],
                                price: [],
                                volume: [],
                                open: [],
                                high: [],
                                low: [],
                                close: [],
                                rsi: []
                            };
                        }
                        
                        // Add new data point
                        const time = new Date().toLocaleTimeString();
                        
                        // Add time label
                        asset.chartData.labels.push(time);
                        
                        // Add price data
                        asset.chartData.price.push(asset.price);
                        asset.chartData.volume.push(volume || Math.random() * 100);
                        
                        // Add OHLC data
                        asset.chartData.open.push(open || asset.price);
                        asset.chartData.high.push(high || asset.price * (1 + Math.random() * 0.002));
                        asset.chartData.low.push(low || asset.price * (1 - Math.random() * 0.002));
                        asset.chartData.close.push(close || asset.price);
                        
                        // Calculate SMA
                        if (asset.chartData.price.length >= 20) {
                            const smaValues = asset.chartData.price.slice(-20);
                            const sma = smaValues.reduce((sum, val) => sum + val, 0) / smaValues.length;
                            
                            if (!asset.chartData.sma) {
                                asset.chartData.sma = new Array(asset.chartData.price.length - 1).fill(null);
                                asset.chartData.sma.push(sma);
                            } else {
                                asset.chartData.sma.push(sma);
                            }
                        } else if (asset.chartData.sma) {
                            asset.chartData.sma.push(null);
                        }
                        
                        // Calculate RSI for RSI chart
                        if (asset.chartData.price.length >= 14) {
                            const rsiPrices = asset.chartData.price.slice(-15);
                            const changes = [];
                            
                            for (let i = 1; i < rsiPrices.length; i++) {
                                changes.push(rsiPrices[i] - rsiPrices[i-1]);
                            }
                            
                            const gains = changes.map(c => c > 0 ? c : 0);
                            const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
                            
                            const avgGain = gains.reduce((sum, val) => sum + val, 0) / 14;
                            const avgLoss = losses.reduce((sum, val) => sum + val, 0) / 14;
                            
                            let rsi;
                            if (avgLoss === 0) {
                                rsi = 100;
                            } else {
                                const rs = avgGain / avgLoss;
                                rsi = 100 - (100 / (1 + rs));
                            }
                            
                            if (!asset.chartData.rsi) {
                                asset.chartData.rsi = new Array(asset.chartData.price.length - 1).fill(null);
                                asset.chartData.rsi.push(rsi);
                            } else {
                                asset.chartData.rsi.push(rsi);
                            }
                        } else if (asset.chartData.rsi) {
                            asset.chartData.rsi.push(null);
                        }
                        
                        // Update portfolio value history for portfolio chart
                        if (symbol === this.state.portfolio.selectedAsset) {
                            this.state.portfolio.recordPortfolioValue();
                        }
                        
                        // Limit data points to prevent memory issues
                        const maxPoints = 100;
                        if (asset.chartData.labels.length > maxPoints) {
                            Object.keys(asset.chartData).forEach(key => {
                                if (Array.isArray(asset.chartData[key])) {
                                    asset.chartData[key] = asset.chartData[key].slice(-maxPoints);
                                }
                            });
                        }
                    }
                });
                break;
                
            case ActionTypes.ACTIVATE_STRATEGY:
                this.state.strategyManager.activateStrategy(action.payload);
                break;
                
            case ActionTypes.DEACTIVATE_STRATEGY:
                this.state.strategyManager.deactivateStrategy(action.payload);
                break;
                
            case ActionTypes.UPDATE_STRATEGY: {
                const { name, parameters } = action.payload;
                this.state.strategyManager.updateStrategyParameters(name, parameters);
                break;
            }
                
            case ActionTypes.UPDATE_CHART_TYPE:
                this.state.settings.chartType = action.payload;
                break;
                
            case ActionTypes.TOGGLE_INDICATOR:
                this.state.settings.indicators[action.payload] = 
                    !this.state.settings.indicators[action.payload];
                break;
                
            case ActionTypes.SET_THEME:
                this.state.settings.theme = action.payload;
                document.documentElement.setAttribute('data-theme', action.payload);
                break;
                
            case ActionTypes.SET_SPEED:
                this.state.settings.speedMultiplier = action.payload;
                break;
                
            default:
                console.warn('Unknown action type:', action.type);
                return;
        }
        
        this.saveState();
        this.notifySubscribers();
    }
    
    /**
     * Get current state
     * @returns {Object} - Current state
     */
    getState() {
        return this.state;
    }
    
    /**
     * Load portfolio from local storage
     * @returns {Portfolio|null} - Loaded portfolio or null
     */
    loadPortfolio() {
        try {
            const savedState = localStorage.getItem(AppConfig.storageKeys.gameState);
            if (savedState) {
                const data = JSON.parse(savedState);
                return Portfolio.fromJSON(data, AssetConfig);
            }
        } catch (error) {
            console.error('Error loading portfolio:', error);
        }
        return null;
    }
    
    /**
     * Save current state to local storage
     */
    saveState() {
        try {
            const state = {
                portfolio: this.state.portfolio.toJSON(),
                strategyManager: this.state.strategyManager.toJSON(),
                settings: this.state.settings
            };
            localStorage.setItem(AppConfig.storageKeys.gameState, JSON.stringify(state));
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }
    
    /**
     * Reset store to initial state
     */
    reset() {
        localStorage.removeItem(AppConfig.storageKeys.gameState);
        this.initialize();
        this.notifySubscribers();
    }
}

// Create and export singleton instance
export const store = new Store();