import { ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class CompareFunction {
  static async execute(params: any, context: ProcessingContext): Promise<boolean> {
    const interpolationContext = InterpolationContextBuilder.createContext(context, params);
    interpolationContext.local.createScope();

    try {
      if (params.value1 === undefined || params.value1 === null) {
        throw new Error('Compare function requires a "value1" parameter');
      }

      if (params.value2 === undefined || params.value2 === null) {
        throw new Error('Compare function requires a "value2" parameter');
      }

      if (!params.operator) {
        throw new Error('Compare function requires an "operator" parameter');
      }

      let value1 = params.value1;
      let value2 = params.value2;
      let operator = params.operator;
      
      // If value1 is a function, evaluate it first
      if (value1 && typeof value1 === 'object' && value1.function) {
        value1 = await FunctionProcessor.evaluateResult(value1, {}, context, interpolationContext);
      } else if (typeof value1 === 'string') {
        value1 = InterpolationSystem.interpolateAndClean(value1, interpolationContext);
      }

      // If value2 is a function, evaluate it first
      if (value2 && typeof value2 === 'object' && value2.function) {
        value2 = await FunctionProcessor.evaluateResult(value2, {}, context, interpolationContext);
      } else if (typeof value2 === 'string') {
        value2 = InterpolationSystem.interpolateAndClean(value2, interpolationContext);
      }

      // If operator is a function, evaluate it first
      if (operator && typeof operator === 'object' && operator.function) {
        operator = await FunctionProcessor.evaluateResult(operator, {}, context, interpolationContext);
      } else if (typeof operator === 'string') {
        operator = InterpolationSystem.interpolateAndClean(operator, interpolationContext);
      }

      // Convert values to numbers
      const num1 = Number(value1);
      const num2 = Number(value2);

      if (isNaN(num1)) {
        throw new Error(`Compare function: value1 "${value1}" is not a valid number`);
      }

      if (isNaN(num2)) {
        throw new Error(`Compare function: value2 "${value2}" is not a valid number`);
      }

      let result: boolean;

      switch (operator) {
        case 'more':
        case '>':
          result = num1 > num2;
          break;
        case 'moreThanOrEquals':
        case '>=':
          result = num1 >= num2;
          break;
        case 'equals':
        case '==':
        case '===':
          result = num1 === num2;
          break;
        case 'less':
        case '<':
          result = num1 < num2;
          break;
        case 'lessThanOrEquals':
        case '<=':
          result = num1 <= num2;
          break;
        default:
          throw new Error(`Compare function: unsupported operator "${operator}". Supported operators: more, moreThanOrEquals, equals, less, lessThanOrEquals`);
      }

      console.log(`🔍 CompareFunction: ${num1} ${operator} ${num2} = ${result}`);
      
      interpolationContext.local.setVariable('result', result);
      return result;

    } catch (error) {
      console.error('❌ CompareFunction error:', error);
      throw error;
    } finally {
      interpolationContext.local.clearScope();
    }
  }
}
