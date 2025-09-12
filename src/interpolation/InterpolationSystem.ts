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
      
      // Function calls are not supported in string interpolation
      // Use FunctionProcessor.evaluateResult() with object syntax for functions
      if (this.isFunctionCall(trimmedVar)) {
        console.warn(`Function call ${trimmedVar} not supported in string interpolation. Use object syntax instead.`);
        return `{{${trimmedVar}}}`;
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


}
