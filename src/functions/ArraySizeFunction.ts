import { ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class ArraySizeFunction {
  static async execute(params: any, context: ProcessingContext): Promise<number> {
    const interpolationContext = InterpolationContextBuilder.createContext(context, params);
    interpolationContext.local.createScope();

    try {
      if (!params.value) {
        throw new Error('ArraySize function requires a "value" parameter');
      }

      let arrayValue = params.value;
      
      // If value is a function, evaluate it first
      if (arrayValue && typeof arrayValue === 'object' && arrayValue.function) {
        arrayValue = await FunctionProcessor.evaluateResult(arrayValue, {}, context, interpolationContext);
      } else if (typeof arrayValue === 'string') {
        arrayValue = InterpolationSystem.interpolateAndClean(arrayValue, interpolationContext);
      }

      // Ensure it's an array
      if (!Array.isArray(arrayValue)) {
        throw new Error(`ArraySize function: value parameter must be an array, got ${typeof arrayValue}`);
      }

      const size = arrayValue.length;
      console.log(`🔍 ArraySizeFunction: Array has ${size} elements`);
      
      interpolationContext.local.setVariable('result', size);
      return size;

    } catch (error) {
      console.error('❌ ArraySizeFunction error:', error);
      throw error;
    } finally {
      interpolationContext.local.clearScope();
    }
  }
}
