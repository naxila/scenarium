import { ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class EqualsFunction {
  static async execute(params: any, context: ProcessingContext): Promise<any> {
    // Create interpolation context for this function
    const interpolationContext = InterpolationContextBuilder.createContext(context, params);
    
    // Create local scope for function-specific variables
    interpolationContext.local.createScope();
    
    try {
      // Set function-specific variables
      interpolationContext.local.setVariable('values', params.values);
      interpolationContext.local.setVariable('areEqual', false);
      interpolationContext.local.setVariable('result', null);
      
      const values = params.values.map((v: any) => InterpolationSystem.interpolate(v, interpolationContext));
      const areEqual = values.every((v: any) => v === values[0]);
      
      // Update local variables
      interpolationContext.local.setVariable('areEqual', areEqual);
      interpolationContext.local.setVariable('values', values);
      
      if (areEqual && params.trueResult) {
        const result = await FunctionProcessor.evaluateResult(params.trueResult, {}, context);
        interpolationContext.local.setVariable('result', result);
        return result;
      } else if (!areEqual && params.falseResult) {
        const result = await FunctionProcessor.evaluateResult(params.falseResult, {}, context);
        interpolationContext.local.setVariable('result', result);
        return result;
      }
      
      return areEqual;
      
    } finally {
      // Clean up local scope when function completes
      interpolationContext.local.clearScope();
    }
  }
}