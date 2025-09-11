import { FunctionDefinition, ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';
import { FunctionRegistry } from '../registry/FunctionRegistry';
import { ActionProcessor } from './ActionProcessor';

export class FunctionProcessor {
  static async executeUserFunction(
    funcName: string, 
    params: Record<string, any>, 
    context: ProcessingContext
  ): Promise<any> {
    const actionProcessor = context.actionProcessor;
    const scenario = actionProcessor?.getScenario();
    const funcDef = scenario?.functions[funcName];
    
    if (!funcDef) {
      throw new Error(`Function ${funcName} not found`);
    }

    // If function has no params, use empty object
    const paramDefs = funcDef.params || {};
    const resolvedParams = this.resolveParams(paramDefs, params, context);
    
    
    return await this.evaluateResult(funcDef.result, resolvedParams, context);
  }

  private static resolveParams(
    paramDefs: Record<string, any>,
    providedParams: Record<string, any>,
    context: ProcessingContext
  ): Record<string, any> {
    const resolved: Record<string, any> = {};
    
    // Check that paramDefs is not null/undefined
    if (!paramDefs || typeof paramDefs !== 'object') {
      console.warn('⚠️ paramDefs is null/undefined or not an object:', paramDefs);
      return resolved;
    }
    
    for (const [key, defaultValue] of Object.entries(paramDefs)) {
      if (providedParams[key] !== undefined) {
        resolved[key] = providedParams[key];
      } else {
        resolved[key] = defaultValue;
      }
    }
    
    return resolved;
  }

  private static getValueByPath(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }

  static async evaluateResult(
    result: any, 
    params: Record<string, any>, 
    context: ProcessingContext
  ): Promise<any> {
    // Создаем контекст с параметрами функции
    const interpolationContext = InterpolationContextBuilder.createContext(context, params);
    
    if (typeof result === 'object' && result !== null) {
      if (result.function) {
        const functionName = result.function as string;

        // Выполнение зарегистрированных (встроенных) функций
        if (FunctionRegistry.has(functionName)) {
          const func = FunctionRegistry.get(functionName)!;
          const combinedParams = { ...result, ...params };
          // Интерполируем параметры перед передачей в встроенную функцию
          const interpolatedParams = InterpolationSystem.interpolate(combinedParams, interpolationContext);
          return await func(interpolatedParams, context);
        }

        // Выполнение пользовательских функций, описанных в сценарии
        const actionProcessor = context.actionProcessor;
        const scenario = actionProcessor?.getScenario();
        if (scenario?.functions && scenario.functions[functionName]) {
          // Интерполируем параметры перед передачей в функцию
          const interpolatedParams = InterpolationSystem.interpolate(result, interpolationContext);
          return await this.executeUserFunction(functionName, interpolatedParams, context);
        }
      }
      
      const interpolated = InterpolationSystem.interpolate(result, interpolationContext);
      
      if (interpolated.action) {
        const actionProcessor = context.actionProcessor;
        if (actionProcessor) {
          await actionProcessor.processActions(interpolated, context);
        }
        return interpolated;
      }
      
      return interpolated;
    }
    
    return InterpolationSystem.interpolate(result, interpolationContext);
  }

}