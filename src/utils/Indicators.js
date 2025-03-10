/**
 * Indicators - Technical analysis indicators for trading strategies
 */
export class Indicators {
    /**
     * Calculate Simple Moving Average (SMA)
     * @param {Array} prices - Array of price data points
     * @param {Number} length - Period length for SMA calculation
     * @returns {Number|null} - SMA value or null if not enough data points
     */
    static calculateSMA(prices, length) {
        if (prices.length < length) return null;
        const lastPrices = prices.slice(-length);
        return lastPrices.reduce((sum, price) => sum + price, 0) / length;
    }

    /**
     * Calculate Exponential Moving Average (EMA)
     * @param {Array} prices - Array of price data points
     * @param {Number} length - Period length for EMA calculation
     * @returns {Number|null} - EMA value or null if not enough data points
     */
    static calculateEMA(prices, length) {
        if (prices.length < length) return null;
        
        const k = 2 / (length + 1); // Smoothing factor
        
        // Start with SMA for the initial EMA value
        let ema = this.calculateSMA(prices.slice(0, length), length);
        
        // Calculate EMA for remaining prices
        for (let i = length; i < prices.length; i++) {
            ema = (prices[i] - ema) * k + ema;
        }
        
        return ema;
    }

    /**
     * Calculate Relative Strength Index (RSI)
     * @param {Array} prices - Array of price data points
     * @param {Number} length - Period length for RSI calculation
     * @returns {Number|null} - RSI value (0-100) or null if not enough data points
     */
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
    
    /**
     * Calculate Moving Average Convergence Divergence (MACD)
     * @param {Array} prices - Array of price data points
     * @param {Number} fastLength - Fast EMA length (default: 12)
     * @param {Number} slowLength - Slow EMA length (default: 26)
     * @param {Number} signalLength - Signal line length (default: 9)
     * @returns {Object|null} - MACD values or null if not enough data points
     */
    static calculateMACD(prices, fastLength = 12, slowLength = 26, signalLength = 9) {
        if (prices.length < Math.max(fastLength, slowLength) + signalLength) return null;
        
        const fastEMA = this.calculateEMA(prices, fastLength);
        const slowEMA = this.calculateEMA(prices, slowLength);
        
        if (fastEMA === null || slowEMA === null) return null;
        
        const macdLine = fastEMA - slowEMA;
        
        // Calculate signal line (EMA of MACD line)
        // For this simplified version, we'll use the current MACD value
        const signalLine = macdLine;
        
        // Calculate histogram (MACD line - signal line)
        const histogram = macdLine - signalLine;
        
        return {
            macd: macdLine,
            signal: signalLine,
            histogram: histogram
        };
    }
    
    /**
     * Calculate Bollinger Bands
     * @param {Array} prices - Array of price data points
     * @param {Number} length - Period length (default: 20)
     * @param {Number} stdDev - Standard deviation multiplier (default: 2)
     * @returns {Object|null} - Bollinger Bands values or null if not enough data points
     */
    static calculateBollingerBands(prices, length = 20, stdDev = 2) {
        if (prices.length < length) return null;
        
        const sma = this.calculateSMA(prices.slice(-length), length);
        
        // Calculate standard deviation
        const squaredDifferences = prices.slice(-length).map(price => Math.pow(price - sma, 2));
        const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / length;
        const standardDeviation = Math.sqrt(variance);
        
        return {
            middle: sma,
            upper: sma + (standardDeviation * stdDev),
            lower: sma - (standardDeviation * stdDev)
        };
    }
    
    /**
     * Format number with proper decimals and commas
     * @param {Number} number - Number to format
     * @param {Number} minDecimals - Minimum decimal places
     * @param {Number} maxDecimals - Maximum decimal places
     * @returns {String} - Formatted number string
     */
    static formatNumber(number, minDecimals = 2, maxDecimals = 2) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: minDecimals,
            maximumFractionDigits: maxDecimals
        }).format(number);
    }
    
    /**
     * Format price based on its magnitude
     * @param {Number} price - Price to format
     * @returns {String} - Formatted price string
     */
    static formatPrice(price) {
        if (price >= 1000) {
            return this.formatNumber(price, 2, 2);
        } else if (price >= 1) {
            return this.formatNumber(price, 2, 4);
        } else {
            return this.formatNumber(price, 6, 8);
        }
    }
}