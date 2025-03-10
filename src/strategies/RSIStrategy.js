/**
 * RSI-Based Trading Strategy
 * Generates signals based on RSI overbought/oversold conditions
 */
import { TradingStrategy } from './TradingStrategy.js';
import { Indicators } from '../utils/Indicators.js';

export class RSIStrategy extends TradingStrategy {
    constructor(config = {}) {
        super({
            name: 'RSI Strategy',
            description: 'Generate signals based on RSI overbought/oversold conditions',
            parameters: {
                period: config.period || 14,
                overbought: config.overbought || 70,
                oversold: config.oversold || 30,
                cooldownPeriod: config.cooldownPeriod || 6 // Periods to wait after signal
            }
        });
        
        this.lastSignalIndex = -1;
    }
    
    evaluate(asset, portfolio) {
        if (!this.isActive || !asset.chartData || !asset.chartData.price) {
            return null;
        }
        
        const prices = asset.chartData.price;
        const { period, overbought, oversold, cooldownPeriod } = this.parameters;
        
        // Calculate RSI
        const rsi = Indicators.calculateRSI(prices, period);
        
        if (!rsi) {
            return null;
        }
        
        // Check if enough time has passed since last signal
        if (prices.length - this.lastSignalIndex <= cooldownPeriod) {
            return null;
        }
        
        const currentPrice = prices[prices.length - 1];
        
        // Generate trading signals
        if (rsi >= overbought) {
            // Overbought condition - Sell signal
            const assetAmount = asset.amount * 0.25; // Sell 25% of holdings
            if (assetAmount > 0) {
                this.lastSignalIndex = prices.length - 1;
                return {
                    type: 'SELL',
                    reason: `RSI overbought at ${rsi.toFixed(2)}`,
                    assetAmount: assetAmount,
                    price: currentPrice,
                    indicators: { rsi }
                };
            }
        } else if (rsi <= oversold) {
            // Oversold condition - Buy signal
            const usdAvailable = portfolio.usdBalance * 0.25; // Use 25% of available USD
            if (usdAvailable >= 10) { // Minimum trade size
                this.lastSignalIndex = prices.length - 1;
                return {
                    type: 'BUY',
                    reason: `RSI oversold at ${rsi.toFixed(2)}`,
                    usdAmount: usdAvailable,
                    price: currentPrice,
                    indicators: { rsi }
                };
            }
        }
        
        return null;
    }
    
    /**
     * Check if the RSI is in extreme territory
     * @param {Number} rsi - Current RSI value
     * @returns {Object|null} - Extreme condition info or null
     */
    checkExtremeConditions(rsi) {
        const { overbought, oversold } = this.parameters;
        
        if (rsi >= overbought) {
            return {
                condition: 'overbought',
                value: rsi,
                threshold: overbought
            };
        } else if (rsi <= oversold) {
            return {
                condition: 'oversold',
                value: rsi,
                threshold: oversold
            };
        }
        
        return null;
    }
    
    /**
     * Override toJSON to include lastSignalIndex
     */
    toJSON() {
        return {
            ...super.toJSON(),
            lastSignalIndex: this.lastSignalIndex
        };
    }
}