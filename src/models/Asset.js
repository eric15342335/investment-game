/**
 * Base Asset class representing any tradable asset
 */
export class Asset {
    /**
     * Create a new asset
     * @param {Object} config - Asset configuration
     * @param {String} config.symbol - Asset symbol
     * @param {String} config.name - Full asset name
     * @param {String} config.type - Asset type (crypto, stock, etc.)
     * @param {Number} config.defaultPrice - Default starting price
     * @param {String} config.color - Asset color for UI
     * @param {String} config.icon - Material icon name
     * @param {Number} config.volatility - Relative volatility factor
     */
    constructor(config) {
        this.symbol = config.symbol;
        this.name = config.name;
        this.type = config.type;
        this.price = config.defaultPrice;
        this.color = config.color;
        this.icon = config.icon;
        this.volatility = config.volatility || 1.0;
        
        // User's balance of this asset
        this.amount = 0;
        
        // Price history data
        this.priceHistory = [];
        
        // Chart data for this asset
        this.chartData = null;
    }
    
    /**
     * Update the price with a random change based on volatility
     * @param {Number} baseVolatility - Base volatility factor
     * @returns {Object} - Price update information
     */
    updatePrice(baseVolatility) {
        const previousPrice = this.price;
        const volatility = baseVolatility * this.volatility;
        const change = (Math.random() - 0.5) * 2 * volatility;
        const newPrice = previousPrice * (1 + change);
        
        this.price = +newPrice.toFixed(8);
        return {
            previousPrice,
            newPrice: this.price,
            percentChange: ((this.price - previousPrice) / previousPrice * 100).toFixed(2)
        };
    }
    
    /**
     * Get the current market value of the holding
     * @returns {Number} - Market value in USD
     */
    getMarketValue() {
        // Ensure both price and amount are valid numbers
        const amount = parseFloat(this.amount);
        const price = parseFloat(this.price);
        
        // Handle potential NaN values
        if (isNaN(amount) || isNaN(price) || !isFinite(amount) || !isFinite(price)) {
            return 0;
        }
        
        return amount * price;
    }
    
    /**
     * Buy a specified amount in USD
     * @param {Number} usdAmount - Amount to buy in USD
     * @returns {Object} - Transaction details
     */
    buy(usdAmount) {
        if (usdAmount <= 0) {
            throw new Error('Invalid amount');
        }
        
        const amountToBuy = usdAmount / this.price;
        this.amount += amountToBuy;
        
        return {
            type: 'BUY',
            symbol: this.symbol,
            assetAmount: amountToBuy,
            usdAmount: usdAmount,
            price: this.price
        };
    }
    
    /**
     * Sell a specified amount of the asset
     * @param {Number} assetAmount - Amount of asset to sell
     * @returns {Object} - Transaction details
     */
    sell(assetAmount) {
        if (assetAmount <= 0 || assetAmount > this.amount) {
            throw new Error('Invalid amount');
        }
        
        const usdAmount = assetAmount * this.price;
        this.amount -= assetAmount;
        
        return {
            type: 'SELL',
            symbol: this.symbol,
            assetAmount: assetAmount,
            usdAmount: usdAmount,
            price: this.price
        };
    }
    
    /**
     * Update chart data with new price information
     * @param {String} time - Time label for the data point
     * @param {Object} indicators - Technical indicators to include
     * @returns {Object} - Updated chart data
     */
    updateChartData(time, indicators = {}) {
        if (!this.chartData) {
            // Initialize chart data object if it doesn't exist
            this.chartData = {
                labels: [time],
                price: [this.price],
                volume: [0],
                open: [this.price],
                high: [this.price],
                low: [this.price],
                close: [this.price],
                ...indicators
            };
        } else {
            // Add new data point
            this.chartData.labels.push(time);
            this.chartData.price.push(this.price);
            
            // For candlestick data (simulate for now)
            const lastClose = this.chartData.close[this.chartData.close.length - 1];
            const open = lastClose;
            const high = Math.max(open, this.price) * (1 + Math.random() * 0.005);
            const low = Math.min(open, this.price) * (1 - Math.random() * 0.005);
            const close = this.price;
            
            this.chartData.open.push(open);
            this.chartData.high.push(high);
            this.chartData.low.push(low);
            this.chartData.close.push(close);
            
            // Generate fake volume
            const volume = Math.random() * 100 * (1 + Math.abs(this.price - lastClose) / lastClose * 10);
            this.chartData.volume.push(volume);
            
            // Add indicators if provided
            Object.keys(indicators).forEach(indicator => {
                if (!this.chartData[indicator]) {
                    this.chartData[indicator] = [];
                }
                this.chartData[indicator].push(indicators[indicator]);
            });
            
            // Calculate SMA
            if (this.chartData.price.length >= 20) {
                const smaValues = this.chartData.price.slice(-20);
                const sma = smaValues.reduce((sum, val) => sum + val, 0) / smaValues.length;
                
                if (!this.chartData.sma) {
                    this.chartData.sma = new Array(this.chartData.price.length - 1).fill(null);
                    this.chartData.sma.push(sma);
                } else {
                    this.chartData.sma.push(sma);
                }
            } else if (this.chartData.sma) {
                this.chartData.sma.push(null);
            }
            
            // Calculate RSI
            if (this.chartData.price.length >= 14) {
                const rsiValues = this.chartData.price.slice(-15);
                const changes = [];
                
                for (let i = 1; i < rsiValues.length; i++) {
                    changes.push(rsiValues[i] - rsiValues[i-1]);
                }
                
                const gains = changes.map(c => c > 0 ? c : 0);
                const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
                
                const avgGain = gains.reduce((sum, val) => sum + val, 0) / 14;
                const avgLoss = losses.reduce((sum, val) => sum + val, 0) / 14;
                
                if (avgLoss === 0) {
                    // Prevent division by zero
                    if (!this.chartData.rsi) {
                        this.chartData.rsi = [];
                    }
                    this.chartData.rsi.push(100);
                } else {
                    const rs = avgGain / avgLoss;
                    const rsi = 100 - (100 / (1 + rs));
                    
                    if (!this.chartData.rsi) {
                        this.chartData.rsi = new Array(this.chartData.price.length - 1).fill(null);
                        this.chartData.rsi.push(rsi);
                    } else {
                        this.chartData.rsi.push(rsi);
                    }
                }
            } else if (this.chartData.rsi) {
                this.chartData.rsi.push(null);
            }
            
            // Limit data points to prevent memory issues
            const maxPoints = 100;
            if (this.chartData.labels.length > maxPoints) {
                Object.keys(this.chartData).forEach(key => {
                    if (Array.isArray(this.chartData[key])) {
                        this.chartData[key] = this.chartData[key].slice(-maxPoints);
                    }
                });
            }
        }
        
        return this.chartData;
    }
    
    /**
     * Get serializable data for saving
     * @returns {Object} - Serializable asset data
     */
    toJSON() {
        return {
            symbol: this.symbol,
            type: this.type,
            price: this.price,
            amount: this.amount,
            chartData: this.chartData
        };
    }
    
    /**
     * Create an asset instance from saved data
     * @param {Object} data - Saved asset data
     * @param {Object} config - Asset configuration
     * @returns {Asset} - Restored asset instance
     */
    static fromJSON(data, config) {
        const asset = new Asset(config);
        asset.price = data.price;
        asset.amount = data.amount;
        asset.chartData = data.chartData;
        return asset;
    }
}