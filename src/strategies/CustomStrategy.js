/**
 * Custom Trading Strategy
 * Allows users to define their own trading rules using a combination of indicators
 */
import { TradingStrategy } from './TradingStrategy.js';
import { Indicators } from '../utils/Indicators.js';

export class CustomStrategy extends TradingStrategy {
    constructor(config = {}) {
        super({
            name: config.name || 'Custom Strategy',
            description: config.description || 'User-defined trading strategy',
            parameters: {
                ...config.parameters,
                rules: config.rules || []
            }
        });
        
        // Validate rules format
        this.validateRules();
    }
    
    /**
     * Validate trading rules format
     * @throws {Error} If rules are invalid
     */
    validateRules() {
        if (!Array.isArray(this.parameters.rules)) {
            throw new Error('Rules must be an array');
        }
        
        this.parameters.rules.forEach((rule, index) => {
            if (!rule.indicator || !rule.condition || !rule.action) {
                throw new Error(`Invalid rule at index ${index}`);
            }
            
            // Validate indicator
            if (!this.isValidIndicator(rule.indicator)) {
                throw new Error(`Invalid indicator in rule ${index}: ${rule.indicator}`);
            }
            
            // Validate condition
            if (!this.isValidCondition(rule.condition)) {
                throw new Error(`Invalid condition in rule ${index}: ${rule.condition}`);
            }
            
            // Validate action
            if (!this.isValidAction(rule.action)) {
                throw new Error(`Invalid action in rule ${index}: ${rule.action}`);
            }
        });
    }
    
    /**
     * Check if indicator is supported
     * @param {String} indicator - Indicator name
     * @returns {Boolean} - Whether indicator is valid
     */
    isValidIndicator(indicator) {
        return [
            'price',
            'sma',
            'ema',
            'rsi',
            'macd',
            'bollinger'
        ].includes(indicator);
    }
    
    /**
     * Check if condition is supported
     * @param {String} condition - Condition operator
     * @returns {Boolean} - Whether condition is valid
     */
    isValidCondition(condition) {
        return [
            'above',
            'below',
            'crossAbove',
            'crossBelow',
            'between',
            'outside'
        ].includes(condition);
    }
    
    /**
     * Check if action is supported
     * @param {String} action - Trading action
     * @returns {Boolean} - Whether action is valid
     */
    isValidAction(action) {
        return [
            'buy',
            'sell',
            'hold'
        ].includes(action);
    }
    
    /**
     * Evaluate indicator value based on rule
     * @param {Object} rule - Trading rule
     * @param {Asset} asset - Asset to evaluate
     * @returns {Object} - Indicator values
     */
    evaluateIndicator(rule, asset) {
        const prices = asset.chartData.price;
        
        switch (rule.indicator) {
            case 'price':
                return {
                    current: prices[prices.length - 1],
                    previous: prices[prices.length - 2]
                };
                
            case 'sma':
                return {
                    current: Indicators.calculateSMA(prices, rule.parameters?.period || 20),
                    previous: Indicators.calculateSMA(prices.slice(0, -1), rule.parameters?.period || 20)
                };
                
            case 'ema':
                return {
                    current: Indicators.calculateEMA(prices, rule.parameters?.period || 20),
                    previous: Indicators.calculateEMA(prices.slice(0, -1), rule.parameters?.period || 20)
                };
                
            case 'rsi':
                return {
                    current: Indicators.calculateRSI(prices, rule.parameters?.period || 14),
                    previous: Indicators.calculateRSI(prices.slice(0, -1), rule.parameters?.period || 14)
                };
                
            case 'macd':
                const currentMACD = Indicators.calculateMACD(
                    prices,
                    rule.parameters?.fastPeriod,
                    rule.parameters?.slowPeriod,
                    rule.parameters?.signalPeriod
                );
                const previousMACD = Indicators.calculateMACD(
                    prices.slice(0, -1),
                    rule.parameters?.fastPeriod,
                    rule.parameters?.slowPeriod,
                    rule.parameters?.signalPeriod
                );
                return { current: currentMACD, previous: previousMACD };
                
            case 'bollinger':
                const currentBB = Indicators.calculateBollingerBands(
                    prices,
                    rule.parameters?.period,
                    rule.parameters?.stdDev
                );
                const previousBB = Indicators.calculateBollingerBands(
                    prices.slice(0, -1),
                    rule.parameters?.period,
                    rule.parameters?.stdDev
                );
                return { current: currentBB, previous: previousBB };
                
            default:
                return { current: null, previous: null };
        }
    }
    
    /**
     * Check if condition is met
     * @param {Object} rule - Trading rule
     * @param {Object} indicatorValue - Indicator value
     * @returns {Boolean} - Whether condition is met
     */
    checkCondition(rule, indicatorValue) {
        const { condition, value, value2 } = rule;
        const current = indicatorValue.current;
        const previous = indicatorValue.previous;
        
        switch (condition) {
            case 'above':
                return current > value;
                
            case 'below':
                return current < value;
                
            case 'crossAbove':
                return previous < value && current > value;
                
            case 'crossBelow':
                return previous > value && current < value;
                
            case 'between':
                return current > value && current < value2;
                
            case 'outside':
                return current < value || current > value2;
                
            default:
                return false;
        }
    }
    
    /**
     * Generate trading signal based on rule
     * @param {Object} rule - Trading rule
     * @param {Asset} asset - Asset to trade
     * @param {Portfolio} portfolio - User's portfolio
     * @returns {Object|null} - Trading signal or null
     */
    generateSignal(rule, asset, portfolio) {
        const currentPrice = asset.price;
        
        switch (rule.action) {
            case 'buy':
                const usdAmount = portfolio.usdBalance * (rule.parameters?.allocation || 0.1);
                if (usdAmount >= 10) {
                    return {
                        type: 'BUY',
                        reason: rule.name || 'Custom strategy buy signal',
                        usdAmount,
                        price: currentPrice
                    };
                }
                break;
                
            case 'sell':
                const assetAmount = asset.amount * (rule.parameters?.allocation || 0.1);
                if (assetAmount > 0) {
                    return {
                        type: 'SELL',
                        reason: rule.name || 'Custom strategy sell signal',
                        assetAmount,
                        price: currentPrice
                    };
                }
                break;
        }
        
        return null;
    }
    
    evaluate(asset, portfolio) {
        if (!this.isActive || !asset.chartData || !asset.chartData.price) {
            return null;
        }
        
        // Evaluate each rule
        for (const rule of this.parameters.rules) {
            const indicatorValue = this.evaluateIndicator(rule, asset);
            
            if (indicatorValue.current === null) {
                continue;
            }
            
            if (this.checkCondition(rule, indicatorValue)) {
                const signal = this.generateSignal(rule, asset, portfolio);
                if (signal) {
                    return signal;
                }
            }
        }
        
        return null;
    }
}