import { InterpolationContext } from './InterpolationContext';

export class InterpolationSystem {
  /**
   * Interpolate a value using the new context system
   */
  static interpolate(value: any, context: InterpolationContext): any {
    if (typeof value === 'string') {
      return this.interpolateString(value, context);
    }
    
    if (Array.isArray(value)) {
      return value.map(item => this.interpolate(item, context));
    }
    
    if (value && typeof value === 'object') {
      const result: any = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = this.interpolate(val, context);
      }
      return result;
    }
    
    return value;
  }

  /**
   * Interpolate a string with {{variable}} syntax
   */
  private static interpolateString(str: string, context: InterpolationContext): string {
    return str.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const trimmedVar = variable.trim();
      
      // Handle function calls (e.g., {{JoinToString:values:features:separator:,}})
      if (this.isFunctionCall(trimmedVar)) {
        return this.executeFunction(trimmedVar, context);
      }
      
      // Handle explicit prefixes
      if (trimmedVar.startsWith('local.')) {
        const varName = trimmedVar.substring(6);
        return this.getVariableValue(context, 'local', varName);
      }
      
      if (trimmedVar.startsWith('data.')) {
        const varName = trimmedVar.substring(5);
        return this.getVariableValue(context, 'data', varName);
      }
      
      if (trimmedVar.startsWith('env.')) {
        const varName = trimmedVar.substring(4);
        return this.getVariableValue(context, 'env', varName);
      }
      
      if (trimmedVar.startsWith('params.')) {
        const varName = trimmedVar.substring(7);
        return this.getVariableValue(context, 'params', varName);
      }
      
      // Search by priority: local -> params -> data -> env
      return this.findVariableByPriority(context, trimmedVar);
    });
  }

  /**
   * Get variable value from specific context
   */
  private static getVariableValue(
    context: InterpolationContext, 
    source: 'local' | 'data' | 'env' | 'params', 
    varName: string
  ): string {
    let value: any;
    
    switch (source) {
      case 'local':
        value = context.local.findVariable(varName);
        break;
      case 'data':
        value = this.getNestedValue(context.data, varName);
        break;
      case 'env':
        value = this.getNestedValue(context.env, varName);
        break;
      case 'params':
        value = this.getNestedValue(context.params, varName);
        break;
    }
    
    // If value is undefined, return original variable syntax
    if (value === undefined) {
      return `{{${source}.${varName}}}`;
    }
    
    return this.formatValue(value);
  }

  /**
   * Find variable by priority: local -> params -> data -> env
   */
  private static findVariableByPriority(context: InterpolationContext, varName: string): string {
    // Debug log for response.* variables
    if (varName.startsWith('response.')) {
      console.log(`🔍 Looking for ${varName}:`, {
        localScopes: context.local.getAllScopes(),
        hasParams: !!context.params,
        hasData: !!context.data,
        hasEnv: !!context.env
      });
    }
    
    // 1. Search in local scope
    let value = context.local.findVariable(varName);
    if (value !== undefined) {
      if (varName.startsWith('response.')) console.log(`✅ Found ${varName} in local:`, value);
      return this.formatValue(value);
    }
    
    // 2. Search in params
    value = this.getNestedValue(context.params, varName);
    if (value !== undefined) {
      return this.formatValue(value);
    }
    
    // 3. Search in data
    value = this.getNestedValue(context.data, varName);
    if (value !== undefined) {
      return this.formatValue(value);
    }
    
    // 4. Search in env
    value = this.getNestedValue(context.env, varName);
    if (value !== undefined) {
      return this.formatValue(value);
    }
    
    // Variable not found - return original variable syntax
    if (varName.startsWith('response.')) console.log(`❌ Variable ${varName} not found`);
    return `{{${varName}}}`;
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Format value for output
   */
  private static formatValue(value: any): string {
    if (value === null || value === undefined) {
      return ''; // Return empty string for null/undefined values
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  }

  /**
   * Check if a variable is a function call
   */
  private static isFunctionCall(variable: string): boolean {
    // Check if it contains colons (function syntax: FunctionName:param1:value1:param2:value2)
    return variable.includes(':') && !variable.startsWith('local.') && !variable.startsWith('data.') && !variable.startsWith('env.') && !variable.startsWith('params.');
  }

  /**
   * Execute a function call
   */
  private static executeFunction(variable: string, context: InterpolationContext): string {
    try {
      // Parse function call: FunctionName:param1:value1:param2:value2
      const parts = variable.split(':');
      const functionName = parts[0];
      
      // Convert remaining parts to params object
      const params: Record<string, any> = {};
      for (let i = 1; i < parts.length; i += 2) {
        if (i + 1 < parts.length) {
          const key = parts[i];
          let value = parts[i + 1];
          
          // Special handling for 'values' parameter - collect multiple values
          if (key === 'values') {
            const values = [];
            let j = i + 1;
            // Collect consecutive values until we hit another key:value pair
            while (j < parts.length && !this.isParameterKey(parts, j)) {
              let val = parts[j];
              if (this.isVariableReference(val)) {
                val = this.findVariableByPriority(context, val);
              } else {
                try {
                  val = JSON.parse(val);
                } catch {
                  // Keep as string
                }
              }
              values.push(val);
              j++;
            }
            params[key] = values;
            i = j - 2; // Adjust the loop counter
          } else {
            // Check if value is a variable reference (not JSON)
            if (this.isVariableReference(value)) {
              // Resolve variable reference
              value = this.findVariableByPriority(context, value);
            } else {
              // Try to parse value as JSON, fallback to string
              try {
                value = JSON.parse(value);
              } catch {
                // Keep as string
              }
            }
            
            params[key] = value;
          }
        }
      }

      // Import FunctionRegistry dynamically to avoid circular dependency
      const { FunctionRegistry } = require('../registry/FunctionRegistry');
      
      if (FunctionRegistry.has(functionName)) {
        // Simple synchronous execution for string interpolation
        try {
          const result = this.executeFunctionSync(functionName, params, context);
          return this.formatValue(result);
        } catch (error) {
          console.error(`Error executing function ${functionName}:`, error);
          return `[${functionName} error: ${error instanceof Error ? error.message : 'Unknown error'}]`;
        }
      }
      
      return `[Function ${functionName} not found]`;
    } catch (error) {
      console.error(`Error executing function ${variable}:`, error);
      return `[Function error: ${error instanceof Error ? error.message : 'Unknown error'}]`;
    }
  }

  /**
   * Check if a value is a variable reference (not JSON)
   */
  private static isVariableReference(value: string): boolean {
    // If it's a simple word (no spaces, no special chars), it's likely a variable
    return /^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(value) && !value.includes('[') && !value.includes('{');
  }

  /**
   * Check if a part is a parameter key (by checking if the next part exists and forms a key:value pair)
   */
  private static isParameterKey(parts: string[], index: number): boolean {
    // A parameter key should have a corresponding value
    if (index + 1 >= parts.length) return false;
    
    // Known parameter keys for functions
    const knownKeys = ['separator', 'prefix', 'suffix', 'trueResult', 'falseResult', 'key', 'fallbackValue'];
    return knownKeys.includes(parts[index]);
  }

  /**
   * Execute function synchronously for string interpolation
   */
  private static executeFunctionSync(functionName: string, params: any, context: any): any {
    switch (functionName) {
      case 'JoinToString':
        return this.joinToStringSync(params);
      case 'Equals':
        return this.equalsSync(params);
      case 'ReadStorage':
        return this.readStorageSync(params, context);
      default:
        throw new Error(`Unsupported function for sync execution: ${functionName}`);
    }
  }

  /**
   * Synchronous version of JoinToString
   */
  private static joinToStringSync(params: any): string {
    const { values, separator = '', prefix = '', suffix = '' } = params;
    
    if (!Array.isArray(values)) {
      console.warn('JoinToString: values is not an array', values);
      return '';
    }

    const result = values.map(value => String(value)).join(separator);
    return prefix + result + suffix;
  }

  /**
   * Synchronous version of Equals
   */
  private static equalsSync(params: any): string {
    const { values, trueResult = 'true', falseResult = 'false' } = params;
    
    if (!Array.isArray(values) || values.length < 2) {
      return falseResult;
    }

    const first = values[0];
    const allEqual = values.every(value => value === first);
    return allEqual ? trueResult : falseResult;
  }

  /**
   * Synchronous version of ReadStorage
   */
  private static readStorageSync(params: any, context: any): string {
    const { key, fallbackValue = '' } = params;
    
    // Get storage from user context
    const storage = context.userContext?.__storage || {};
    const item = storage[key];
    
    if (item && typeof item === 'object' && 'value' in item) {
      return String(item.value);
    }
    
    return String(fallbackValue);
  }
}
