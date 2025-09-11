import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';

export class StoreAction extends BaseActionProcessor {
  static readonly actionType = 'Store';

  async process(action: any, context: ProcessingContext): Promise<void> {
    // Create interpolation context for this action
    const interpolationContext = this.createInterpolationContext(context);
    
    // Create local scope for action-specific variables
    interpolationContext.local.createScope();
    
    // Set action-specific variables
    interpolationContext.local.setVariable('key', action.key);
    interpolationContext.local.setVariable('value', action.value);
    interpolationContext.local.setVariable('clearAfterRead', Boolean(action.clearAfterRead));
    
    try {
      // Interpolate key and value using new system
      const key = this.interpolate(action.key, interpolationContext);
      let value = this.interpolate(action.value, interpolationContext);
      const clearAfterRead = Boolean(action.clearAfterRead);

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
      // Clean up local scope when action completes
      interpolationContext.local.clearScope();
    }
  }
}


