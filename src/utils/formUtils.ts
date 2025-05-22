
/**
 * Utility functions for forms to ensure accessibility
 */

/**
 * Generates a unique ID for form inputs to be used with labels
 * @param baseId - Base name for the ID
 * @returns Unique ID string
 */
export const generateInputId = (baseId: string): string => {
  return `${baseId}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Formats a currency value for display (BRL)
 * @param value - Numerical value to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

/**
 * Parses a currency string input to a number
 * @param value - Currency string (e.g. "1.234,56" or "1234.56")
 * @returns Numeric value
 */
export const parseCurrencyInput = (value: string): number => {
  // Remove currency symbol, thousands separators and normalize decimal separator
  const normalizedValue = value
    .replace(/[^\d,.-]/g, '')  // Remove anything that's not a digit, comma, dot or minus
    .replace(',', '.');        // Replace comma with dot for decimal parsing
  
  const parsedValue = parseFloat(normalizedValue);
  return isNaN(parsedValue) ? 0 : parsedValue;
};
