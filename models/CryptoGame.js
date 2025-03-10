import { Calculations } from '../utils/Calculations.js';
import { ChartConfig } from '../utils/ChartConfig.js';
import { UIService } from '../services/UIService.js';

export class CryptoGame {
    constructor() {
        // Load saved state or set initial state
        const savedState = this.loadGameState();
        
        if (savedState) {
            this.usdBalance = savedState.usdBalance;
            this.cryptoBalances = savedState.cryptoBalances;
            this.selectedCrypto = savedState.selectedCrypto;
            this.portfolioHistory = savedState.portfolioHistory;
            this.initialInvestment = savedState.initialInvestment;
        } else {
            this.usdBalance = 10000;
            this.cryptoBalances = {
                BTC: { amount: 0, price: 40000, color: '#f7931a' },
                ETH: { amount: 0, price: 2800, color: '#627eea' },
                DOGE: { amount: 0, price: 0.15, color: '#ba9f33' }
            };
            this.selectedCrypto = 'BTC';
            this.portfolioHistory = [];
            this.initialInvestment = this.usdBalance;
        }

        this.worker = null;
        this.dcaInterval = null;
        this.cryptoChartData = {
            BTC: null,
            ETH: null,
            DOGE: null
        };
        this.charts = {};
        this.smaLength = 10;
        this.rsiLength = 14;
        this.baseVolatility = 0.02;
        this.speedMultiplier = 1;

        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        this.initializeElements();
        this.uiService = new UIService(this.elements, this.cryptoBalances);
        this.setupEventListeners();
        this.initializeCharts();
        this.initializeChartData();
        this.startGame();
    }

    initializeElements() {
        this.elements = {
            selectedCrypto: document.getElementById('selectedCrypto'),
            cryptoPrice: document.getElementById('cryptoPrice'),
            usdBalance: document.getElementById('usdBalance'),
            cryptoBalances: document.getElementById('cryptoBalances'),
            totalValue: document.getElementById('totalValue'),
            buySlider: document.getElementById('buySlider'),
            sellSlider: document.getElementById('sellSlider'),
            buySliderValue: document.getElementById('buySliderValue'),
            sellSliderValue: document.getElementById('sellSliderValue'),
            buyBtn: document.getElementById('buyBtn'),
            sellBtn: document.getElementById('sellBtn'),
            priceTrend: document.getElementById('priceTrend'),
            history: document.getElementById('history'),
            roi: document.getElementById('roi'),
            dcaAmount: document.getElementById('dca-amount'),
            dcaInterval: document.getElementById('dca-interval'),
            dcaToggle: document.getElementById('dca-toggle'),
            showSMA: document.getElementById('showSMA'),
            speedMultiplier: document.getElementById('speedMultiplier')
        };
    }

    setupEventListeners() {
        this.elements.buyBtn.addEventListener('click', () => this.buyCrypto());
        this.elements.sellBtn.addEventListener('click', () => this.sellCrypto());
        this.elements.buySlider.addEventListener('input', () => this.uiService.updateBuySliderValue());
        this.elements.sellSlider.addEventListener('input', () => this.uiService.updateSellSliderValue());
        this.elements.dcaToggle.addEventListener('click', () => this.toggleDCA());
        this.elements.showSMA.addEventListener('change', (e) => {
            this.charts.price.data.datasets[1].hidden = !e.target.checked;
            this.charts.price.update('none');
        });
        this.elements.speedMultiplier.addEventListener('change', (e) => this.updateGameSpeed(e.target.value));

        document.querySelectorAll('.crypto-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchCrypto(e.target.closest('.crypto-btn').dataset.crypto));
        });

        window.addEventListener('resize', () => {
            Object.values(this.charts).forEach(chart => chart.resize());
        });
        
