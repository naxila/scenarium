import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class StoreAction extends BaseActionProcessor {
  static readonly actionType = 'Store';

  async process(action: any, context: ProcessingContext): Promise<void> {
    // АРХИТЕКТУРНОЕ УЛУЧШЕНИЕ: Используем единый метод управления контекстом
    return this.withInterpolationContext(
      context,
      {
        key: action.key,
        value: action.value,
        clearAfterRead: Boolean(action.clearAfterRead)
      },
      async (interpolationContext) => {
        console.log('🔍 Store DEBUG - Before processing:', {
          actionKey: action.key,
          actionValue: action.value,
          keyIsFunction: typeof action.key === 'object' && action.key?.function,
          valueIsFunction: typeof action.value === 'object' && action.value?.function
        });
        
        // АРХИТЕКТУРНОЕ УЛУЧШЕНИЕ: Используем унифицированный метод обработки полей
        const key = await this.processFieldWithFunctions(
          action.key, 
          'key', 
          context, 
          interpolationContext,
          null
        );
        
        const value = await this.processFieldWithFunctions(
          action.value, 
          'value', 
          context, 
          interpolationContext,
          null
        );
        
        const clearAfterRead = Boolean(action.clearAfterRead);

        console.log('🔍 Store DEBUG - After processing:', {
          key: key,
          value: value,
          clearAfterRead: clearAfterRead
        });

        if (!key) {
          console.warn('StoreAction: key is required');
          return;
        }

        // Ensure value is a string
        let processedValue = value;
        if (typeof processedValue === 'object' && processedValue !== null) {
          processedValue = JSON.stringify(processedValue);
        } else {
          processedValue = String(processedValue || '');
        }

        const storage = context.userContext.data.__storage || {};
        storage[key] = { value: processedValue, clearAfterRead };
        context.userContext.data.__storage = storage;
        
        // Update local variables
        interpolationContext.local.setVariable('stored', true);
        interpolationContext.local.setVariable('storedKey', key);
        interpolationContext.local.setVariable('storedValue', processedValue);
        
        this.updateUserActivity(context);
      }
    );
  }
}


