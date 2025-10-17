/**
 * Utility for parsing start parameters from Telegram /start command
 * Supports both URL-style parameters (param1=value1&param2=value2) 
 * and simple space-separated parameters
 */

export interface StartParams {
  [key: string]: string | number | boolean;
}

/**
 * Parse start parameters from Telegram /start command payload
 * Supports:
 * - URL-style: param1=value1&param2=value2
 * - Space-separated: param1 value1 param2 value2
 * - Telegram start parameter: ?start=value
 * @param startPayload - The payload string after /start command
 * @returns Parsed parameters object
 */
export function parseStartParams(startPayload?: string): StartParams {
  if (!startPayload || startPayload.trim() === '') {
    return {};
  }

  const params: StartParams = {};
  let trimmedPayload = startPayload.trim();

  // Handle Telegram start parameter (?start=value)
  if (trimmedPayload.startsWith('?start=')) {
    const startValue = trimmedPayload.substring(7); // Remove "?start="
    params.start = decodeURIComponent(startValue); // Always as string for start parameter
    return params;
  }

  // Handle URL-style parameters (contains = and &)
  if (trimmedPayload.includes('=') && trimmedPayload.includes('&')) {
    // Parse as URL-style parameters: param1=value1&param2=value2
    const pairs = trimmedPayload.split('&');
    
    for (const pair of pairs) {
      if (pair.includes('=')) {
        const equalIndex = pair.indexOf('=');
        const key = pair.substring(0, equalIndex).trim();
        const value = pair.substring(equalIndex + 1).trim();
        
        if (key && value !== undefined) {
          params[decodeURIComponent(key)] = parseValue(decodeURIComponent(value));
        }
      }
    }
  } else if (trimmedPayload.includes('=')) {
    // Single URL-style parameter: param1=value1
    const equalIndex = trimmedPayload.indexOf('=');
    const key = trimmedPayload.substring(0, equalIndex).trim();
    const value = trimmedPayload.substring(equalIndex + 1).trim();
    
    if (key && value !== undefined) {
      params[decodeURIComponent(key)] = parseValue(decodeURIComponent(value));
    }
  } else {
    // Check if it's a simple number or string (likely a start parameter)
    const parts = trimmedPayload.split(/\s+/);
    
    if (parts.length === 1 && parts[0].trim()) {
      // Single value - treat as start parameter
      params.start = parts[0];
    } else {
      // Parse as space-separated parameters: param1 value1 param2 value2
      for (let i = 0; i < parts.length; i += 2) {
        const key = parts[i];
        const value = parts[i + 1];
        
        if (key) {
          if (value !== undefined) {
            params[key] = parseValue(value);
          } else {
            // If no value provided, treat as boolean true
            params[key] = true;
          }
        }
      }
    }
  }

  return params;
}

/**
 * Parse a string value to appropriate type
 * @param value - String value to parse
 * @returns Parsed value (string, number, boolean)
 */
function parseValue(value: string): string | number | boolean {
  // Try to parse as number
  if (!isNaN(Number(value)) && value.trim() !== '') {
    return Number(value);
  }
  
  // Try to parse as boolean
  if (value.toLowerCase() === 'true') {
    return true;
  }
  if (value.toLowerCase() === 'false') {
    return false;
  }
  
  // Return as string
  return value;
}

/**
 * Example usage and test cases
 */
export const startParamsExamples = {
  // Telegram start parameter
  '?start=123': { start: '123' },
  '?start=promo': { start: 'promo' },
  '?start=user123': { start: 'user123' },
  
  // Simple start parameters (single values)
  '123': { start: '123' },
  'promo': { start: 'promo' },
  'user123': { start: 'user123' },
  
  // URL-style parameters
  'param1=value1&param2=value2': { param1: 'value1', param2: 'value2' },
  'name=John&age=25&active=true': { name: 'John', age: 25, active: true },
  'ref=promo&source=telegram': { ref: 'promo', source: 'telegram' },
  
  // Space-separated parameters
  'param1 value1 param2 value2': { param1: 'value1', param2: 'value2' },
  'name John age 25 active true': { name: 'John', age: 25, active: true },
  'ref promo source telegram': { ref: 'promo', source: 'telegram' },
  
  // Single URL-style parameter
  'param1=value1': { param1: 'value1' },
  'name=John': { name: 'John' },
  
  // Mixed cases (URL-style takes precedence)
  'param1 param2': { param1: 'param2' },
  'param1=value1 param2 value2': { param1: 'value1 param2 value2' },
  
  // Empty cases
  '': {},
  undefined: {},
  null: {}
};
