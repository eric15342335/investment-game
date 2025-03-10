export class Calculations {
    static calculateSMA(prices, length) {
        if (prices.length < length) return null;
        const lastPrices = prices.slice(-length);
        return lastPrices.reduce((sum, price) => sum + price, 0) / length;
    }

    static calculateRSI(prices, length) {
        if (prices.length < length + 1) return null;

        const changes = prices.slice(-length - 1).map((price, i, arr) =>
            i === 0 ? 0 : price - arr[i-1]
        ).slice(1);

        const gains = changes.filter(c => c > 0);
        const losses = changes.filter(c => c < 0).map(Math.abs);

        if (losses.length === 0) return 100;
        if (gains.length === 0) return 0;

        const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / length;
        const avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / length;
        
        const rs = avgGain / avgLoss;
        return Math.min(100, Math.max(0, 100 - (100 / (1 + rs))));
    }

    static formatNumber(number) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(number);
    }
}