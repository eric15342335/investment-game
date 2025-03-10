/**
 * UI Update Service
 * Handles UI updates and DOM manipulation
 */
import { store, ActionTypes } from '../store/Store.js';
import { ChartManager } from '../utils/ChartManager.js';
import { Indicators } from '../utils/Indicators.js';

export class UIUpdateService {
    constructor() {
        this.elements = {};
        this.charts = {};
        this.lastPrices = new Map();
        
        // Subscribe to store updates
        store.subscribe(state => this.handleStateUpdate(state));
    }
    
    /**
     * Initialize UI elements
     * @param {Object} elements - DOM elements
     */
    initialize(elements) {
        this.elements = elements;
        this.initializeCharts();
        this.setupEventListeners();
    }
    
    /**
     * Initialize charts
     */
    initializeCharts() {
        const state = store.getState();
        const isDarkTheme = state.settings.theme === 'dark';
        const showIndicators = state.settings.indicators;
        
        // Price chart
        const selectedAsset = state.portfolio.getSelectedAsset();
        if (state.settings.chartType === 'candlestick') {
            this.charts.price = ChartManager.createCandlestickChart(
                this.elements.priceChart,
                selectedAsset.color,
                showIndicators.volume,
                isDarkTheme
            );
        } else {
            this.charts.price = ChartManager.createLineChart(
                this.elements.priceChart,
                selectedAsset.color,
                showIndicators.sma,
                isDarkTheme
            );
        }
        
        // RSI chart
        this.charts.rsi = ChartManager.createRSIChart(
            this.elements.rsiChart,
            isDarkTheme
        );
        
        // Portfolio chart
        this.charts.portfolio = ChartManager.createPortfolioChart(
            this.elements.portfolioChart,
            isDarkTheme
        );
        
        // Order book chart
        if (this.elements.orderBookChart) {
            this.charts.orderBook = ChartManager.createOrderBookChart(
                this.elements.orderBookChart,
                isDarkTheme
            );
        }
    }
    
