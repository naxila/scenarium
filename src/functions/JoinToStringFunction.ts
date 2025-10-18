import { ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class JoinToStringFunction {
  static async execute(params: any, context: ProcessingContext): Promise<string> {
    let { values, separator = '', prefix = '', suffix = '' } = params;
    
    // ПРИНЦИП: Единственная ответственность - JoinToString должна уметь получить массив из функций
    if (values && typeof values === 'object' && values.function) {
      console.log('🔗 JoinToString: Evaluating function to get values array');
      try {
        values = await FunctionProcessor.evaluateResult(values, {}, context, context.interpolationContext);
      } catch (e) {
        console.error('JoinToString: Failed to evaluate values function:', e);
        return '';
      }
    }
    
    if (!Array.isArray(values)) {
      console.warn('JoinToString: values is not an array after evaluation', values);
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
            return InterpolationSystem.interpolateAndClean(value, interpolationContext);
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