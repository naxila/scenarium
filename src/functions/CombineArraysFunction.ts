import { ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class CombineArraysFunction {
  static async execute(params: any, context: ProcessingContext): Promise<any[]> {
    console.log('🔍 CombineArraysFunction.execute called with params:', params);
    
    const { arrays } = params;
    
    if (!arrays || !Array.isArray(arrays)) {
      throw new Error('CombineArrays function requires arrays parameter (array of arrays)');
    }
    
    // Create interpolation context for this function
    const interpolationContext = InterpolationContextBuilder.createContext(context, params);
    
    // Create local scope for function-specific variables
    interpolationContext.local.createScope();
    
    try {
      const combinedArray: any[] = [];
      
      // Set function-specific variables
      interpolationContext.local.setVariable('arrays', arrays);
      interpolationContext.local.setVariable('result', combinedArray);
      
      // Process each array
      for (let i = 0; i < arrays.length; i++) {
        let array = arrays[i];
        
        console.log(`🔍 CombineArraysFunction: processing array ${i}:`, array);
        
        // Evaluate the array if it's a function
        if (array && typeof array === 'object' && array.function) {
          console.log(`🔍 CombineArraysFunction: evaluating array ${i} function`);
          array = await FunctionProcessor.evaluateResult(array, {}, context, interpolationContext);
        } else if (typeof array === 'string') {
          array = InterpolationSystem.interpolateAndClean(array, interpolationContext);
        }
        
        // Ensure it's an array, skip null/undefined values
        if (!array || !Array.isArray(array)) {
          if (array !== null && array !== undefined) {
            console.warn(`🔍 CombineArraysFunction: array ${i} is not an array after evaluation, skipping:`, array);
          }
          continue;
        }
        
        console.log(`🔍 CombineArraysFunction: adding ${array.length} items from array ${i}`);
        
        // Add all items from this array to the combined array
        combinedArray.push(...array);
      }
      
      interpolationContext.local.setVariable('result', combinedArray);
      interpolationContext.local.setVariable('count', combinedArray.length);
      
      console.log('🔍 CombineArraysFunction: combined array result:', combinedArray);
      return combinedArray;
      
    } catch (error) {
      console.error('❌ CombineArraysFunction error:', error);
      throw error;
    } finally {
      // Clean up local scope when function completes
      interpolationContext.local.clearScope();
    }
  }
}
