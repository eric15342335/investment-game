/**
 * Moving Average Crossover Trading Strategy
 * Generates signals based on SMA crossovers
 */
import { TradingStrategy } from './TradingStrategy.js';
import { Indicators } from '../utils/Indicators.js';

export class MovingAverageStrategy extends TradingStrategy {
    constructor(config = {}) {
        super({
            name: 'Moving Average Crossover',
            description: 'Generate signals based on SMA crossovers',
            parameters: {
                shortPeriod: config.shortPeriod || 10,
                longPeriod: config.longPeriod || 20,
                signalThreshold: config.signalThreshold || 0.002 // 0.2% threshold
            }
        });
    }
    
    evaluate(asset, portfolio) {
        if (!this.isActive || !asset.chartData || !asset.chartData.price) {
            return null;
        }
        
        const prices = asset.chartData.price;
        const { shortPeriod, longPeriod, signalThreshold } = this.parameters;
        
        // Calculate moving averages
        const shortSMA = Indicators.calculateSMA(prices, shortPeriod);
        const longSMA = Indicators.calculateSMA(prices, longPeriod);
        
        if (!shortSMA || !longSMA) {
            return null;
        }
        
        const currentPrice = prices[prices.length - 1];
        const crossoverPercentage = (shortSMA - longSMA) / longSMA;
        
        // Generate trading signals
        if (Math.abs(crossoverPercentage) >= signalThreshold) {
            if (crossoverPercentage > 0) {
                // Bullish signal - Buy
                const usdAvailable = portfolio.usdBalance * 0.1; // Use 10% of available USD
                if (usdAvailable >= 10) { // Minimum trade size
                    return {
                        type: 'BUY',
                        reason: 'Short-term MA crossed above long-term MA',
                        usdAmount: usdAvailable,
                        price: currentPrice
                    };
                }
            } else {
                // Bearish signal - Sell
                const assetAmount = asset.amount * 0.1; // Sell 10% of holdings
                if (assetAmount > 0) {
                    return {
                        type: 'SELL',
                        reason: 'Short-term MA crossed below long-term MA',
                        assetAmount: assetAmount,
                        price: currentPrice
                    };
                }
            }
        }
        
        return null;
    }
}