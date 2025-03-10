/**
 * PriceService - Maintained for backward compatibility
 * Price updates are now handled by a Web Worker (see workers/priceWorker.js)
 */
export class PriceService {
    constructor(baseVolatility, speedMultiplier) {
        console.warn('PriceService is deprecated. Price updates are now handled by a Web Worker.');
        this.baseVolatility = baseVolatility;
        this.speedMultiplier = speedMultiplier;
    }

    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = parseFloat(multiplier);
    }

    getUpdateInterval() {
        return Math.max(50, Math.floor(1000 / this.speedMultiplier));
    }

    // These methods are kept for backward compatibility but should not be used
    updatePrice(currentPrice) {
        console.warn('PriceService.updatePrice is deprecated. Price updates are now handled by a Web Worker.');
        return currentPrice;
    }

    updateAllPrices(cryptoBalances) {
        console.warn('PriceService.updateAllPrices is deprecated. Price updates are now handled by a Web Worker.');
        return {};
    }
}