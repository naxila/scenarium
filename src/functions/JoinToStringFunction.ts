import { ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class JoinToStringFunction {
  static async execute(params: any, context: ProcessingContext): Promise<string> {
    const { values, separator = '', prefix = '', suffix = '' } = params;
    
    if (!Array.isArray(values)) {
      console.warn('JoinToString: values is not an array', values);
      return '';
    }

    // Create interpolation context for this function
    const interpolationContext = InterpolationContextBuilder.createContext(context, params);
    
    // Create local scope for function-specific variables
    interpolationContext.local.createScope();
    
    // Set function-specific variables
    interpolationContext.local.setVariable('separator', separator);
    interpolationContext.local.setVariable('prefix', prefix);
    interpolationContext.local.setVariable('suffix', suffix);
    interpolationContext.local.setVariable('result', '');
    
    try {

      const interpolatedValues = await Promise.all(values.map(async (value) => {
        try {
          if (typeof value === 'string') {
            return InterpolationSystem.interpolate(value, interpolationContext);
          }
          if (value && typeof value === 'object' && (value as any).function) {
            const evaluated = await FunctionProcessor.evaluateResult(value, {}, context, interpolationContext);
            return evaluated != null ? String(evaluated) : '';
          }
          return value != null ? String(value) : '';
        } catch (e) {
          console.error('JoinToString: failed to process value', value, e);
          return '';
        }
      }));

      // Filter empty values
      const filteredValues = interpolatedValues.filter(value => 
        value !== null && value !== undefined && value !== ''
      );

      // Join with separator
      const result = filteredValues.join(separator);
      
      // Update local variables
      interpolationContext.local.setVariable('result', result);
      interpolationContext.local.setVariable('count', filteredValues.length);
      
      // Add prefix and suffix
      return prefix + result + suffix;
      
    } finally {
      // Clean up local scope when function completes
      interpolationContext.local.clearScope();
    }
  }
}