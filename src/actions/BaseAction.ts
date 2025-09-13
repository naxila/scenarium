import { ProcessingContext, BaseAction } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';
import { FunctionProcessor } from '../core/FunctionProcessor';

export abstract class BaseActionProcessor {
  // Static property to define action type
  static readonly actionType: string;
  
  // Abstract processing method
  abstract process(action: BaseAction, context: ProcessingContext): Promise<void>;
  
  // Common helper methods
  protected updateUserActivity(context: ProcessingContext): void {
    context.userContext.lastActivity = new Date();
  }
  
  /**
   * Create interpolation context for this action
   */
  protected createInterpolationContext(context: ProcessingContext, localScope: Record<string, any> = {}, params: Record<string, any> = {}): any {
    return InterpolationContextBuilder.createContext(context, params, localScope);
  }
  
  /**
   * Interpolate value using new system
   */
  protected interpolate(value: any, interpolationContext: any): any {
    return InterpolationSystem.interpolate(value, interpolationContext);
  }
  
  
  protected async processNestedActions(
    actions: any, 
    context: ProcessingContext
  ): Promise<void> {
    const actionProcessor = context.actionProcessor;
    if (actionProcessor) {
      await actionProcessor.processActions(actions, context);
    }
  }

  /**
   * АРХИТЕКТУРНОЕ УЛУЧШЕНИЕ: Единая точка управления контекстом интерполяции
   * Создает контекст, управляет scope'ами и обеспечивает корректную очистку
   */
  protected async withInterpolationContext<T>(
    context: ProcessingContext,
    localVariables: Record<string, any> = {},
    action: (interpolationContext: any) => Promise<T>
  ): Promise<T> {
    // Use existing interpolation context or create new one
    const interpolationContext = context.interpolationContext || this.createInterpolationContext(context);
    
    // Create local scope for action-specific variables (only if we created new context)
    const isNewContext = !context.interpolationContext;
    if (isNewContext) {
      interpolationContext.local.createScope();
    }
    
    try {
      // Set action-specific local variables
      for (const [key, value] of Object.entries(localVariables)) {
        interpolationContext.local.setVariable(key, value);
      }
      
      // Execute action with interpolation context
      return await action(interpolationContext);
    } finally {
      // Clean up local scope only if we created new context
      if (isNewContext) {
        interpolationContext.local.clearScope();
      }
    }
  }

  /**
   * АРХИТЕКТУРНОЕ УЛУЧШЕНИЕ: Рекурсивная обработка функций в объектах
   * Унифицированный метод для обработки функций в любых параметрах действий
   */
  protected async processFunctionsInObject(
    obj: any, 
    context: ProcessingContext, 
    interpolationContext: any
  ): Promise<any> {
    if (obj && typeof obj === 'object' && obj.function) {
      // This is a function object, evaluate it
      try {
        console.log(`🔍 ${this.constructor.name} DEBUG - Evaluating function:`, obj.function);
        const result = await FunctionProcessor.evaluateResult(obj, {}, context, interpolationContext);
        console.log(`🔍 ${this.constructor.name} DEBUG - Function result:`, result);
        return result;
      } catch (e) {
        console.error(`❌ ${this.constructor.name}: Failed to evaluate function:`, e);
        return obj; // Return original if evaluation fails
      }
    } else if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      // This is a regular object, process its properties
      const processed: any = {};
      for (const [key, value] of Object.entries(obj)) {
        processed[key] = await this.processFunctionsInObject(value, context, interpolationContext);
      }
      return processed;
    } else if (Array.isArray(obj)) {
      // This is an array, process each element
      const processed = [];
      for (const item of obj) {
        processed.push(await this.processFunctionsInObject(item, context, interpolationContext));
      }
      return processed;
    } else {
      // Primitive value, return as is
      return obj;
    }
  }

  /**
   * АРХИТЕКТУРНОЕ УЛУЧШЕНИЕ: Обработка отдельного поля с функциями
   * Проверяет, является ли поле функцией, и выполняет её если нужно
   */
  protected async processFieldWithFunctions(
    field: any,
    fieldName: string,
    context: ProcessingContext,
    interpolationContext: any,
    fallbackValue?: any
  ): Promise<any> {
    if (field && typeof field === 'object' && field.function) {
      try {
        console.log(`🔍 ${this.constructor.name} DEBUG - Evaluating ${fieldName} function:`, field);
        const result = await FunctionProcessor.evaluateResult(field, {}, context, interpolationContext);
        console.log(`🔍 ${this.constructor.name} DEBUG - ${fieldName} function result:`, result);
        return result;
      } catch (e) {
        console.error(`❌ ${this.constructor.name}: Failed to evaluate ${fieldName} function:`, e);
        return fallbackValue !== undefined ? fallbackValue : field;
      }
    } else {
      // Regular interpolation for non-function values
      return this.interpolate(field, interpolationContext);
    }
  }
}