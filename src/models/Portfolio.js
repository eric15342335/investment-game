/**
 * Portfolio - Manages user's portfolio of assets with Observer pattern
 */
import { AppConfig } from '../config/AppConfig.js';
import { Asset } from './Asset.js';

export class Portfolio {
    /**
     * Create a new portfolio
     * @param {Number} initialUSDBalance - Initial USD balance
     */
    constructor(initialUSDBalance = AppConfig.initialUSDBalance) {
        this.usdBalance = initialUSDBalance;
        this.initialInvestment = initialUSDBalance;
        
        // Make sure we initialize assets properly
        this.assets = {}; // Changed from Map to object for better serialization and compatibility
        this.selectedAsset = null;
        this.history = [];
        this.valueHistory = [];
        
        // Observer pattern implementation
        this.observers = [];
    }
    
    /**
     * Add an asset to the portfolio
     * @param {Asset} asset - Asset to add
     */
    addAsset(asset) {
        this.assets[asset.symbol] = asset;
        if (!this.selectedAsset) {
            this.selectedAsset = asset.symbol;
        }
        console.log(`Asset added: ${asset.symbol}`);
    }
    
    /**
     * Get an asset by symbol
     * @param {String} symbol - Asset symbol
     * @returns {Asset} - Asset instance
     */
    getAsset(symbol) {
        return this.assets[symbol];
    }
    
    /**
     * Set the selected asset
     * @param {String} symbol - Asset symbol
     */
    selectAsset(symbol) {
        if (this.assets[symbol]) {
            console.log(`Selecting asset: ${symbol}`);
            this.selectedAsset = symbol;
            this.notifyObservers('assetSelected', { symbol });
        } else {
            console.warn(`Asset not found: ${symbol}`);
        }
    }
    
    /**
     * Get the currently selected asset
     * @returns {Asset} - Selected asset instance
     */
    getSelectedAsset() {
        return this.assets[this.selectedAsset];
    }
    
    /**
     * Buy asset with USD
     * @param {String} symbol - Asset symbol
     * @param {Number} usdAmount - Amount to spend in USD
     * @returns {Object} - Transaction details
     */
    buyAsset(symbol, usdAmount) {
        if (usdAmount <= 0) {
            throw new Error('Amount must be greater than 0');
        }
        
        if (usdAmount > this.usdBalance) {
            throw new Error('Insufficient USD balance');
        }
        
        const asset = this.assets[symbol];
        if (!asset) {
            console.error(`Asset ${symbol} not found`);
            throw new Error(`Asset ${symbol} not found`);
        }
        
        // Execute transaction
        const transaction = asset.buy(usdAmount);
        this.usdBalance -= usdAmount;
        
        // Record in history
        this.recordTransaction(transaction);
        
        // Notify observers
        this.notifyObservers('transaction', { transaction });
        
        return transaction;
    }
    
    /**
     * Sell asset for USD
     * @param {String} symbol - Asset symbol
     * @param {Number} assetAmount - Amount of asset to sell
     * @returns {Object} - Transaction details
     */
    sellAsset(symbol, assetAmount) {
        const asset = this.assets[symbol];
        if (!asset) {
            console.error(`Asset ${symbol} not found`);
            throw new Error(`Asset ${symbol} not found`);
        }
        
        if (assetAmount <= 0 || assetAmount > asset.amount) {
            throw new Error(`Invalid amount: ${assetAmount}`);
        }
        
        // Execute transaction
        const transaction = asset.sell(assetAmount);
        this.usdBalance += transaction.usdAmount;
        
        // Record in history
        this.recordTransaction(transaction);
        
        // Notify observers
        this.notifyObservers('transaction', { transaction });
        
        return transaction;
    }
    
    /**
     * Execute a stop-loss or take-profit order
     * @param {String} symbol - Asset symbol
     * @param {Object} order - Order details
     */
    executeOrder(symbol, order) {
        const asset = this.assets[symbol];
        if (!asset) {
            console.error(`Asset ${symbol} not found`);
            throw new Error(`Asset ${symbol} not found`);
        }
        
        let transaction;
        
        // Determine order type and execute appropriate action
        if (order.type === 'STOP_LOSS' && asset.price <= order.triggerPrice) {
            transaction = asset.sell(order.amount);
            this.usdBalance += transaction.usdAmount;
            transaction.orderType = 'STOP_LOSS';
        } else if (order.type === 'TAKE_PROFIT' && asset.price >= order.triggerPrice) {
            transaction = asset.sell(order.amount);
            this.usdBalance += transaction.usdAmount;
            transaction.orderType = 'TAKE_PROFIT';
        } else if (order.type === 'LIMIT_BUY' && asset.price <= order.triggerPrice) {
            const usdAmount = order.amount * asset.price;
            if (this.usdBalance >= usdAmount) {
                transaction = asset.buy(usdAmount);
                this.usdBalance -= usdAmount;
                transaction.orderType = 'LIMIT_BUY';
            }
        } else if (order.type === 'LIMIT_SELL' && asset.price >= order.triggerPrice) {
            transaction = asset.sell(order.amount);
            this.usdBalance += transaction.usdAmount;
            transaction.orderType = 'LIMIT_SELL';
        } else if (order.type === 'TRAILING_STOP' && 
                  (asset.price <= order.highWatermark * (1 - order.percentage / 100))) {
            transaction = asset.sell(order.amount);
            this.usdBalance += transaction.usdAmount;
            transaction.orderType = 'TRAILING_STOP';
        }
        
        if (transaction) {
            // Record in history
            this.recordTransaction(transaction);
            
            // Notify observers
            this.notifyObservers('orderExecuted', { transaction, order });
            
            return transaction;
        }
        
        return null;
    }
    
