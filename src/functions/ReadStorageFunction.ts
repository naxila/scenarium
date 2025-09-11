import { ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';

export class ReadStorageFunction {
  static async execute(params: any, context: ProcessingContext): Promise<any> {
    // Create interpolation context for this function
    const interpolationContext = InterpolationContextBuilder.createContext(context, params);
    
    // Create local scope for function-specific variables
    interpolationContext.local.createScope();
    
    try {
      // Set function-specific variables
      interpolationContext.local.setVariable('key', params.key);
      interpolationContext.local.setVariable('fallbackValue', params.fallbackValue);
      interpolationContext.local.setVariable('found', false);
      interpolationContext.local.setVariable('result', null);
      
      const { key, fallbackValue } = params || {};
      if (!key) return fallbackValue;

      const storage = (context.userContext.data.__storage || {}) as Record<string, { value: any, clearAfterRead?: boolean }>;
      const record = storage[key];
      if (!record) return fallbackValue;

      const result = record.value;
      
      // Update local variables
      interpolationContext.local.setVariable('found', true);
      interpolationContext.local.setVariable('result', result);
      
      if (record.clearAfterRead) {
        delete storage[key];
        context.userContext.data.__storage = storage;
        interpolationContext.local.setVariable('cleared', true);
      }
      
      return result;
      
    } finally {
      // Clean up local scope when function completes
      interpolationContext.local.clearScope();
    }
  }
}