            // Clean up worker when page is unloaded
            window.addEventListener('beforeunload', () => this.cleanup());
    }

    initializeCharts() {
        const priceChartCtx = document.getElementById('priceChart');
        const rsiChartCtx = document.getElementById('rsiChart');
        const portfolioChartCtx = document.getElementById('portfolioChart');

        this.charts.price = ChartConfig.createPriceChart(
            priceChartCtx,
            this.cryptoBalances[this.selectedCrypto].color,
            this.elements.showSMA.checked
        );
        this.charts.rsi = ChartConfig.createRSIChart(rsiChartCtx);
        this.charts.portfolio = ChartConfig.createPortfolioChart(portfolioChartCtx);
    }

    initializeChartData() {
        const savedChartData = this.loadChartData();
        
        if (savedChartData) {
            this.updateChartData(savedChartData);
        } else {
            const time = new Date().toLocaleTimeString();
            const price = this.cryptoBalances[this.selectedCrypto].price;
            const portfolioValue = this.calculateTotalValue();

            const chartData = {
                labels: [time],
                price: [price],
                sma: [null],
                rsi: [50],
                portfolio: [portfolioValue]
            };

            this.updateChartData(chartData);
        }
    }

    updateGameSpeed(multiplier) {
        this.speedMultiplier = parseFloat(multiplier);
        if (this.worker) {
            this.worker.postMessage({
                type: 'updateSpeed',
                data: { multiplier: this.speedMultiplier }
            });
        } else {
            // If worker doesn't exist, start the game
            this.startGame();
        }
    }

    startGame() {
        this.cleanup();

        // Create a new worker for price updates
        try {
            this.worker = new Worker('../workers/priceWorker.js');
        } catch (error) {
            console.error('Error creating Web Worker:', error);
            return;
        }
        
        this.worker.onmessage = (e) => {
            const { type, data } = e.data;
            if (type === 'update') {
                this.handlePriceUpdate(data);
            } else if (type === 'started') {
                console.log('Price worker started:', data.message);
            } else if (type === 'error') {
                console.error('Worker error:', data.message);
                // Restart the worker if there was an error
                this.worker.terminate();
                setTimeout(() => this.startGame(), 1000);
            }
        };
        
        this.worker.onerror = (error) => {
            console.error('Worker error event:', error);
            // Restart the worker if there was an error
            this.worker.terminate();
            setTimeout(() => this.startGame(), 1000);
        };

        this.updateWorker();

        this.updateUI();
    }

    handlePriceUpdate(data) {
        const { cryptoBalances, updates } = data;
        const time = new Date().toLocaleTimeString();
        
        // Update the crypto balances with the new prices
        Object.entries(cryptoBalances).forEach(([crypto, data]) => {
            if (this.cryptoBalances[crypto]) {
                this.cryptoBalances[crypto].price = data.price;
            }
            
            // Initialize chart data if not exists
            if (!this.cryptoChartData[crypto]) {
                this.cryptoChartData[crypto] = {
                    labels: [time],
                    price: [data.price],
                    sma: [null],
                    rsi: [50],
                    portfolio: [this.calculateTotalValue()]
                };
            } else if (updates[crypto]) {
                // Update chart data for this crypto
                const chartData = this.cryptoChartData[crypto];
                chartData.labels.push(time);
                chartData.price.push(data.price);
                chartData.sma.push(Calculations.calculateSMA(chartData.price, this.smaLength));
                chartData.rsi.push(Calculations.calculateRSI(chartData.price, this.rsiLength));
                chartData.portfolio.push(this.calculateTotalValue());

                if (chartData.labels.length > 50) {
                    Object.keys(chartData).forEach(key => {
                        chartData[key] = chartData[key].slice(-50);
                    });
                }
            }
        });

        // Update display charts for selected crypto
        if (this.cryptoChartData[this.selectedCrypto]) {
            this.updateChartData(this.cryptoChartData[this.selectedCrypto]);
        }
        
        if (updates[this.selectedCrypto]) {
            this.uiService.updatePriceTrend(
                this.cryptoBalances[this.selectedCrypto].price,
                updates[this.selectedCrypto].previousPrice
            );
        }

        this.updateUI();
    }

    updateChartData(data) {
        // Save chart data before updating charts
        this.saveChartData(data);

        // Update price chart
        this.charts.price.data.labels = data.labels;
        this.charts.price.data.datasets[0].data = data.price;
        this.charts.price.data.datasets[1].data = data.sma;
        this.charts.price.update('none');

        // Update RSI chart
        this.charts.rsi.data.labels = data.labels;
        this.charts.rsi.data.datasets[0].data = data.rsi;
        this.charts.rsi.update('none');

        // Update portfolio chart
        this.charts.portfolio.data.labels = data.labels;
        this.charts.portfolio.data.datasets[0].data = data.portfolio;
        this.charts.portfolio.update('none');
    }

    buyCrypto() {
        const usdAmount = parseFloat(this.elements.buySlider.value);
        if (usdAmount <= 0) return;

        if (usdAmount > this.usdBalance) {
            alert('Insufficient USD balance');
            return;
        }

        const price = this.cryptoBalances[this.selectedCrypto].price;
        const cryptoAmount = usdAmount / price;
        
        this.usdBalance -= usdAmount;
        this.cryptoBalances[this.selectedCrypto].amount += cryptoAmount;

        this.uiService.addToHistory('BUY', this.selectedCrypto, cryptoAmount, usdAmount);
        this.updateUI();
        
        this.updateWorker();
    }

    sellCrypto() {
        const cryptoAmount = parseFloat(this.elements.sellSlider.value);
        if (cryptoAmount <= 0) return;

        if (cryptoAmount > this.cryptoBalances[this.selectedCrypto].amount) {
            alert(`Insufficient ${this.selectedCrypto} balance`);
            return;
        }

        const price = this.cryptoBalances[this.selectedCrypto].price;
        const usdAmount = cryptoAmount * price;
        
        this.usdBalance += usdAmount;
        this.cryptoBalances[this.selectedCrypto].amount -= cryptoAmount;

        this.uiService.addToHistory('SELL', this.selectedCrypto, cryptoAmount, usdAmount);
        this.updateUI();
        
        this.updateWorker();
    }

    toggleDCA() {
        if (this.dcaInterval) {
            clearInterval(this.dcaInterval);
            this.dcaInterval = null;
            this.uiService.toggleDCAButton(false);
        } else {
            const amount = parseFloat(this.elements.dcaAmount.value);
            const interval = parseFloat(this.elements.dcaInterval.value) * 1000 / this.speedMultiplier;
            
            if (isNaN(amount) || amount <= 0 || isNaN(interval) || interval < 5000) {
                alert('Please enter valid DCA parameters');
                return;
            }

            this.dcaInterval = setInterval(() => {
                if (this.usdBalance >= amount) {
                    const price = this.cryptoBalances[this.selectedCrypto].price;
                    const cryptoAmount = amount / price;
                    
                    this.usdBalance -= amount;
                    this.cryptoBalances[this.selectedCrypto].amount += cryptoAmount;

                    this.uiService.addToHistory('DCA', this.selectedCrypto, cryptoAmount, amount);
                    this.updateUI();
                    
                    this.updateWorker();
                }
            }, interval);

            this.uiService.toggleDCAButton(true);
        }
    }

    updateWorker() {
        // Update the worker with the latest crypto balances
        if (this.worker) {
            this.worker.postMessage({
                type: 'start',
                data: {
                    baseVolatility: this.baseVolatility,
                    speedMultiplier: this.speedMultiplier,
                    cryptoBalances: this.cryptoBalances
                }
            });
        }
    }

    cleanup() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        
        if (this.dcaInterval) {
            clearInterval(this.dcaInterval);
            this.dcaInterval = null;
        }
    }

    switchCrypto(crypto) {
        this.cleanup();
        
        this.uiService.updateCryptoButtons(crypto);
        this.selectedCrypto = crypto;

        this.charts.price.data.datasets[0].borderColor = this.cryptoBalances[crypto].color;
        
        // Restart the worker with the new crypto selected
        this.startGame();
        // Load or initialize chart data for the selected crypto
        const savedChartData = this.loadChartData();
        if (savedChartData) {
            this.cryptoChartData[crypto] = savedChartData;
            this.updateChartData(savedChartData);
        } else if (this.cryptoChartData[crypto]) {
            this.updateChartData(this.cryptoChartData[crypto]);
        } else {
            const time = new Date().toLocaleTimeString();
            const price = this.cryptoBalances[crypto].price;
            
            this.cryptoChartData[crypto] = {
                labels: [time],
                price: [price],
                sma: [null],
                rsi: [50],
                portfolio: [this.calculateTotalValue()]
            };
            
            this.updateChartData(this.cryptoChartData[crypto]);
        }
        
        this.updateUI();
    }

    calculateTotalValue() {
        const cryptoValue = Object.entries(this.cryptoBalances).reduce((total, [_, data]) => {
            return total + (data.amount * data.price);
        }, 0);
        return this.usdBalance + cryptoValue;
    }

    calculateROI() {
        const currentValue = this.calculateTotalValue();
        return ((currentValue - this.initialInvestment) / this.initialInvestment * 100).toFixed(2);
    }

    updateUI() {
        const totalValue = this.calculateTotalValue();
        const roi = this.calculateROI();
        
        this.uiService.updateMainUI(this.selectedCrypto, this.usdBalance, totalValue, roi);
        this.uiService.updateCryptoBalances();
        this.uiService.updateSliders(this.usdBalance, this.selectedCrypto);
        
        // Save game state after UI updates
        this.saveGameState();
    }

    loadGameState() {
        try {
            const savedState = localStorage.getItem('cryptoGameState');
            return savedState ? JSON.parse(savedState) : null;
        } catch (error) {
            console.error('Error loading game state:', error);
            return null;
        }
    }

    saveGameState() {
        try {
            const state = {
                usdBalance: this.usdBalance,
                cryptoBalances: this.cryptoBalances,
                selectedCrypto: this.selectedCrypto,
                portfolioHistory: this.portfolioHistory,
                initialInvestment: this.initialInvestment
            };
            localStorage.setItem('cryptoGameState', JSON.stringify(state));
        } catch (error) {
            console.error('Error saving game state:', error);
        }
    }

    saveChartData(data) {
        try {
            // Keep only the most recent 100 data points
            const chartData = {
                labels: data.labels.slice(-100),
                price: data.price.slice(-100),
                sma: data.sma.slice(-100),
                rsi: data.rsi.slice(-100),
                portfolio: data.portfolio.slice(-100)
            };

            // Save chart data for all cryptos
            Object.keys(this.cryptoChartData).forEach(crypto => {
                if (this.cryptoChartData[crypto]) {
                    localStorage.setItem(`chartData_${crypto}`, JSON.stringify(this.cryptoChartData[crypto]));
                }
            });
        } catch (error) {
            console.error('Error saving chart data:', error);
        }
    }

    loadChartData() {
        try {
            const savedData = localStorage.getItem(`chartData_${this.selectedCrypto}`);
            return savedData ? JSON.parse(savedData) : null;
        } catch (error) {
            console.error('Error loading chart data:', error);
            return null;
        }
    }
}