    /**
     * Set up event listeners for UI controls
     */
    setupEventListeners() {
        // Asset selection
        document.querySelectorAll('.asset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Find the button element regardless of which child was clicked
                const button = e.currentTarget;
                const symbol = button.dataset.symbol;
                
                // Log for debugging
                console.log(`Asset button clicked: ${symbol}`);
                
                // Update UI immediately to provide feedback
                document.querySelectorAll('.asset-btn').forEach(b => {
                    b.classList.toggle('active', b === button);
                });
                
                store.dispatch({
                    type: ActionTypes.SELECT_ASSET,
                    payload: symbol
                });
            });
        });
        
        // Trade controls
        if (this.elements.buyBtn) {
            this.elements.buyBtn.addEventListener('click', () => this.executeBuy());
        }
        if (this.elements.sellBtn) {
            this.elements.sellBtn.addEventListener('click', () => this.executeSell());
        }
        
        // Strategy controls
        if (this.elements.strategySelect) {
            this.elements.strategySelect.addEventListener('change', (e) => {
                const strategy = e.target.value;
                if (e.target.checked) {
                    store.dispatch({
                        type: ActionTypes.ACTIVATE_STRATEGY,
                        payload: strategy
                    });
                } else {
                    store.dispatch({
                        type: ActionTypes.DEACTIVATE_STRATEGY,
                        payload: strategy
                    });
                }
            });
        }
        
        // Chart controls
        if (this.elements.chartType) {
            this.elements.chartType.addEventListener('change', (e) => {
                store.dispatch({
                    type: ActionTypes.UPDATE_CHART_TYPE,
                    payload: e.target.value
                });
            });
        }
        
        // Indicator toggles
        if (this.elements.indicatorToggles) {
            this.elements.indicatorToggles.forEach(toggle => {
                toggle.addEventListener('change', (e) => {
                    store.dispatch({
                        type: ActionTypes.TOGGLE_INDICATOR,
                        payload: e.target.dataset.indicator
                    });
                });
            });
        }
    }
    
    /**
     * Handle store state updates
     * @param {Object} state - New state
     */
    handleStateUpdate(state) {
        this.updateAssetDisplay(state);
        this.updatePortfolioDisplay(state);
        this.updateCharts(state);
        this.updateStrategyDisplay(state);
        this.updateTradeHistory(state);
    }
    
    /**
     * Update trade history display
     * @param {Object} state - Current state
     */
    updateTradeHistory(state) {
        if (!this.elements.history) return;
        
        const historyItems = state.portfolio.history.map(transaction => {
            const datetime = new Date(transaction.timestamp).toLocaleTimeString();
            return `
                <div class="history-item ${transaction.type === 'BUY' ? 'buy' : 'sell'}">
                    <div class="history-time">${datetime}</div>
                    <div class="history-action">
                        ${transaction.type} ${transaction.assetAmount.toFixed(8)} ${transaction.symbol}
                    </div>
                    <div class="history-value">
                        $${Indicators.formatNumber(transaction.usdAmount)}
                    </div>
                </div>
            `;
        }).join('');
        
        this.elements.history.innerHTML = historyItems.length ?
            historyItems :
            '<div class="empty-history">No trades yet</div>';
    }
    
    /**
     * Update asset display
     * @param {Object} state - Current state
     */
    updateAssetDisplay(state) {
        const selectedAsset = state.portfolio.getSelectedAsset();
        if (!selectedAsset) return;
        
        // Update asset buttons
        document.querySelectorAll('.asset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.symbol === selectedAsset.symbol);
        });
        
        // Update price display
        if (this.elements.selectedAsset) {
            this.elements.selectedAsset.textContent = selectedAsset.symbol;
        }
        if (this.elements.assetPrice) {
            this.elements.assetPrice.textContent = Indicators.formatPrice(selectedAsset.price);
        }
        
        // Update price trend
        const lastPrice = this.lastPrices.get(selectedAsset.symbol);
        if (lastPrice) {
            const trend = selectedAsset.price > lastPrice ? '↑' : '↓';
            const change = ((selectedAsset.price - lastPrice) / lastPrice * 100).toFixed(2);
            if (this.elements.priceTrend) {
                this.elements.priceTrend.textContent = `${trend} ${Math.abs(change)}%`;
                this.elements.priceTrend.className = `price-trend ${selectedAsset.price >= lastPrice ? '' : 'down'}`;
            }
        }
        
        this.lastPrices.set(selectedAsset.symbol, selectedAsset.price);
    }
    
    /**
     * Update portfolio display
     * @param {Object} state - Current state
     */
    updatePortfolioDisplay(state) {
        const portfolio = state.portfolio;
        
        // Update balance displays
        // Ensure we have valid numbers for the USD balance
        if (this.elements.usdBalance) {
            const balance = parseFloat(portfolio.usdBalance);
            this.elements.usdBalance.textContent = !isNaN(balance) ?
                Indicators.formatNumber(balance) : "0.00";
        }
        
        // Ensure we have a valid number for the total value
        if (this.elements.totalValue) {
            const totalValue = parseFloat(portfolio.getTotalValue());
            this.elements.totalValue.textContent = !isNaN(totalValue) ?
                Indicators.formatNumber(totalValue) : "0.00";
        }
        
        if (this.elements.roi) {
            let roi = portfolio.getROI();
            
            // Check if ROI is a valid number
            if (isNaN(roi) || !isFinite(roi)) {
                roi = 0;
            }
            
            this.elements.roi.textContent = `${roi.toFixed(2)}%`;
            this.elements.roi.parentElement.className = `value ${roi >= 0 ? 'positive' : 'negative'}`;
        }
        
        // Update asset balances
        if (this.elements.assetBalances) {
            this.elements.assetBalances.innerHTML = Object.entries(portfolio.assets)
                .map(([symbol, asset]) => `
                    <div class="balance-item">
                        <span class="label">
                            <span class="material-icons">${asset.icon}</span>
                            ${symbol}:
                        </span>
                        <span class="value">${asset.amount.toFixed(8)}</span>
                    </div>
                `).join('');
        }
        
        // Update trade controls
        const selectedAsset = portfolio.getSelectedAsset();
        if (selectedAsset) {
            if (this.elements.buySlider) {
                this.elements.buySlider.max = portfolio.usdBalance;
                this.elements.buySliderValue.textContent = Indicators.formatNumber(this.elements.buySlider.value);
            }
            if (this.elements.sellSlider) {
                this.elements.sellSlider.max = selectedAsset.amount;
                this.elements.sellSliderValue.textContent = (+this.elements.sellSlider.value).toFixed(8);
            }
        }
    }
    
    /**
     * Update charts
     * @param {Object} state - Current state
     */
    updateCharts(state) {
        const selectedAsset = state.portfolio.getSelectedAsset();
        if (!selectedAsset || !selectedAsset.chartData) return;
        
        const data = selectedAsset.chartData;
        
        // Update price chart
        if (state.settings.chartType === 'candlestick') {
            this.updateCandlestickChart(data);
        } else {
            this.updateLineChart(data);
        }
        
        // Update RSI chart
        if (this.charts.rsi) {
            // Calculate RSI if not provided in data
            const rsiData = data.rsi || this.calculateRSI(data.price, 14);
            if (rsiData && rsiData.length > 0) {
                this.charts.rsi.data.labels = data.labels;
                this.charts.rsi.data.datasets[0].data = rsiData;
                this.charts.rsi.update('none');
            }
        }
        
        // Update portfolio chart
        if (this.charts.portfolio) {
            // Use portfolio value history for portfolio chart
            const portfolio = state.portfolio;
            if (portfolio.valueHistory && portfolio.valueHistory.length > 0) {
                const labels = portfolio.valueHistory.map(item => item.timestamp);
                const values = portfolio.valueHistory.map(item => item.value);
                
                this.charts.portfolio.data.labels = labels;
                this.charts.portfolio.data.datasets[0].data = values;
                this.charts.portfolio.update('none');
            }
        }
        
        // Update order book chart
        this.updateOrderBook(data);
    }
    
    /**
     * Update line chart
     * @param {Object} data - Chart data
     */
    updateLineChart(data) {
        if (!this.charts.price) return;
        
        this.charts.price.data.labels = data.labels;
        this.charts.price.data.datasets[0].data = data.price;
        
        if (data.sma) {
            this.charts.price.data.datasets[1].data = data.sma;
        }
        
        this.charts.price.update('none');
    }
    
    /**
     * Update candlestick chart
     * @param {Object} data - Chart data
     */
    updateCandlestickChart(data) {
        if (!this.charts.price) return;
        
        this.charts.price.data.labels = data.labels;
        
        const ohlcData = data.labels.map((label, i) => ({
            t: label,
            o: data.open[i],
            h: data.high[i],
            l: data.low[i],
            c: data.close[i]
        }));
        
        this.charts.price.data.datasets[0].data = ohlcData;
        
        if (data.volume) {
            this.charts.price.data.datasets[1].data = data.volume;
        }
        
        this.charts.price.update('none');
        
        // Also update order book data
        this.updateOrderBook(data);
    }
    
    /**
     * Update order book chart
     * @param {Object} data - Chart data
     */
    updateOrderBook(data) {
        if (!this.charts.orderBook) return;
        
        // Generate simulated order book data based on current price
        const currentPrice = data.price ? data.price[data.price.length - 1] :
                             (data.close ? data.close[data.close.length - 1] : null);
        
        // If no current price, exit early
        if (!currentPrice) return;
        
        const bidPrices = [];
        const askPrices = [];
        const bidVolumes = [];
        const askVolumes = [];
        
        // Generate bid entries (below current price)
        for (let i = 1; i <= 5; i++) {
            const bidPrice = currentPrice * (1 - (i * 0.002));
            bidPrices.push(bidPrice.toFixed(2));
            // More realistic random volume that increases on lower prices
            bidVolumes.push(Math.random() * 10 + (i * 2));
        }
        
        // Generate ask entries (above current price)
        for (let i = 1; i <= 5; i++) {
            const askPrice = currentPrice * (1 + (i * 0.002));
            askPrices.push(askPrice.toFixed(2));
            // More realistic random volume that increases on higher prices
            askVolumes.push(Math.random() * 10 + (i * 2));
        }
        
        // Combine prices for the labels (in order)
        const combinedPrices = [...bidPrices.reverse(), ...askPrices];
        
        this.charts.orderBook.data.labels = combinedPrices;
        this.charts.orderBook.data.datasets[0].data = [...bidVolumes.reverse(), ...new Array(askPrices.length).fill(0)];
        this.charts.orderBook.data.datasets[1].data = [...new Array(bidPrices.length).fill(0), ...askVolumes];
        
        this.charts.orderBook.update('none');
    }
    
    /**
     * Calculate RSI
     * @param {Array} prices - Array of prices
     * @param {Number} period - RSI period
     * @returns {Array} - RSI values
     */
    calculateRSI(prices, period = 14) {
        if (!prices || prices.length < period + 1) {
            return [];
        }
        
        const deltas = [];
        for (let i = 1; i < prices.length; i++) {
            deltas.push(prices[i] - prices[i - 1]);
        }
        
        const gains = [];
        const losses = [];
        
        for (const delta of deltas) {
            gains.push(delta > 0 ? delta : 0);
            losses.push(delta < 0 ? Math.abs(delta) : 0);
        }
        
        let avgGain = 0;
        let avgLoss = 0;
        
        // First RSI
        for (let i = 0; i < period; i++) {
            avgGain += gains[i];
            avgLoss += losses[i];
        }
        
        avgGain /= period;
        avgLoss /= period;
        
        const rsiValues = [];
        
        // Calculate first RSI
        if (avgLoss === 0) {
            rsiValues.push(100);
        } else {
            const rs = avgGain / avgLoss;
            rsiValues.push(100 - (100 / (1 + rs)));
        }
        
        // Calculate rest of RSI values
        for (let i = period; i < gains.length; i++) {
            avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
            avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
            
            if (avgLoss === 0) {
                rsiValues.push(100);
            } else {
                const rs = avgGain / avgLoss;
                rsiValues.push(100 - (100 / (1 + rs)));
            }
        }
        
        // Fill beginning of array with NaN to align with price data
        const result = new Array(period).fill(NaN).concat(rsiValues);
        return result;
    }
    
    /**
     * Update strategy display
     * @param {Object} state - Current state
     */
    updateStrategyDisplay(state) {
        if (!this.elements.strategyList) return;
        
        const strategies = state.strategyManager.getAvailableStrategies();
        this.elements.strategyList.innerHTML = strategies.map(strategy => `
            <div class="strategy-item ${strategy.isActive ? 'active' : ''}">
                <div class="strategy-header">
                    <label>
                        <input type="checkbox" 
                               value="${strategy.name}"
                               ${strategy.isActive ? 'checked' : ''}>
                        ${strategy.name}
                    </label>
                </div>
                <div class="strategy-description">${strategy.description}</div>
                <div class="strategy-params">
                    ${Object.entries(strategy.parameters)
                        .map(([key, value]) => `
                            <div class="param-item">
                                <label>${key}:</label>
                                <input type="number" 
                                       value="${value}"
                                       data-strategy="${strategy.name}"
                                       data-param="${key}">
                            </div>
                        `).join('')}
                </div>
            </div>
        `).join('');
        
        // Add event listeners to new strategy controls
        this.elements.strategyList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    store.dispatch({
                        type: ActionTypes.ACTIVATE_STRATEGY,
                        payload: e.target.value
                    });
                } else {
                    store.dispatch({
                        type: ActionTypes.DEACTIVATE_STRATEGY,
                        payload: e.target.value
                    });
                }
            });
        });
        
        this.elements.strategyList.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('change', (e) => {
                store.dispatch({
                    type: ActionTypes.UPDATE_STRATEGY,
                    payload: {
                        name: e.target.dataset.strategy,
                        parameters: {
                            [e.target.dataset.param]: parseFloat(e.target.value)
                        }
                    }
                });
            });
        });
    }
    
    /**
     * Execute buy order
     */
    executeBuy() {
        const usdAmount = parseFloat(this.elements.buySlider.value);
        if (usdAmount <= 0) return;
        
        const state = store.getState();
        const selectedAsset = state.portfolio.getSelectedAsset();
        
        store.dispatch({
            type: ActionTypes.EXECUTE_TRADE,
            payload: {
                symbol: selectedAsset.symbol,
                type: 'BUY',
                amount: usdAmount
            }
        });
    }
    
    /**
     * Execute sell order
     */
    executeSell() {
        const assetAmount = parseFloat(this.elements.sellSlider.value);
        if (assetAmount <= 0) return;
        
        const state = store.getState();
        const selectedAsset = state.portfolio.getSelectedAsset();
        
        store.dispatch({
            type: ActionTypes.EXECUTE_TRADE,
            payload: {
                symbol: selectedAsset.symbol,
                type: 'SELL',
                amount: assetAmount
            }
        });
    }
}