    /**
     * Execute DCA (Dollar Cost Average) buy
     * @param {String} symbol - Asset symbol
     * @param {Number} usdAmount - USD amount to invest
     * @returns {Object} - Transaction details or null if insufficient funds
     */
    executeDCA(symbol, usdAmount) {
        if (this.usdBalance < usdAmount) {
            return null;
        }
        
        try {
            const transaction = this.buyAsset(symbol, usdAmount);
            transaction.type = 'DCA';
            return transaction;
        } catch (error) {
            console.error('DCA execution failed:', error);
            return null;
        }
    }
    
    /**
     * Record a transaction in history
     * @param {Object} transaction - Transaction details
     */
    recordTransaction(transaction) {
        const timestamp = new Date();
        const historyEntry = {
            ...transaction,
            timestamp,
            portfolioValueAfter: this.getTotalValue()
        };
        
        this.history.push(historyEntry);
        
        // Limit history size
        if (this.history.length > 100) {
            this.history = this.history.slice(-100);
        }
    }
    
    /**
     * Record portfolio value at current time
     */
    recordPortfolioValue() {
        const timestamp = new Date();
        const value = this.getTotalValue();
        
        this.valueHistory.push({
            timestamp,
            value
        });
        
        // Limit history size
        if (this.valueHistory.length > 100) {
            this.valueHistory = this.valueHistory.slice(-100);
        }
    }
    
    /**
     * Calculate total portfolio value (USD + all assets)
     * @returns {Number} - Total value in USD
     */
    getTotalValue() {
        let assetsValue = 0;
        
        // Handle assets using proper object iteration
        for (const symbol in this.assets) {
            const asset = this.assets[symbol];
            // Make sure we have valid market values
            const marketValue = asset.getMarketValue();
            if (!isNaN(marketValue) && isFinite(marketValue)) {
                assetsValue += marketValue;
            }
        }
        
        // Make sure usdBalance is valid
        const balance = parseFloat(this.usdBalance);
        const validBalance = !isNaN(balance) ? balance : 0;
        
        return validBalance + assetsValue;
    }
    
    /**
     * Calculate Return on Investment (ROI)
     * @returns {Number} - ROI as a percentage
     */
    getROI() {
        const currentValue = this.getTotalValue();
        return ((currentValue - this.initialInvestment) / this.initialInvestment * 100);
    }
    
    /**
     * Get asset allocation percentages
     * @returns {Array} - Array of asset allocations
     */
    getAssetAllocation() {
        const totalValue = this.getTotalValue();
        const allocations = [];
        
        for (const symbol in this.assets) {
            const asset = this.assets[symbol];
            const marketValue = asset.getMarketValue();
            if (marketValue > 0) {
                allocations.push({
                    symbol: asset.symbol,
                    name: asset.name,
                    value: marketValue,
                    percentage: (marketValue / totalValue * 100).toFixed(2),
                    color: asset.color
                });
            }
        }
        
        // Add USD
        if (this.usdBalance > 0) {
            allocations.push({
                symbol: 'USD',
                name: 'US Dollar',
                value: this.usdBalance,
                percentage: (this.usdBalance / totalValue * 100).toFixed(2),
                color: '#16a34a'
            });
        }
        
        return allocations;
    }
    
    /**
     * Subscribe an observer to portfolio changes
     * @param {Object} observer - Observer object with update method
     */
    subscribe(observer) {
        this.observers.push(observer);
    }
    
    /**
     * Unsubscribe an observer
     * @param {Object} observer - Observer to remove
     */
    unsubscribe(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }
    
    /**
     * Notify all observers of an event
     * @param {String} event - Event name
     * @param {Object} data - Event data
     */
    notifyObservers(event, data) {
        this.observers.forEach(observer => {
            if (typeof observer.update === 'function') {
                observer.update(event, data);
            }
        });
    }
    
    /**
     * Serialize portfolio data for saving
     * @returns {Object} - Serializable portfolio data
     */
    toJSON() {
        const assetsData = {};
        // Iterate over the assets object
        for (const symbol in this.assets) {
            assetsData[symbol] = this.assets[symbol].toJSON();
        }
        
        return {
            usdBalance: this.usdBalance,
            initialInvestment: this.initialInvestment,
            selectedAsset: this.selectedAsset,
            assets: assetsData,
            history: this.history,
            valueHistory: this.valueHistory
        };
    }
    
    /**
     * Load portfolio from saved data
     * @param {Object} data - Saved portfolio data
     * @param {Object} assetConfigs - Asset configurations
     */
    static fromJSON(data, assetConfigs) {
        const portfolio = new Portfolio(data.initialInvestment);
        portfolio.usdBalance = data.usdBalance;
        portfolio.selectedAsset = data.selectedAsset;
        portfolio.history = data.history || [];
        portfolio.valueHistory = data.valueHistory || [];
        
        // Restore assets
        if (data.assets) {
            Object.entries(data.assets).forEach(([symbol, assetData]) => {
                if (assetConfigs[symbol]) {
                    const asset = Asset.fromJSON(assetData, assetConfigs[symbol]);
                    portfolio.addAsset(asset);
                }
            });
        }
        
        return portfolio;
    }
}