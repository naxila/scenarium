import { FunctionDefinition, ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';
import { FunctionRegistry } from '../registry/FunctionRegistry';
import { ActionProcessor } from './ActionProcessor';

export class FunctionProcessor {
  static async executeUserFunction(
    funcName: string, 
    params: Record<string, any>, 
    context: ProcessingContext,
    existingInterpolationContext?: any
  ): Promise<any> {
    const actionProcessor = context.actionProcessor;
    const scenario = actionProcessor?.getScenario();
    const funcDef = scenario?.functions[funcName];
    
    if (!funcDef) {
      throw new Error(`Function ${funcName} not found`);
    }

    // If function has no params, use empty object
    const paramDefs = funcDef.params || {};
    const resolvedParams = this.resolveParams(paramDefs, params, context, existingInterpolationContext);
    
    // Debug: log context inheritance
    if (existingInterpolationContext) {
      console.log(`🔍 Function ${funcName} inheriting context:`, {
        hasExistingContext: !!existingInterpolationContext,
        localScopes: existingInterpolationContext.local?.getAllScopes(),
        params: resolvedParams
      });
    }
    
    return await this.evaluateResult(funcDef.result, resolvedParams, context, 
      existingInterpolationContext || context.interpolationContext);
  }

  private static resolveParams(
    paramDefs: Record<string, any>,
    providedParams: Record<string, any>,
    context: ProcessingContext,
    interpolationContext?: any
  ): Record<string, any> {
    const resolved: Record<string, any> = {};
    
    // Check that paramDefs is not null/undefined
    if (!paramDefs || typeof paramDefs !== 'object') {
      console.warn('⚠️ paramDefs is null/undefined or not an object:', paramDefs);
      return resolved;
    }
    
    for (const [key, defaultValue] of Object.entries(paramDefs)) {
      let value = providedParams[key] !== undefined ? providedParams[key] : defaultValue;
      
      // Interpolate the value if we have interpolation context
      if (interpolationContext && typeof value === 'string') {
        value = InterpolationSystem.interpolate(value, interpolationContext);
      }
      
      resolved[key] = value;
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
    context: ProcessingContext,
    existingInterpolationContext?: any
  ): Promise<any> {
    // ПРИНЦИП: Единственная ответственность за создание контекста
    // Всегда используем существующий контекст, если он валидный
    let interpolationContext = existingInterpolationContext;
    
    // Валидация контекста
    if (!interpolationContext || !interpolationContext.local || !interpolationContext.data) {
      console.log('🔧 FunctionProcessor: Creating new interpolation context due to invalid existing context');
      interpolationContext = InterpolationContextBuilder.createContext(context, params);
    }
    
    // Убеждаемся, что контекст передается в ProcessingContext для согласованности
    const contextWithInterpolation = {
      ...context,
      interpolationContext
    };
    
    if (typeof result === 'object' && result !== null) {
      if (result.function) {
        const functionName = result.function as string;

        // Выполнение зарегистрированных (встроенных) функций
        if (FunctionRegistry.has(functionName)) {
          const func = FunctionRegistry.get(functionName)!;
          const combinedParams = { ...result, ...params };
          // Интерполируем параметры перед передачей в встроенную функцию
          const interpolatedParams = InterpolationSystem.interpolate(combinedParams, interpolationContext);
          // ПРИНЦИП: Передаем согласованный контекст с валидным interpolationContext
          return await func(interpolatedParams, contextWithInterpolation);
        }

        // Выполнение пользовательских функций, описанных в сценарии
        const actionProcessor = contextWithInterpolation.actionProcessor;
        const scenario = actionProcessor?.getScenario();
        if (scenario?.functions && scenario.functions[functionName]) {
          // Интерполируем параметры перед передачей в функцию
          const interpolatedParams = InterpolationSystem.interpolate(result, interpolationContext);
          return await this.executeUserFunction(functionName, interpolatedParams, contextWithInterpolation, interpolationContext);
        }
      }
      
      const interpolated = InterpolationSystem.interpolate(result, interpolationContext);
      
      if (interpolated.action) {
        const actionProcessor = contextWithInterpolation.actionProcessor;
        if (actionProcessor) {
          await actionProcessor.processActions(interpolated, contextWithInterpolation);
        }
        return interpolated;
      }
      
      return interpolated;
    }
    
    return InterpolationSystem.interpolate(result, interpolationContext);
  }

}