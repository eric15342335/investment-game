/**
 * AppConfig - Application-wide configuration settings
 */
export const AppConfig = {
    // Game settings
    initialUSDBalance: 10000,
    defaultSpeedMultiplier: 1,
    
    // Technical indicators
    defaultSMALength: 10,
    defaultRSILength: 14,
    
    // Price simulation settings
    baseVolatility: 0.02,
    
    // Chart settings
    maxDataPoints: 50,
    maxSavedDataPoints: 100,
    
    // Local storage keys
    storageKeys: {
        gameState: 'investmentGameState',
        chartDataPrefix: 'chartData_'
    },
    
    // Theme colors
    colors: {
        btc: '#f7931a',
        eth: '#627eea',
        doge: '#ba9f33',
        stock: '#16a34a',
        forex: '#3b82f6',
        commodity: '#9333ea'
    }
};