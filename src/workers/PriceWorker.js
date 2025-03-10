/**
 * Price Update Worker
 * Handles background price updates for all assets
 */

// Configuration
let config = {
    speedMultiplier: 1,
    baseVolatility: 0.02,
    updateInterval: null,
    assets: null
};

/**
 * Calculate update interval based on speed multiplier
 * @returns {Number} - Interval in milliseconds
 */
function getUpdateInterval() {
    return Math.max(50, Math.floor(1000 / config.speedMultiplier));
}

/**
 * Update price based on asset type and volatility
 * @param {Object} asset - Asset to update
 * @returns {Number} - New price
 */
function updatePrice(asset) {
    try {
        // Base volatility adjusted by asset's relative volatility
        let volatility = config.baseVolatility * (asset.volatility || 1);
        
        // Random price change
        const change = (Math.random() - 0.5) * 2 * volatility;
        
        // Additional factors based on asset type
        let additionalFactor = 0;
        
        switch (asset.type) {
            case 'crypto':
                // Cryptocurrencies have higher volatility during certain periods
                if (Math.random() < 0.05) { // 5% chance of volatility spike
                    additionalFactor = (Math.random() - 0.5) * volatility * 2;
                }
                break;
                
            case 'stock':
                // Stocks tend to have momentum in price movements
                if (asset.lastChange) {
                    additionalFactor = asset.lastChange * 0.2; // 20% momentum factor
                }
                break;
                
            case 'forex':
                // Forex has lower volatility but more consistent trends
                additionalFactor = asset.lastChange ? asset.lastChange * 0.4 : 0;
                volatility *= 0.5; // Reduce base volatility
                break;
                
            case 'commodity':
                // Commodities can have sudden supply/demand shocks
                if (Math.random() < 0.02) { // 2% chance of supply/demand shock
                    additionalFactor = (Math.random() - 0.5) * volatility * 3;
                }
                break;
        }
        
        // Calculate final price change
        const totalChange = change + additionalFactor;
        const newPrice = asset.price * (1 + totalChange);
        
        // Store last change for momentum calculations
        asset.lastChange = totalChange;
        
        return +newPrice.toFixed(8);
    } catch (error) {
        console.error('Error updating price:', error);
        return asset.price;
    }
}

/**
 * Generate simulated volume
 * @param {Object} asset - Asset to generate volume for 
 * @param {Number} priceChange - Price change percentage
 * @returns {Number} - Simulated volume
 */
function generateVolume(asset, priceChange) {
    // Base volume varies by asset type
    let baseVolume;
    switch (asset.type) {
        case 'crypto':
            baseVolume = asset.price < 1 ? 1000000 : 1000;
            break;
        case 'stock':
            baseVolume = 10000;
            break;
        case 'forex':
            baseVolume = 100000;
            break;
        case 'commodity':
            baseVolume = 1000;
            break;
        default:
            baseVolume = 1000;
    }
    
    // Volume increases with price volatility
    const volatilityFactor = 1 + Math.abs(priceChange) * 10;
    
    // Random variation
    const randomFactor = 0.5 + Math.random();
    
    return Math.floor(baseVolume * volatilityFactor * randomFactor);
}

/**
 * Generate candlestick data
 * @param {Object} asset - Asset to generate data for
 * @param {Number} newPrice - New closing price
 * @returns {Object} - OHLC data
 */
function generateCandlestick(asset, newPrice) {
    const prevClose = asset.price;
    const change = (newPrice - prevClose) / prevClose;
    
    // Generate realistic OHLC data
    const open = prevClose;
    const close = newPrice;
    const high = Math.max(open, close) * (1 + Math.random() * 0.002);
    const low = Math.min(open, close) * (1 - Math.random() * 0.002);
    
    return { open, high, low, close };
}

/**
 * Update all asset prices
 * @param {Object} assets - Map of assets to update
 * @returns {Object} - Updated prices and additional data
 */
function updateAllPrices(assets) {
    try {
        const updates = {};
        
        Object.entries(assets).forEach(([symbol, asset]) => {
            const previousPrice = asset.price;
            const newPrice = updatePrice(asset);
            const priceChange = (newPrice - previousPrice) / previousPrice;
            
            updates[symbol] = {
                previousPrice,
                newPrice,
                change: priceChange,
                volume: generateVolume(asset, priceChange),
                ...generateCandlestick(asset, newPrice)
            };
            
            asset.price = newPrice;
        });
        
        return { assets, updates };
    } catch (error) {
        console.error('Error updating all prices:', error);
        return { assets, updates: {} };
    }
}

/**
 * Start price updates
 */
function startUpdates() {
    if (config.updateInterval) {
        clearInterval(config.updateInterval);
    }
    
    config.updateInterval = setInterval(() => {
        if (!config.assets) return;
        
        try {
            const result = updateAllPrices(config.assets);
            self.postMessage({
                type: 'update',
                data: result
            });
        } catch (error) {
            self.postMessage({
                type: 'error',
                data: { message: error.message }
            });
        }
    }, getUpdateInterval());
}

// Handle messages from main thread
self.onmessage = function(e) {
    try {
        const { type, data } = e.data;
        
        switch (type) {
            case 'start':
                config.baseVolatility = data.baseVolatility || 0.02;
                config.speedMultiplier = data.speedMultiplier || 1;
                config.assets = JSON.parse(JSON.stringify(data.assets));
                startUpdates();
                
                self.postMessage({
                    type: 'started',
                    data: { message: 'Price updates started' }
                });
                break;
                
            case 'updateSpeed':
                config.speedMultiplier = data.multiplier;
                startUpdates();
                break;
                
            default:
                console.warn('Unknown message type:', type);
        }
    } catch (error) {
        self.postMessage({
            type: 'error',
            data: { message: error.message }
        });
    }
};

// Handle errors
self.onerror = function(error) {
    self.postMessage({
        type: 'error',
        data: { message: error.message }
    });
};