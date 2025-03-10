/**
 * Base Trading Strategy class
 * Implements the Strategy design pattern
 */
export class TradingStrategy {
    /**
     * Create a new trading strategy
     * @param {Object} config - Strategy configuration
     */
    constructor(config = {}) {
        this.name = config.name || 'Base Strategy';
        this.description = config.description || 'Base trading strategy';
        this.isActive = false;
        this.parameters = config.parameters || {};
    }
    
    /**
     * Activate the strategy
     */
    activate() {
        this.isActive = true;
    }
    
    /**
     * Deactivate the strategy
     */
    deactivate() {
        this.isActive = false;
    }
    
    /**
     * Update strategy parameters
     * @param {Object} params - New parameters
     */
    updateParameters(params) {
        this.parameters = { ...this.parameters, ...params };
    }
    
    /**
     * Evaluate current market condition and provide trading signal
     * @param {Asset} asset - Asset to evaluate
     * @param {Portfolio} portfolio - User's portfolio
     * @returns {Object|null} - Trading signal or null if no action
     */
    evaluate(asset, portfolio) {
        // Base strategy does nothing, should be overridden by subclasses
        return null;
    }
    
    /**
     * Get information about the strategy
     * @returns {Object} - Strategy information
     */
    getInfo() {
        return {
            name: this.name,
            description: this.description,
            parameters: this.parameters,
            isActive: this.isActive
        };
    }
    
    /**
     * Create a serializable representation of the strategy
     * @returns {Object} - Serializable strategy data
     */
    toJSON() {
        return {
            name: this.name,
            isActive: this.isActive,
            parameters: this.parameters
        };
    }
}