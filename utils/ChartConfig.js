export class ChartConfig {
    static getCommonOptions() {
        return {
            responsive: true,
            maintainAspectRatio: true,
            animation: true,
            plugins: {
                legend: {
                    display: true,
                    labels: { color: '#a0aec0' }
                }
            },
            scales: {
                x: {
                    grid: { color: '#2d2d2d' },
                    ticks: { color: '#a0aec0' }
                }
            }
        };
    }

    static createPriceChart(ctx, cryptoColor, showSMA) {
        const commonOptions = this.getCommonOptions();
        return new Chart(ctx, {
            data: {
                labels: [],
                datasets: [
                    {
                        type: 'line',
                        label: 'Price',
                        data: [],
                        borderColor: cryptoColor,
                        yAxisID: 'price',
                        tension: 0.4
                    },
                    {
                        type: 'line',
                        label: 'SMA',
                        data: [],
                        borderColor: '#9333ea',
                        borderWidth: 2,
                        tension: 0.4,
                        hidden: !showSMA,
                        yAxisID: 'price'
                    }
                ]
            },
            options: {
                ...commonOptions,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    ...commonOptions.scales,
                    price: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: { color: '#2d2d2d' },
                        ticks: { color: '#a0aec0' }
                    }
                }
            }
        });
    }

    static createRSIChart(ctx) {
        const commonOptions = this.getCommonOptions();
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'RSI-14',
                    data: [],
                    borderColor: '#3b82f6',
                    tension: 0.4
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: '#2d2d2d' },
                        ticks: { color: '#a0aec0' }
                    }
                }
            }
        });
    }

    static createPortfolioChart(ctx) {
        const commonOptions = this.getCommonOptions();
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Portfolio Value',
                    data: [],
                    borderColor: '#16a34a',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    y: {
                        grid: { color: '#2d2d2d' },
                        ticks: {
                            color: '#a0aec0',
                            callback: value => '$' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    }
}