/**
 * Investment Game - Main Entry Point
 */
import { GameManager } from './GameManager.js';

// Initialize the game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    try {
        // Create and initialize game manager
        const gameManager = new GameManager();
        gameManager.initialize();
        
        // Store game manager instance globally for debugging
        window.gameManager = gameManager;
        
    } catch (error) {
        console.error('Error initializing game:', error);
        // Display error message to user
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Error initializing game. Please refresh the page.';
        document.body.appendChild(errorDiv);
    }
});

// Handle errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});