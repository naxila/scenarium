import { ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class EqualsFunction {
  static async execute(params: any, context: ProcessingContext): Promise<any> {
    console.log('🔍 EqualsFunction.execute called with params:', params);
    
    // Create interpolation context for this function
    const interpolationContext = InterpolationContextBuilder.createContext(context, params);
    
    // Create local scope for function-specific variables
    interpolationContext.local.createScope();
    
    try {
      let values: any[];
      
      // Support both formats: values array and value1/value2
      if (params.values && Array.isArray(params.values)) {
        console.log('🔍 EqualsFunction: using values array format');
        values = params.values.map((v: any) => InterpolationSystem.interpolateAndClean(v, interpolationContext));
      } else if (params.value1 !== undefined && params.value2 !== undefined) {
        console.log('🔍 EqualsFunction: using value1/value2 format');
        const value1 = await FunctionProcessor.evaluateResult(params.value1, {}, context, interpolationContext);
        const value2 = await FunctionProcessor.evaluateResult(params.value2, {}, context, interpolationContext);
        values = [value1, value2];
      } else {
        throw new Error('Equals function requires either values array or value1/value2 parameters');
      }
      
      console.log('🔍 EqualsFunction: interpolated values:', values);
      
      const areEqual = values.every((v: any) => v === values[0]);
      console.log('🔍 EqualsFunction: areEqual:', areEqual);
      
      // Set function-specific variables
      interpolationContext.local.setVariable('values', values);
      interpolationContext.local.setVariable('areEqual', areEqual);
      interpolationContext.local.setVariable('result', null);
      
      if (areEqual && params.trueResult) {
        console.log('🔍 EqualsFunction: executing trueResult');
        const result = await FunctionProcessor.evaluateResult(params.trueResult, {}, context, interpolationContext);
        interpolationContext.local.setVariable('result', result);
        console.log('🔍 EqualsFunction: trueResult result:', result);
        return result;
      } else if (!areEqual && params.falseResult) {
        console.log('🔍 EqualsFunction: executing falseResult');
        const result = await FunctionProcessor.evaluateResult(params.falseResult, {}, context, interpolationContext);
        interpolationContext.local.setVariable('result', result);
        console.log('🔍 EqualsFunction: falseResult result:', result);
        return result;
      }
      
      console.log('🔍 EqualsFunction: returning areEqual:', areEqual);
      return areEqual;
      
    } catch (error) {
      console.error('❌ EqualsFunction error:', error);
      throw error;
    } finally {
      // Clean up local scope when function completes
      interpolationContext.local.clearScope();
    }
  }
}