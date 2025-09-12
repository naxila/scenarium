import { ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';

export class MultiplyFunction {
  static async execute(params: any, context: ProcessingContext): Promise<number> {
    const { values } = params;
    
    if (!Array.isArray(values)) {
      throw new Error('Multiply function requires "values" parameter as array');
    }
    
    if (values.length === 0) {
      return 1; // Multiplicative identity
    }
    
    // Create interpolation context for this function
    const interpolationContext = InterpolationContextBuilder.createContext(context, params);
    interpolationContext.local.createScope();
    
    try {
      let result = 1;
      for (const value of values) {
        // Interpolate value if it's a string
        let processedValue = value;
        if (typeof value === 'string') {
          processedValue = InterpolationSystem.interpolate(value, interpolationContext);
        }
        
        const num = MultiplyFunction.parseNumber(processedValue);
        if (isNaN(num)) {
          throw new Error(`Multiply function: invalid number "${processedValue}"`);
        }
        result *= num;
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