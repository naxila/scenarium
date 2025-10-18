import { ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';

export class ModFunction {
  static async execute(params: any, context: ProcessingContext): Promise<number> {
    const { dividend, divisor } = params;
    
    if (dividend === undefined || divisor === undefined) {
      throw new Error('Mod function requires "dividend" and "divisor" parameters');
    }
    
    // Create interpolation context for this function
    const interpolationContext = InterpolationContextBuilder.createContext(context, params);
    interpolationContext.local.createScope();
    
    try {
      // Process dividend
      let processedDividend = dividend;
      if (typeof dividend === 'string') {
        processedDividend = InterpolationSystem.interpolateAndClean(dividend, interpolationContext);
      }
      
      // Process divisor
      let processedDivisor = divisor;
      if (typeof divisor === 'string') {
        processedDivisor = InterpolationSystem.interpolateAndClean(divisor, interpolationContext);
      }
      
      const num1 = ModFunction.parseNumber(processedDividend);
      const num2 = ModFunction.parseNumber(processedDivisor);
      
      if (isNaN(num1)) {
        throw new Error(`Mod function: invalid dividend "${processedDividend}"`);
      }
      
      if (isNaN(num2)) {
        throw new Error(`Mod function: invalid divisor "${processedDivisor}"`);
      }
      
      if (num2 === 0) {
        throw new Error('Mod function: modulo by zero');
      }
      
      const result = num1 % num2;
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