import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';

export class StoreAction extends BaseActionProcessor {
  static readonly actionType = 'Store';

  async process(action: any, context: ProcessingContext): Promise<void> {
    // Use existing interpolation context or create new one
    const interpolationContext = context.interpolationContext || this.createInterpolationContext(context);
    
    // Create local scope for action-specific variables (only if we created new context)
    const isNewContext = !context.interpolationContext;
    if (isNewContext) {
      interpolationContext.local.createScope();
    }
    
    // Set action-specific variables
    interpolationContext.local.setVariable('key', action.key);
    interpolationContext.local.setVariable('value', action.value);
    interpolationContext.local.setVariable('clearAfterRead', Boolean(action.clearAfterRead));
    
    try {
      console.log('🔍 Store DEBUG - Before interpolation:', {
        actionKey: action.key,
        actionValue: action.value,
        hasExistingContext: !!context.interpolationContext,
        localScopes: interpolationContext.local.getAllScopes()
      });
      
      // Interpolate key and value using new system
      const key = this.interpolate(action.key, interpolationContext);
      let value = this.interpolate(action.value, interpolationContext);
      const clearAfterRead = Boolean(action.clearAfterRead);
      

      console.log('🔍 Store DEBUG - After interpolation:', {
        key: key,
        value: value,
        clearAfterRead: clearAfterRead
      });

      if (!key) {
        console.warn('StoreAction: key is required');
        return;
      }

      // Ensure value is a string
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      } else {
        value = String(value || '');
      }

      const storage = context.userContext.data.__storage || {};
      storage[key] = { value, clearAfterRead };
      context.userContext.data.__storage = storage;
      
      // Update local variables
      interpolationContext.local.setVariable('stored', true);
      interpolationContext.local.setVariable('storedKey', key);
      interpolationContext.local.setVariable('storedValue', value);
      
      this.updateUserActivity(context);
      
    } finally {
      // Clean up local scope only if we created new context
      if (isNewContext) {
        interpolationContext.local.clearScope();
      }
    }
  }
}


