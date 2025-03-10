/**
 * Price Update Worker
 *
 * This worker handles cryptocurrency price updates in the background,
 * freeing the main thread from this computation.
 */

// Configuration variables
let speedMultiplier = 1;
let baseVolatility = 0.02;
let updateIntervalId = null;
let cryptoBalances = null;

/**
 * Calculate the update interval based on speed multiplier
 */
function getUpdateInterval() {
    return Math.max(50, Math.floor(1000 / speedMultiplier));
}

/**
 * Update a single cryptocurrency price
 */
function updatePrice(currentPrice) {
    try {
        const volatility = baseVolatility;
        const change = (Math.random() - 0.5) * 2 * volatility;
        const newPrice = currentPrice * (1 + change);
        return +newPrice.toFixed(8);
    } catch (error) {
        console.error('Error updating price:', error);
        return currentPrice;
    }
}

/**
 * Update all cryptocurrency prices
 */
function updateAllPrices(balances) {
    try {
        const updates = {};
        Object.entries(balances).forEach(([crypto, data]) => {
            const previousPrice = data.price;
            const newPrice = updatePrice(previousPrice);
            updates[crypto] = {
                previousPrice,
                newPrice
            };
            data.price = newPrice;
        });
        return { cryptoBalances: balances, updates };
    } catch (error) {
        console.error('Error updating all prices:', error);
        return { cryptoBalances: balances, updates: {} };
    }
}

/**
 * Start the price update interval
 */
function startUpdates() {
    if (updateIntervalId) {
        clearInterval(updateIntervalId);
    }
    
    updateIntervalId = setInterval(() => {
        if (!cryptoBalances) return;
        
        try {
            const result = updateAllPrices(cryptoBalances);
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

// Handle messages from the main thread
self.onmessage = function(e) {
    try {
        const { type, data } = e.data;
        
        switch (type) {
            case 'start':
                baseVolatility = data.baseVolatility || 0.02;
                speedMultiplier = data.speedMultiplier || 1;
                // Make a deep copy of the crypto balances to avoid reference issues
                cryptoBalances = JSON.parse(JSON.stringify(data.cryptoBalances));
                startUpdates();
                
                // Acknowledge receipt of data
                self.postMessage({
                    type: 'started',
                    data: { message: 'Price updates started' }
                });
                break;
                
            case 'updateSpeed':
                speedMultiplier = data.multiplier;
                startUpdates(); // Restart with new interval
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