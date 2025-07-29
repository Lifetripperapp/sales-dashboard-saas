/**
 * Utility functions for formatting data
 */

/**
 * Format a date string
 * @param {string} dateString - The date string to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  // Default options
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat('es-UY', defaultOptions).format(date);
};

/**
 * Format a number as currency
 * @param {number} value - The value to format as currency
 * @param {string} currency - The currency code (default: UYU)
 * @param {number} maximumFractionDigits - Maximum fraction digits (default: 0)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = 'UYU', maximumFractionDigits = 0) => {
  if (value === undefined || value === null) return 'N/A';
  
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency,
    maximumFractionDigits
  }).format(value);
};

/**
 * Format a number as percentage
 * @param {number} value - The value to format as percentage (0.5 = 50%)
 * @param {number} fractionDigits - Number of fraction digits to display (default: 1)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, fractionDigits = 1) => {
  if (value === undefined || value === null) return 'N/A';
  
  return `${(value * 100).toFixed(fractionDigits)}%`;
};

/**
 * Format a number with thousand separators
 * @param {number} value - The value to format
 * @param {number} fractionDigits - Number of fraction digits to display (default: 0)
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, fractionDigits = 0) => {
  if (value === undefined || value === null) return 'N/A';
  
  return new Intl.NumberFormat('es-UY', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
}; 