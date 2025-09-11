import { ProcessingContext } from '../types';
import { interpolate } from '../utils/interpolation';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class EqualsFunction {
  static async execute(params: any, context: ProcessingContext): Promise<any> {
    const fullContext = {
      ...context.scenarioContext,
      ...context.userContext.data,
      ...context.localContext
    };
    
    const values = params.values.map((v: any) => interpolate(v, fullContext));
    const areEqual = values.every((v: any) => v === values[0]);
    
    if (areEqual && params.trueResult) {
      return await FunctionProcessor.evaluateResult(params.trueResult, {}, context);
    } else if (!areEqual && params.falseResult) {
      return await FunctionProcessor.evaluateResult(params.falseResult, {}, context);
    }
    
    return areEqual;
  }
}