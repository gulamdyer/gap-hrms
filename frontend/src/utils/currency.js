import { settingsAPI } from '../services/api';

/**
 * Currency Configuration Utility
 * 
 * This utility provides centralized currency symbol and formatting
 * throughout the application. The currency symbol is fetched from
 * the backend environment configuration.
 */

class CurrencyConfig {
  constructor() {
    this.symbol = '₹'; // Default fallback
    this.code = 'INR';
    this.name = 'Indian Rupee';
    this.isLoaded = false;
    this.initializationPromise = null;
    this.lastRefreshTime = 0;
    this.refreshInterval = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize currency configuration from backend
   */
  async initialize() {
    const now = Date.now();
    
    // If already loaded and within refresh interval, return cached data
    if (this.isLoaded && (now - this.lastRefreshTime) < this.refreshInterval) {
      return this.initializationPromise;
    }

    // Reset for fresh load
    this.initializationPromise = null;
    this.isLoaded = false;
    
    this.initializationPromise = this._loadFromBackend();
    return this.initializationPromise;
  }

  async _loadFromBackend() {
    try {
      console.log('🔄 Loading currency configuration from backend...');
      const response = await settingsAPI.getCurrencyConfig();
      if (response.data) {
        this.symbol = response.data.symbol || '₹';
        this.code = response.data.code || 'INR';
        this.name = response.data.name || 'Indian Rupee';
        this.isLoaded = true;
        this.lastRefreshTime = Date.now();
        console.log('✅ Currency config loaded:', { symbol: this.symbol, code: this.code, name: this.name });
      }
    } catch (error) {
      console.warn('⚠️ Failed to load currency config, using defaults:', error.message);
      // Keep default values
    }
  }

  /**
   * Get the currency symbol
   * @returns {string} Currency symbol
   */
  getSymbol() {
    return this.symbol;
  }

  /**
   * Get the currency code
   * @returns {string} Currency code
   */
  getCode() {
    return this.code;
  }

  /**
   * Get the currency name
   * @returns {string} Currency name
   */
  getName() {
    return this.name;
  }

  /**
   * Format amount with currency symbol
   * @param {number} amount - Amount to format
   * @param {boolean} showSymbol - Whether to show currency symbol (default: true)
   * @returns {string} Formatted amount
   */
  formatAmount(amount, showSymbol = true) {
    if (amount === null || amount === undefined) {
      return showSymbol ? `${this.symbol}0` : '0';
    }

    const formattedAmount = Number(amount).toLocaleString();
    return showSymbol ? `${this.symbol}${formattedAmount}` : formattedAmount;
  }

  /**
   * Format amount with currency symbol and code
   * @param {number} amount - Amount to format
   * @returns {string} Formatted amount with code
   */
  formatAmountWithCode(amount) {
    if (amount === null || amount === undefined) {
      return `${this.symbol}0 (${this.code})`;
    }

    const formattedAmount = Number(amount).toLocaleString();
    return `${this.symbol}${formattedAmount} (${this.code})`;
  }

  /**
   * Check if currency config is loaded
   * @returns {boolean} Whether config is loaded
   */
  isConfigLoaded() {
    return this.isLoaded;
  }

  /**
   * Force refresh currency configuration
   */
  async refresh() {
    this.isLoaded = false;
    this.initializationPromise = null;
    this.lastRefreshTime = 0;
    await this.initialize();
  }

  /**
   * Set refresh interval (in milliseconds)
   * @param {number} interval - Refresh interval in milliseconds
   */
  setRefreshInterval(interval) {
    this.refreshInterval = interval;
  }
}

// Create singleton instance
const currencyConfig = new CurrencyConfig();

// Initialize on module load
currencyConfig.initialize();

// Add debug function for testing
if (typeof window !== 'undefined') {
  window.debugCurrencyConfig = async () => {
    console.log('🔍 Debug Currency Configuration:');
    console.log('Current symbol:', currencyConfig.getSymbol());
    console.log('Current code:', currencyConfig.getCode());
    console.log('Is loaded:', currencyConfig.isConfigLoaded());
    console.log('Last refresh time:', new Date(currencyConfig.lastRefreshTime));
    
    console.log('🔄 Refreshing...');
    await currencyConfig.refresh();
    
    console.log('✅ After refresh:');
    console.log('New symbol:', currencyConfig.getSymbol());
    console.log('New code:', currencyConfig.getCode());
    console.log('Is loaded:', currencyConfig.isConfigLoaded());
    console.log('Last refresh time:', new Date(currencyConfig.lastRefreshTime));
  };
}

export default currencyConfig;