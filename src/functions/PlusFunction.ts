import { ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';

export class PlusFunction {
  static async execute(params: any, context: ProcessingContext): Promise<number> {
    const { values } = params;
    
    if (!Array.isArray(values)) {
      throw new Error('Plus function requires "values" parameter as array');
    }
    
    if (values.length === 0) {
      return 0;
    }
    
    // Create interpolation context for this function
    const interpolationContext = InterpolationContextBuilder.createContext(context, params);
    interpolationContext.local.createScope();
    
    try {
      let sum = 0;
      for (const value of values) {
        // Interpolate value if it's a string
        let processedValue = value;
        if (typeof value === 'string') {
          processedValue = InterpolationSystem.interpolateAndClean(value, interpolationContext);
        }
        
        const num = PlusFunction.parseNumber(processedValue);
        if (isNaN(num)) {
          throw new Error(`Plus function: invalid number "${processedValue}"`);
        }
        sum += num;
      }
      
      interpolationContext.local.setVariable('result', sum);
      return sum;
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
