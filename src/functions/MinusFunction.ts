import { ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';

export class MinusFunction {
  static async execute(params: any, context: ProcessingContext): Promise<number> {
    const { values } = params;
    
    if (!Array.isArray(values)) {
      throw new Error('Minus function requires "values" parameter as array');
    }
    
    if (values.length === 0) {
      return 0;
    }
    
    // Create interpolation context for this function
    const interpolationContext = InterpolationContextBuilder.createContext(context, params);
    interpolationContext.local.createScope();
    
    try {
      // Process first value
      let firstValue = values[0];
      if (typeof firstValue === 'string') {
        firstValue = InterpolationSystem.interpolate(firstValue, interpolationContext);
      }
      
      if (values.length === 1) {
        const num = MinusFunction.parseNumber(firstValue);
        if (isNaN(num)) {
          throw new Error(`Minus function: invalid number "${firstValue}"`);
        }
        const result = -num; // Unary minus
        interpolationContext.local.setVariable('result', result);
        return result;
      }
      
      // Start with first value, subtract all others
      let result = MinusFunction.parseNumber(firstValue);
      if (isNaN(result)) {
        throw new Error(`Minus function: invalid number "${firstValue}"`);
      }
      
      for (let i = 1; i < values.length; i++) {
        let processedValue = values[i];
        if (typeof processedValue === 'string') {
          processedValue = InterpolationSystem.interpolate(processedValue, interpolationContext);
        }
        
        const num = MinusFunction.parseNumber(processedValue);
        if (isNaN(num)) {
          throw new Error(`Minus function: invalid number "${processedValue}"`);
        }
        result -= num;
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