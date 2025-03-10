/**
 * ChartManager - Enhanced chart management utility
 * Supports various chart types and customization options
 */
/* global Chart */
// Chart is loaded from CDN in index.html

export class ChartManager {
    /**
     * Get common chart options
     * @param {Boolean} isDarkTheme - Whether dark theme is active
     * @returns {Object} - Common chart configuration options
     */
    static getCommonOptions(isDarkTheme = true) {
        const textColor = isDarkTheme ? '#a0aec0' : '#4a5568';
        const gridColor = isDarkTheme ? '#2d2d2d' : '#e2e8f0';
        
        return {
            responsive: true,
            maintainAspectRatio: true,
            animation: {
                duration: 400
            },
            plugins: {
                legend: {
                    display: true,
                    labels: { 
                        color: textColor,
                        font: {
                            family: 'Roboto, sans-serif'
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: isDarkTheme ? '#1e1e1e' : '#ffffff',
                    titleColor: isDarkTheme ? '#ffffff' : '#1a202c',
                    bodyColor: isDarkTheme ? '#a0aec0' : '#4a5568',
                    borderColor: isDarkTheme ? '#2d2d2d' : '#e2e8f0',
                    borderWidth: 1,
                    padding: 8,
                    cornerRadius: 4
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { 
                        color: textColor,
                        maxRotation: 0
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        };
    }

    /**
     * Create a line chart for price data
     * @param {Object} ctx - Canvas context
     * @param {String} color - Line color
     * @param {Boolean} showIndicators - Whether to show indicators
     * @param {Boolean} isDarkTheme - Whether dark theme is active
     * @returns {Object} - Chart.js instance
     */
    static createLineChart(ctx, color, showIndicators = true, isDarkTheme = true) {
        const commonOptions = this.getCommonOptions(isDarkTheme);
        const textColor = isDarkTheme ? '#a0aec0' : '#4a5568';
        const gridColor = isDarkTheme ? '#2d2d2d' : '#e2e8f0';
        
        // Create a new chart with safety checks for data
        return new Chart(ctx, {
            data: {
                labels: [],
                datasets: [
                    {
                        type: 'line',
                        label: 'Price',
                        data: [],
                        borderColor: color,
                        yAxisID: 'price',
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHitRadius: 10,
                        pointHoverRadius: 4,
                        // Add data filtering to prevent NaN values
                        parsing: false,
                        normalized: true
                    },
                    {
                        type: 'line',
                        label: 'SMA',
                        data: [],
                        borderColor: '#9333ea',
                        borderWidth: 2,
                        tension: 0.4,
                        hidden: !showIndicators,
                        yAxisID: 'price',
                        pointRadius: 0,
                        pointHitRadius: 10,
                        pointHoverRadius: 0
                    }
                ]
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    price: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: { color: gridColor },
                        ticks: { 
                            color: textColor,
                            callback: value => {
                                if (value >= 1000) {
                                    return '$' + value.toLocaleString();
                                } else if (value >= 1) {
                                    return '$' + value.toFixed(2);
                                } else {
                                    return '$' + value.toFixed(4);
                                }
                            }
                        },
                        beginAtZero: false
                    }
                }
            }
        });
    }
    
    /**
     * Create a candlestick chart
     * @param {Object} ctx - Canvas context
     * @param {String} color - Theme color
     * @param {Boolean} showVolume - Whether to show volume bars
     * @param {Boolean} isDarkTheme - Whether dark theme is active
     * @returns {Object} - Chart.js instance
     */
    static createCandlestickChart(ctx, color, showVolume = true, isDarkTheme = true) {
        const commonOptions = this.getCommonOptions(isDarkTheme);
        const textColor = isDarkTheme ? '#a0aec0' : '#4a5568';
        const gridColor = isDarkTheme ? '#2d2d2d' : '#e2e8f0';
        
        // Colors for up/down candles
        const upColor = '#16a34a';
        const downColor = '#dc2626';
        
        const chartData = {
            labels: [],
            datasets: [
                {
                    label: 'Price',
                    data: [], // Will contain OHLC data objects
                    yAxisID: 'price',
                    borderWidth: 2,
                    type: 'candlestick', // Requires Chart.js plugin
                    color: {
                        up: upColor,
                        down: downColor,
                        unchanged: color
                    }
                }
            ]
        };
        
        if (showVolume) {
            chartData.datasets.push({
                label: 'Volume',
                data: [],
                yAxisID: 'volume',
                backgroundColor: color,
                type: 'bar',
                opacity: 0.3
            });
        }
        
        return {
            data: chartData,
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    price: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: { color: gridColor },
                        ticks: { 
                            color: textColor,
                            callback: value => {
                                if (value >= 1000) {
                                    return '$' + value.toLocaleString();
                                } else if (value >= 1) {
                                    return '$' + value.toFixed(2);
                                } else {
                                    return '$' + value.toFixed(6);
                                }
                            }
                        },
                        beginAtZero: false
                    },
                    volume: showVolume ? {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { 
                            display: false 
                        },
                        ticks: { 
                            color: textColor
                        },
                        beginAtZero: true
                    } : undefined
                }
            }
        };
    }

