# Investment Game

A sophisticated cryptocurrency and asset trading simulator that allows users to practice investing in various assets like cryptocurrencies, stocks, forex, and commodities in a risk-free environment.

## Features

- **Asset Trading**: Buy and sell various assets including cryptocurrencies (BTC, ETH, DOGE), stocks (AAPL, MSFT, TSLA), forex pairs (EUR/USD, GBP/USD), and commodities (GOLD, OIL)
- **Real-time Price Simulation**: Realistic price movements with customizable volatility and speed
- **Technical Indicators**: SMA (Simple Moving Average) and RSI (Relative Strength Index) to aid in trading decisions
- **Trading Strategies**: Pre-configured strategies including Moving Average Crossover and RSI Overbought/Oversold conditions
- **Portfolio Tracking**: Monitor your portfolio value and performance with ROI calculations
- **Trading History**: Keep track of all your transactions
- **Customizable Settings**: Adjust game speed, asset volatility, and more

## Project Architecture

### Directory Structure

```py
investment-game/
├── index.html              # Main HTML file defining UI structure
├── styles.css              # Global styles and responsive design rules
├── main.js                 # Application entry point
├── models/                 # Core game models
│   └── CryptoGame.js       # Main game logic and state management
├── services/               # Service modules
│   ├── PriceService.js     # Handles price updates and calculations
│   └── UIService.js        # Manages UI updates and rendering
├── src/                    # Source code
│   ├── main.js             # App initialization and setup
│   ├── GameManager.js      # High-level game management
│   ├── config/             # Configuration files
│   │   ├── AppConfig.js    # App-wide settings
│   │   └── AssetConfig.js  # Asset-specific configurations
│   ├── models/             # Data models
│   │   ├── Asset.js        # Asset class definition
│   │   └── Portfolio.js    # Portfolio management
│   ├── services/           # Application services
│   │   └── UIUpdateService.js  # UI update service
│   ├── store/              # State management
│   │   └── Store.js        # Central state store
│   ├── strategies/         # Trading strategies
│   │   ├── CustomStrategy.js        # User-defined strategies
│   │   ├── MovingAverageStrategy.js # Moving average crossover strategy
│   │   ├── RSIStrategy.js           # RSI-based strategy
│   │   ├── StrategyManager.js       # Strategy coordination
│   │   └── TradingStrategy.js       # Base strategy class
│   ├── utils/              # Utility functions
│   │   ├── ChartManager.js # Chart creation and update
│   │   └── Indicators.js   # Technical indicators calculation
│   └── workers/            # Web workers
│       └── PriceWorker.js  # Background price simulation
├── utils/                  # Helper utilities
│   ├── Calculations.js     # Mathematical calculations
│   └── ChartConfig.js      # Chart.js configuration
└── workers/                # Worker threads
    └── priceWorker.js      # Price simulation worker
```

### Core Components

#### Models

- **CryptoGame.js**: The central model managing game state, handling user interactions, and orchestrating the app's functionality.

#### Services

- **PriceService.js**: Manages asset price simulation and updates
- **UIService.js**: Handles rendering and UI updates across the application

#### Workers

- **priceWorker.js**: A Web Worker that runs price simulations in a separate thread to maintain UI responsiveness

#### Strategies

The application includes trading strategy implementations:

- Moving Average Crossover: Generates buy/sell signals based on SMA crossovers
- RSI Strategy: Uses Relative Strength Index to identify overbought/oversold conditions

#### Utilities

- **Calculations.js**: Contains mathematical functions for indicators and portfolio calculations
- **ChartConfig.js**: Configures Chart.js instances for various data visualizations

### Data Flow

1. When the app loads, the CryptoGame class initializes the game state and UI
2. The priceWorker simulates price movements in a background thread
3. Price updates are sent to the main thread and processed by the CryptoGame model
4. The UI is updated to reflect the latest prices, portfolio values, and chart data
5. Trading strategies analyze price data to generate potential trading signals
6. User interactions (buy/sell) modify the game state and are reflected in the UI

## Development

This project was developed by `@eric15342335` using `Roo Code` and `Claude 3.7 Sonnet (Thinking)` with at least `USD$5` API usage.
