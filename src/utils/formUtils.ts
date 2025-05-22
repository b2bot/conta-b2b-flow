
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

/**
 * Format CPF/CNPJ for display
 * @param value - CPF or CNPJ string
 * @returns Formatted CPF/CNPJ string
 */
export const formatCpfCnpj = (value: string | undefined): string => {
  if (!value) return '';
  
  // Remove non-numeric characters
  const numericValue = value.replace(/\D/g, '');
  
  // Format as CPF (xxx.xxx.xxx-xx)
  if (numericValue.length <= 11) {
    return numericValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } 
  // Format as CNPJ (xx.xxx.xxx/xxxx-xx)
  else {
    return numericValue
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
};
