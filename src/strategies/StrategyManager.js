/**
 * Strategy Manager
 * Manages and coordinates multiple trading strategies
 */
import { MovingAverageStrategy } from './MovingAverageStrategy.js';
import { RSIStrategy } from './RSIStrategy.js';
import { CustomStrategy } from './CustomStrategy.js';

export class StrategyManager {
    constructor() {
        this.strategies = new Map();
        this.activeStrategies = new Set();
        
        // Initialize default strategies
        this.initializeDefaultStrategies();
    }
    
    /**
     * Initialize default trading strategies
     */
    initializeDefaultStrategies() {
        // Simple Moving Average strategy
        this.addStrategy(new MovingAverageStrategy({
            shortPeriod: 10,
            longPeriod: 20,
            signalThreshold: 0.002
        }));
        
        // RSI strategy
        this.addStrategy(new RSIStrategy({
            period: 14,
            overbought: 70,
            oversold: 30,
            cooldownPeriod: 6
        }));
    }
    
    /**
     * Add a new strategy
     * @param {TradingStrategy} strategy - Strategy to add
     */
    addStrategy(strategy) {
        this.strategies.set(strategy.name, strategy);
    }
    
    /**
     * Remove a strategy
     * @param {String} strategyName - Name of strategy to remove
     */
    removeStrategy(strategyName) {
        this.strategies.delete(strategyName);
        this.activeStrategies.delete(strategyName);
    }
    
    /**
     * Activate a strategy
     * @param {String} strategyName - Name of strategy to activate
     */
    activateStrategy(strategyName) {
        const strategy = this.strategies.get(strategyName);
        if (strategy) {
            strategy.activate();
            this.activeStrategies.add(strategyName);
        }
    }
    
    /**
     * Deactivate a strategy
     * @param {String} strategyName - Name of strategy to deactivate
     */
    deactivateStrategy(strategyName) {
        const strategy = this.strategies.get(strategyName);
        if (strategy) {
            strategy.deactivate();
            this.activeStrategies.delete(strategyName);
        }
    }
    
    /**
     * Update strategy parameters
     * @param {String} strategyName - Name of strategy to update
     * @param {Object} parameters - New parameters
     */
    updateStrategyParameters(strategyName, parameters) {
        const strategy = this.strategies.get(strategyName);
        if (strategy) {
            strategy.updateParameters(parameters);
        }
    }
    
    /**
     * Create a new custom strategy
     * @param {Object} config - Strategy configuration
     * @returns {CustomStrategy} - New custom strategy instance
     */
    createCustomStrategy(config) {
        const strategy = new CustomStrategy(config);
        this.addStrategy(strategy);
        return strategy;
    }
    
    /**
     * Get all available strategies
     * @returns {Array} - Array of strategy info objects
     */
    getAvailableStrategies() {
        return Array.from(this.strategies.values()).map(strategy => strategy.getInfo());
    }
    
    /**
     * Get active strategies
     * @returns {Array} - Array of active strategy instances
     */
    getActiveStrategies() {
        return Array.from(this.activeStrategies).map(name => this.strategies.get(name));
    }
    
    /**
     * Evaluate all active strategies for an asset
     * @param {Asset} asset - Asset to evaluate
     * @param {Portfolio} portfolio - User's portfolio
     * @returns {Array} - Array of trading signals
     */
    evaluateStrategies(asset, portfolio) {
        const signals = [];
        
        this.getActiveStrategies().forEach(strategy => {
            const signal = strategy.evaluate(asset, portfolio);
            if (signal) {
                signals.push({
                    ...signal,
                    strategy: strategy.name
                });
            }
        });
        
        return signals;
    }
    
    /**
     * Get strategy performance metrics
     * @param {String} strategyName - Name of strategy
     * @param {Array} trades - Trade history
     * @returns {Object} - Performance metrics
     */
    getStrategyPerformance(strategyName, trades) {
        const strategyTrades = trades.filter(trade => trade.strategy === strategyName);
        
        if (strategyTrades.length === 0) {
            return {
                totalTrades: 0,
                winRate: 0,
                profitFactor: 0,
                averageReturn: 0
            };
        }
        
        const profits = strategyTrades.filter(trade => trade.profit > 0);
        const losses = strategyTrades.filter(trade => trade.profit < 0);
        
        const totalProfit = profits.reduce((sum, trade) => sum + trade.profit, 0);
        const totalLoss = Math.abs(losses.reduce((sum, trade) => sum + trade.profit, 0));
        
        return {
            totalTrades: strategyTrades.length,
            winRate: (profits.length / strategyTrades.length * 100).toFixed(2),
            profitFactor: totalLoss === 0 ? Infinity : (totalProfit / totalLoss).toFixed(2),
            averageReturn: (strategyTrades.reduce((sum, trade) => sum + trade.profit, 0) / strategyTrades.length).toFixed(2)
        };
    }
    
    /**
     * Serialize strategy manager state
     * @returns {Object} - Serializable state
     */
    toJSON() {
        const strategiesData = {};
        this.strategies.forEach((strategy, name) => {
            strategiesData[name] = strategy.toJSON();
        });
        
        return {
            strategies: strategiesData,
            activeStrategies: Array.from(this.activeStrategies)
        };
    }
    
    /**
     * Load strategy manager state
     * @param {Object} data - Saved state data
     */
    static fromJSON(data) {
        const manager = new StrategyManager();
        
        // Restore strategies
        if (data.strategies) {
            Object.entries(data.strategies).forEach(([name, strategyData]) => {
                const strategy = manager.strategies.get(name) || 
                               (strategyData.type === 'custom' ? new CustomStrategy(strategyData) : null);
                               
                if (strategy) {
                    strategy.updateParameters(strategyData.parameters);
                    if (data.activeStrategies.includes(name)) {
                        strategy.activate();
                        manager.activeStrategies.add(name);
                    }
                }
            });
        }
        
        return manager;
    }
}