    /**
     * Create an RSI chart
     * @param {Object} ctx - Canvas context
     * @param {Boolean} isDarkTheme - Whether dark theme is active
     * @returns {Object} - Chart.js instance
     */
    static createRSIChart(ctx, isDarkTheme = true) {
        const commonOptions = this.getCommonOptions(isDarkTheme);
        const textColor = isDarkTheme ? '#a0aec0' : '#4a5568';
        const gridColor = isDarkTheme ? '#2d2d2d' : '#e2e8f0';
        
        // Add overbought and oversold lines
        const overbought = 70;
        const oversold = 30;
        
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'RSI-14',
                    data: [],
                    borderColor: '#3b82f6',
                    tension: 0.4,
                    pointRadius: 0,
                    pointHitRadius: 10,
                    pointHoverRadius: 4,
                    // Initialize with empty data to prevent errors
                    normalized: true
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { 
                            color: (ctx) => {
                                if (ctx.tick && (ctx.tick.value === overbought || ctx.tick.value === oversold)) {
                                    return isDarkTheme ? 'rgba(220, 38, 38, 0.5)' : 'rgba(220, 38, 38, 0.3)';
                                }
                                return gridColor;
                            },
                            lineWidth: (ctx) => {
                                if (ctx.tick && (ctx.tick.value === overbought || ctx.tick.value === oversold)) {
                                    return 1.5;
                                }
                                return 1;
                            }
                        },
                        ticks: { color: textColor }
                    }
                },
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                let status = '';
                                if (value >= 70) status = ' (Overbought)';
                                else if (value <= 30) status = ' (Oversold)';
                                return `RSI: ${value.toFixed(2)}${status}`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Create a portfolio chart
     * @param {Object} ctx - Canvas context
     * @param {Boolean} isDarkTheme - Whether dark theme is active
     * @returns {Object} - Chart.js instance
     */
    static createPortfolioChart(ctx, isDarkTheme = true) {
        const commonOptions = this.getCommonOptions(isDarkTheme);
        const textColor = isDarkTheme ? '#a0aec0' : '#4a5568';
        const gridColor = isDarkTheme ? '#2d2d2d' : '#e2e8f0';
        
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Portfolio Value',
                    data: [],
                    borderColor: '#16a34a',
                    backgroundColor: isDarkTheme ?
                        'rgba(22, 163, 74, 0.1)' :
                        'rgba(22, 163, 74, 0.2)',
                    fill: true,
                    tension: 0.4,
                    // Initialize with empty data to prevent errors
                    normalized: true,
                    pointRadius: 0,
                    pointHitRadius: 10,
                    pointHoverRadius: 4
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    y: {
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            callback: value => '$' + value.toLocaleString()
                        },
                        beginAtZero: false
                    }
                }
            }
        });
    }
    
    /**
     * Create an order book visualization
     * @param {Object} ctx - Canvas context
     * @param {Boolean} isDarkTheme - Whether dark theme is active
     * @returns {Object} - Chart.js instance for the order book
     */
    static createOrderBookChart(ctx, isDarkTheme = true) {
        const commonOptions = this.getCommonOptions(isDarkTheme);
        const textColor = isDarkTheme ? '#a0aec0' : '#4a5568';
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Bids',
                        data: [],
                        backgroundColor: 'rgba(22, 163, 74, 0.6)', // Green for bids
                        borderColor: 'rgba(22, 163, 74, 1)',
                        borderWidth: 1,
                        // Initialize with empty data to prevent errors
                        normalized: true
                    },
                    {
                        label: 'Asks',
                        data: [],
                        backgroundColor: 'rgba(220, 38, 38, 0.6)', // Red for asks
                        borderColor: 'rgba(220, 38, 38, 1)',
                        borderWidth: 1,
                        // Initialize with empty data to prevent errors
                        normalized: true
                    }
                ]
            },
            options: {
                ...commonOptions,
                indexAxis: 'y',
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.x;
                                const dataset = context.dataset.label;
                                return `${dataset}: ${value.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor }
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            color: textColor,
                            callback: (value) => {
                                return value; // Price labels
                            }
                        }
                    }
                }
            }
        });
    }
}