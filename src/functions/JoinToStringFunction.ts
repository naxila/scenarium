import { ProcessingContext } from '../types';
import { interpolate } from '../utils/interpolation';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class JoinToStringFunction {
  static async execute(params: any, context: ProcessingContext): Promise<string> {
    const { values, separator = '', prefix = '', suffix = '' } = params;
    
    if (!Array.isArray(values)) {
      console.warn('JoinToString: values is not an array', values);
      return '';
    }

    // Interpolate/evaluate each value
    const fullContext = {
      ...context.scenarioContext,
      ...context.userContext.data,
      ...context.localContext,
      ...params // so that user function parameter references (e.g., {{text}}) are resolved
    };

    const interpolatedValues = await Promise.all(values.map(async (value) => {
      try {
        if (typeof value === 'string') {
          return interpolate(value, fullContext);
        }
        if (value && typeof value === 'object' && (value as any).function) {
          const evaluated = await FunctionProcessor.evaluateResult(value, fullContext, context);
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
    
    // Add prefix and suffix
    return prefix + result + suffix;
  }
}