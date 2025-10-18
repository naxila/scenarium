import { ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';

export class DivideFunction {
  static async execute(params: any, context: ProcessingContext): Promise<number> {
    const { values } = params;
    
    if (!Array.isArray(values)) {
      throw new Error('Divide function requires "values" parameter as array');
    }
    
    if (values.length === 0) {
      throw new Error('Divide function requires at least one value');
    }
    
    // Create interpolation context for this function
    const interpolationContext = InterpolationContextBuilder.createContext(context, params);
    interpolationContext.local.createScope();
    
    try {
      // Process first value
      let firstValue = values[0];
      if (typeof firstValue === 'string') {
        firstValue = InterpolationSystem.interpolateAndClean(firstValue, interpolationContext);
      }
      
      if (values.length === 1) {
        const num = DivideFunction.parseNumber(firstValue);
        if (isNaN(num)) {
          throw new Error(`Divide function: invalid number "${firstValue}"`);
        }
        if (num === 0) {
          throw new Error('Divide function: division by zero');
        }
        const result = 1 / num; // Reciprocal
        interpolationContext.local.setVariable('result', result);
        return result;
      }
      
      // Start with first value, divide by all others
      let result = DivideFunction.parseNumber(firstValue);
      if (isNaN(result)) {
        throw new Error(`Divide function: invalid number "${firstValue}"`);
      }
      
      for (let i = 1; i < values.length; i++) {
        let processedValue = values[i];
        if (typeof processedValue === 'string') {
          processedValue = InterpolationSystem.interpolateAndClean(processedValue, interpolationContext);
        }
        
        const num = DivideFunction.parseNumber(processedValue);
        if (isNaN(num)) {
          throw new Error(`Divide function: invalid number "${processedValue}"`);
        }
        if (num === 0) {
          throw new Error('Divide function: division by zero');
        }
        result /= num;
      }
      
      interpolationContext.local.setVariable('result', result);
      return result;
    } finally {
      interpolationContext.local.clearScope();
    }
  }
  
  private static parseNumber(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? NaN : parsed;
    }
    
    return NaN;
  }
}