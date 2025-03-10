/**
 * AssetConfig - Configuration for different asset types
 */
import { AppConfig } from './AppConfig.js';

export const AssetTypes = {
    CRYPTO: 'crypto',
    STOCK: 'stock',
    FOREX: 'forex',
    COMMODITY: 'commodity'
};

export const AssetConfig = {
    // Cryptocurrencies
    BTC: {
        symbol: 'BTC',
        name: 'Bitcoin',
        type: AssetTypes.CRYPTO,
        defaultPrice: 40000,
        color: AppConfig.colors.btc,
        icon: 'currency_bitcoin',
        volatility: 1.0 // Relative volatility (base multiplier)
    },
    ETH: {
        symbol: 'ETH',
        name: 'Ethereum',
        type: AssetTypes.CRYPTO,
        defaultPrice: 2800,
        color: AppConfig.colors.eth,
        icon: 'diamond',
        volatility: 1.2
    },
    DOGE: {
        symbol: 'DOGE',
        name: 'Dogecoin',
        type: AssetTypes.CRYPTO,
        defaultPrice: 0.15,
        color: AppConfig.colors.doge,
        icon: 'pets',
        volatility: 1.5
    },
    
    // Stocks
    AAPL: {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: AssetTypes.STOCK,
        defaultPrice: 175.25,
        color: AppConfig.colors.stock,
        icon: 'phone_iphone',
        volatility: 0.7
    },
    MSFT: {
        symbol: 'MSFT',
        name: 'Microsoft',
        type: AssetTypes.STOCK,
        defaultPrice: 315.50,
        color: AppConfig.colors.stock,
        icon: 'window',
        volatility: 0.6
    },
    TSLA: {
        symbol: 'TSLA',
        name: 'Tesla',
        type: AssetTypes.STOCK,
        defaultPrice: 780.00,
        color: AppConfig.colors.stock,
        icon: 'electric_car',
        volatility: 1.3
    },
    
    // Forex
    EURUSD: {
        symbol: 'EURUSD', // Changed from EUR/USD to match HTML data-symbol
        name: 'Euro/US Dollar',
        type: AssetTypes.FOREX,
        defaultPrice: 1.09,
        color: AppConfig.colors.forex,
        icon: 'euro',
        volatility: 0.3
    },
    GBPUSD: {
        symbol: 'GBPUSD', // Changed from GBP/USD to match HTML data-symbol
        name: 'British Pound/US Dollar',
        type: AssetTypes.FOREX,
        defaultPrice: 1.27,
        color: AppConfig.colors.forex,
        icon: 'currency_pound',
        volatility: 0.4
    },
    
    // Commodities
    GOLD: {
        symbol: 'GOLD',
        name: 'Gold',
        type: AssetTypes.COMMODITY,
        defaultPrice: 1850.25,
        color: AppConfig.colors.commodity,
        icon: 'watch',
        volatility: 0.5
    },
    OIL: {
        symbol: 'OIL',
        name: 'Crude Oil',
        type: AssetTypes.COMMODITY,
        defaultPrice: 75.30,
        color: AppConfig.colors.commodity,
        icon: 'local_gas_station',
        volatility: 0.9
    }
};

// Group assets by type for easier filtering
export const AssetsByType = Object.entries(AssetConfig).reduce((acc, [key, asset]) => {
    if (!acc[asset.type]) {
        acc[asset.type] = [];
    }
    acc[asset.type].push({...asset, id: key});
    return acc;
}, {});