import { ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class SwitchFunction {
  static async execute(params: any, context: ProcessingContext): Promise<any> {
    console.log('🔍 SwitchFunction.execute called with params:', params);
    
    const { value, cases, defaultResult } = params;
    
    if (value === undefined) {
      throw new Error('Switch function requires value parameter');
    }
    
    if (!cases || !Array.isArray(cases)) {
      throw new Error('Switch function requires cases array parameter');
    }
    
    // Create interpolation context for this function
    const interpolationContext = InterpolationContextBuilder.createContext(context, params);
    
    // Create local scope for function-specific variables
    interpolationContext.local.createScope();
    
    try {
      // Evaluate the value to compare against
      let evaluatedValue = value;
      if (value && typeof value === 'object' && value.function) {
        console.log('🔍 SwitchFunction: evaluating value function');
        evaluatedValue = await FunctionProcessor.evaluateResult(value, {}, context, interpolationContext);
      } else if (typeof value === 'string') {
        evaluatedValue = InterpolationSystem.interpolateAndClean(value, interpolationContext);
      }
      
      console.log('🔍 SwitchFunction: evaluated value:', evaluatedValue);
      
      // Set function-specific variables
      interpolationContext.local.setVariable('value', evaluatedValue);
      interpolationContext.local.setVariable('result', null);
      
      // Find matching case
      for (const caseItem of cases) {
        if (!caseItem.match) {
          console.warn('🔍 SwitchFunction: case item missing match property, skipping');
          continue;
        }
        
        // Evaluate the match condition
        let matchValue = caseItem.match;
        if (matchValue && typeof matchValue === 'object' && matchValue.function) {
          console.log('🔍 SwitchFunction: evaluating match function');
          matchValue = await FunctionProcessor.evaluateResult(matchValue, {}, context, interpolationContext);
        } else if (typeof matchValue === 'string') {
          matchValue = InterpolationSystem.interpolateAndClean(matchValue, interpolationContext);
        }
        
        console.log('🔍 SwitchFunction: comparing', evaluatedValue, 'with', matchValue);
        
        // Check if values match (strict equality)
        if (evaluatedValue === matchValue) {
          console.log('🔍 SwitchFunction: match found, executing result');
          
          // Evaluate the result
          let result = caseItem.result;
          if (result && typeof result === 'object' && result.function) {
            console.log('🔍 SwitchFunction: evaluating result function');
            result = await FunctionProcessor.evaluateResult(result, {}, context, interpolationContext);
          } else if (typeof result === 'string') {
            result = InterpolationSystem.interpolateAndClean(result, interpolationContext);
          }
          
          interpolationContext.local.setVariable('result', result);
          console.log('🔍 SwitchFunction: returning result:', result);
          return result;
        }
      }
      
      // No match found, check for default result
      if (defaultResult !== undefined) {
        console.log('🔍 SwitchFunction: no match found, executing default result');
        
        let result = defaultResult;
        if (result && typeof result === 'object' && result.function) {
          console.log('🔍 SwitchFunction: evaluating default result function');
          result = await FunctionProcessor.evaluateResult(result, {}, context, interpolationContext);
        } else if (typeof result === 'string') {
          result = InterpolationSystem.interpolateAndClean(result, interpolationContext);
        }
        
        interpolationContext.local.setVariable('result', result);
        console.log('🔍 SwitchFunction: returning default result:', result);
        return result;
      }
      
      console.log('🔍 SwitchFunction: no match found and no default result');
      return null;
      
    } catch (error) {
      console.error('❌ SwitchFunction error:', error);
      throw error;
    } finally {
      // Clean up local scope when function completes
      interpolationContext.local.clearScope();
    }
  }
}
