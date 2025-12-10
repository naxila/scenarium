import { InterpolationContext } from './InterpolationContext';

declare const console: any;

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
   * Returns raw value if string contains only single interpolation, otherwise returns string
   */
  private static interpolateString(str: string, context: InterpolationContext): any {
    // Check if the string contains only a single interpolation without any other text
    const interpolationMatch = str.match(/^\{\{([^}]+)\}\}$/);
    if (interpolationMatch) {
      // Single interpolation - preserve original type
      const variable = interpolationMatch[1].trim();
      
      // Function calls are not supported in string interpolation
      if (this.isFunctionCall(variable)) {
        // eslint-disable-next-line no-console
        console.warn(`Function call ${variable} not supported in string interpolation. Use object syntax instead.`);
        return `{{${variable}}}`;
      }
      
      // Get the raw value without string conversion
      let value: any;
      
      // Handle explicit prefixes
      if (variable.startsWith('local.')) {
        const varName = variable.substring(6);
        // If no varName (just "local"), return all local scopes
        if (!varName) {
          const allScopes = context.local.getAllScopes();
          value = allScopes.length > 0 ? Object.assign({}, ...allScopes.reverse()) : undefined;
        } else {
          value = context.local.findVariable(varName);
        }
      } else if (variable.startsWith('data.')) {
        const varName = variable.substring(5);
        // If no varName (just "data"), return whole data object
        value = varName ? this.getNestedValue(context.data, varName) : context.data;
      } else if (variable.startsWith('env.')) {
        const varName = variable.substring(4);
        // If no varName (just "env"), return whole env object
        value = varName ? this.getNestedValue(context.env, varName) : context.env;
      } else if (variable.startsWith('params.')) {
        const varName = variable.substring(7);
        // If no varName (just "params"), return whole params object
        value = varName ? this.getNestedValue(context.params, varName) : context.params;
      } else {
        // Search by priority: local -> params -> data -> env
        value = this.findVariableByPriorityRaw(context, variable);
      }
      
      // If value is undefined, return original variable syntax
      if (value === undefined) {
        return `{{${variable}}}`;
      }
      
      // Return the raw value (preserve type for Map function compatibility)
      return value;
    }
    
    // Multiple interpolations or mixed text - convert to string
    return str.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const trimmedVar = variable.trim();
      
      // Function calls are not supported in string interpolation
      if (this.isFunctionCall(trimmedVar)) {
        // eslint-disable-next-line no-console
        console.warn(`Function call ${trimmedVar} not supported in string interpolation. Use object syntax instead.`);
        return `{{${trimmedVar}}}`;
      }
      
      // Handle explicit prefixes
      if (trimmedVar.startsWith('local.')) {
        const varName = trimmedVar.substring(6);
        // If no varName (just "local"), return stringified local scopes
        if (!varName) {
          const allScopes = context.local.getAllScopes();
          return allScopes.length > 0 ? this.formatValue(Object.assign({}, ...allScopes.reverse())) : '{}';
        }
        return this.getVariableValue(context, 'local', varName);
      }
      
      if (trimmedVar.startsWith('data.')) {
        const varName = trimmedVar.substring(5);
        // If no varName (just "data"), return stringified data object
        if (!varName) {
          return context.data ? this.formatValue(context.data) : '{}';
        }
        return this.getVariableValue(context, 'data', varName);
      }
      
      if (trimmedVar.startsWith('env.')) {
        const varName = trimmedVar.substring(4);
        // If no varName (just "env"), return stringified env object
        if (!varName) {
          return context.env ? this.formatValue(context.env) : '{}';
        }
        return this.getVariableValue(context, 'env', varName);
      }
      
      if (trimmedVar.startsWith('params.')) {
        const varName = trimmedVar.substring(7);
        // If no varName (just "params"), return stringified params object
        if (!varName) {
          return context.params ? this.formatValue(context.params) : '{}';
        }
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
    // Special case: if varName is exactly 'params', 'data', 'env', or 'local' - return stringified object
    if (varName === 'params' && context.params) {
      return this.formatValue(context.params);
    }
    if (varName === 'data' && context.data) {
      return this.formatValue(context.data);
    }
    if (varName === 'env' && context.env) {
      return this.formatValue(context.env);
    }
    if (varName === 'local') {
      const allScopes = context.local.getAllScopes();
      if (allScopes.length > 0) {
        return this.formatValue(Object.assign({}, ...allScopes.reverse()));
      }
      return '{}';
    }
    
    // Debug log for response.* variables
    if (varName.startsWith('response.')) {
      // eslint-disable-next-line no-console
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
      if (varName.startsWith('response.')) {
        // eslint-disable-next-line no-console
        console.log(`✅ Found ${varName} in local:`, value);
      }
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
    if (varName.startsWith('response.')) {
      // eslint-disable-next-line no-console
      console.log(`❌ Variable ${varName} not found`);
    }
    return `{{${varName}}}`;
  }

  /**
   * Find variable by priority: local -> params -> data -> env (returns raw value)
   */
  private static findVariableByPriorityRaw(context: InterpolationContext, varName: string): any {
    // Special case: if varName is exactly 'params', 'data', 'env', or 'local' - return the object itself
    if (varName === 'params' && context.params) {
      return context.params;
    }
    if (varName === 'data' && context.data) {
      return context.data;
    }
    if (varName === 'env' && context.env) {
      return context.env;
    }
    if (varName === 'local') {
      // For local, return all scopes as a single object
      const allScopes = context.local.getAllScopes();
      if (allScopes.length > 0) {
        return Object.assign({}, ...allScopes.reverse());
      }
      return undefined;
    }
    
    // 1. Search in local scope
    let value = context.local.findVariable(varName);
    if (value !== undefined) {
      return value;
    }
    
    // 2. Search in params
    value = this.getNestedValue(context.params, varName);
    if (value !== undefined) {
      return value;
    }
    
    // 3. Search in data
    value = this.getNestedValue(context.data, varName);
    if (value !== undefined) {
      return value;
    }
    
    // 4. Search in env
    value = this.getNestedValue(context.env, varName);
    if (value !== undefined) {
      return value;
    }
    
    // Variable not found - return undefined
    return undefined;
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
       * Interpolate and clean up remaining {{}} variables
       */
      static interpolateAndClean(value: any, context: InterpolationContext): any {
        const result = this.interpolate(value, context);
        
        // В самом конце заменяем оставшиеся {{}} на пустую строку только в строках
        if (typeof result === 'string' && result.includes('{{') && result.includes('}}')) {
          const cleaned = result.replace(/\{\{[^}]+\}\}/g, '');
          console.log(`🧹 InterpolationSystem.interpolateAndClean: cleaned "${result}" -> "${cleaned}"`);
          return cleaned;
        }
        
        return result;
      }

}
