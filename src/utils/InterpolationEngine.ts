import { ProcessingContext } from '../types';

/**
 * New interpolation system with unified logic
 */
export class InterpolationEngine {
  /**
   * Creates full context for interpolation
   */
  static createContext(
    baseContext: ProcessingContext, 
    functionParams: Record<string, any> = {}
  ): Record<string, any> {
    return {
      // 1. Function parameters (highest priority)
      ...functionParams,
      
      // 2. Flat structure from base context
      ...baseContext.scenarioContext,
      ...baseContext.userContext.data,
      ...baseContext.localContext,
      
      // 3. Structured aliases
      user: {
        id: baseContext.userContext.userId,
        menu: baseContext.userContext.currentMenu,
        storage: baseContext.userContext.data.__storage || {},
        telegram: baseContext.userContext.data.telegramData || {},
        input: baseContext.userContext.data.input || {},
        backStack: baseContext.userContext.backStack,
        createdAt: baseContext.userContext.createdAt,
        lastActivity: baseContext.userContext.lastActivity
      },
      
      local: {
        messageId: baseContext.localContext.messageId,
        response: baseContext.localContext.response,
        error: baseContext.localContext.error,
        ...baseContext.localContext
      },
      
      scenario: {
        data: baseContext.scenarioContext,
        functions: baseContext.scenario?.functions || {}
      },
      
      system: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }

  /**
   * Интерполирует значение с использованием контекста
   */
  static interpolate(value: any, context: Record<string, any>): any {
    if (typeof value === 'string') {
      return value.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        try {
          const result = this.getValueByPath(context, path.trim());
          return result !== undefined ? String(result) : match;
        } catch (error) {
          console.error(`Interpolation error for path "${path}":`, error);
          return match;
        }
      });
    }
    
    if (Array.isArray(value)) {
      return value.map(item => this.interpolate(item, context));
    }
    
    if (typeof value === 'object' && value !== null) {
      const result: any = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = this.interpolate(val, context);
      }
      return result;
    }
    
    return value;
  }

  /**
   * Получает значение по пути (поддерживает точки и квадратные скобки)
   */
  private static getValueByPath(obj: any, path: string): any {
    if (!path) return undefined;
    
    // Поддержка квадратных скобок: user.storage[key] -> user.storage.key
    const normalizedPath = path.replace(/\[([^\]]+)\]/g, '.$1');
    const parts = normalizedPath.split('.').filter(part => part.length > 0);
    
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }

  /**
   * Интерполирует объект полностью
   */
  static interpolateObject(obj: any, context: Record<string, any>): any {
    return this.interpolate(obj, context);
  }
}
