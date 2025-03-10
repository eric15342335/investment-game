/**
 * Game Manager
 * Main application controller that coordinates all components
 */
import { store, ActionTypes } from './store/Store.js';
import { UIUpdateService } from './services/UIUpdateService.js';
import { AppConfig } from './config/AppConfig.js';

export class GameManager {
    constructor() {
        this.uiService = new UIUpdateService();
        this.worker = null;
        this.elements = {};
    }
    
    /**
     * Initialize the game
     */
    initialize() {
        // Initialize UI elements
        this.initializeElements();
        
        // Initialize UI service
        this.uiService.initialize(this.elements);
        
        // Start price updates
        this.startPriceUpdates();
        
        // Set up game loop
        this.setupGameLoop();
    }
    
    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.elements = {
            // Charts
            priceChart: document.getElementById('priceChart'),
            rsiChart: document.getElementById('rsiChart'),
            portfolioChart: document.getElementById('portfolioChart'),
            orderBookChart: document.getElementById('orderBookChart'),
            
            // Asset info
            selectedAsset: document.getElementById('selectedAsset'),
            assetPrice: document.getElementById('assetPrice'),
            priceTrend: document.getElementById('priceTrend'),
            
            // Portfolio info
            usdBalance: document.getElementById('usdBalance'),
            assetBalances: document.getElementById('assetBalances'),
            totalValue: document.getElementById('totalValue'),
            roi: document.getElementById('roi'),
            
            // Trade controls
            buySlider: document.getElementById('buySlider'),
            sellSlider: document.getElementById('sellSlider'),
            buySliderValue: document.getElementById('buySliderValue'),
            sellSliderValue: document.getElementById('sellSliderValue'),
            buyBtn: document.getElementById('buyBtn'),
            sellBtn: document.getElementById('sellBtn'),
            
            // Strategy controls
            strategyList: document.getElementById('strategyList'),
            
            // Chart controls
            chartType: document.getElementById('chartType'),
            indicatorToggles: document.querySelectorAll('.indicator-toggle'),
            
            // Other controls
            speedMultiplier: document.getElementById('speedMultiplier'),
            themeToggle: document.getElementById('themeToggle'),

            // History
            history: document.getElementById('history')
        };
    }
    
    /**
     * Start price update worker
     */
    startPriceUpdates() {
        this.cleanup();
        
        try {
            this.worker = new Worker('./src/workers/PriceWorker.js', { type: 'module' });
            
            this.worker.onmessage = (e) => {
                const { type, data } = e.data;
                
                switch (type) {
                    case 'update':
                        this.handlePriceUpdate(data);
                        break;
                        
                    case 'started':
                        console.log('Price worker started:', data.message);
                        break;
                        
                    case 'error':
                        console.error('Worker error:', data.message);
                        // Restart worker on error
                        setTimeout(() => this.startPriceUpdates(), 1000);
                        break;
                }
            };
            
            this.worker.onerror = (error) => {
                console.error('Worker error event:', error);
                // Restart worker on error
                setTimeout(() => this.startPriceUpdates(), 1000);
            };
            
            // Initialize worker with current state
            this.updateWorker();
            
            // Set up speed control event listener
            if (this.elements.speedMultiplier) {
                this.elements.speedMultiplier.addEventListener('change', (e) => {
                    const multiplier = parseInt(e.target.value);
                    store.dispatch({
                        type: ActionTypes.SET_SPEED,
                        payload: multiplier
                    });
                    
                    // Update worker with new speed
                    if (this.worker) {
                        this.worker.postMessage({
                            type: 'updateSpeed',
                            data: { multiplier }
                        });
                    }
                });
            }
            
            // Set up theme toggle event listener
            if (this.elements.themeToggle) {
                this.elements.themeToggle.addEventListener('change', (e) => {
                    const theme = e.target.checked ? 'light' : 'dark';
                    store.dispatch({
                        type: ActionTypes.SET_THEME,
                        payload: theme
                    });
                    document.documentElement.setAttribute('data-theme', theme);
                });
            }
            
        } catch (error) {
            console.error('Error creating Web Worker:', error);
        }
    }
    
    /**
     * Set up game loop for periodic updates
     */
    setupGameLoop() {
        // Update portfolio value history periodically
        setInterval(() => {
            const state = store.getState();
            const portfolio = state.portfolio;
            
            // Record portfolio value
            portfolio.recordPortfolioValue();
            
            // Evaluate trading strategies
            const selectedAsset = portfolio.getSelectedAsset();
            if (selectedAsset) {
                const signals = state.strategyManager.evaluateStrategies(selectedAsset, portfolio);
                this.handleTradingSignals(signals);
            }
            
        }, 1000);
        
        // Add window event listeners
        window.addEventListener('beforeunload', () => this.cleanup());
        window.addEventListener('resize', () => this.handleResize());
    }
    
    /**
     * Handle price updates from worker
     * @param {Object} data - Price update data
     */
    handlePriceUpdate(data) {
        if (!data || !data.updates) {
            console.error('Invalid price update data:', data);
            return;
        }
        
        try {
            // Update store with new prices
            const updates = Object.entries(data.updates).map(([symbol, update]) => {
                // Ensure the update has a valid newPrice
                if (update && typeof update.newPrice === 'number' && !isNaN(update.newPrice)) {
                    return {
                        symbol,
                        price: update.newPrice,
                        // Pass additional data for charts
                        change: update.change,
                        volume: update.volume,
                        open: update.open,
                        high: update.high,
                        low: update.low,
                        close: update.close
                    };
                }
                return null;
            }).filter(update => update !== null);
            
            store.dispatch({
                type: ActionTypes.UPDATE_PRICES,
                payload: updates
            });
        } catch (error) {
            console.error('Error handling price update:', error);
        }
    }
    
    /**
     * Handle trading signals from strategies
     * @param {Array} signals - Trading signals
     */
    handleTradingSignals(signals) {
        signals.forEach(signal => {
            const state = store.getState();
            const selectedAsset = state.portfolio.getSelectedAsset();
            
            if (signal.type === 'BUY' && signal.usdAmount) {
                store.dispatch({
                    type: ActionTypes.EXECUTE_TRADE,
                    payload: {
                        symbol: selectedAsset.symbol,
                        type: 'BUY',
                        amount: signal.usdAmount
                    }
                });
            } else if (signal.type === 'SELL' && signal.assetAmount) {
                store.dispatch({
                    type: ActionTypes.EXECUTE_TRADE,
                    payload: {
                        symbol: selectedAsset.symbol,
                        type: 'SELL',
                        amount: signal.assetAmount
                    }
                });
            }
        });
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Update charts on window resize
        Object.values(this.uiService.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }
    
    /**
     * Update worker with current state
     */
    updateWorker() {
        if (!this.worker) return;
        
        const state = store.getState();
        const assets = {};
        
        // Portfolio.assets is a regular object now, not a Map
        for (const symbol in state.portfolio.assets) {
            const asset = state.portfolio.assets[symbol];
            assets[symbol] = {
                symbol,
                type: asset.type,
                price: asset.price,
                volatility: asset.volatility
            };
        }
        
        this.worker.postMessage({
            type: 'start',
            data: {
                baseVolatility: AppConfig.baseVolatility,
                speedMultiplier: state.settings.speedMultiplier,
                assets
            }
        });
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}