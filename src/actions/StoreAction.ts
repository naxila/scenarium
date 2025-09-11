import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { InterpolationEngine } from '../utils/InterpolationEngine';

export class StoreAction extends BaseActionProcessor {
  static readonly actionType = 'Store';

  async process(action: any, context: ProcessingContext): Promise<void> {
    const fullContext = this.getFullContext(context);
    const key = InterpolationEngine.interpolate(action.key, fullContext);
    let value = InterpolationEngine.interpolate(action.value, fullContext);
    const clearAfterRead = Boolean(action.clearAfterRead);

    if (!key) {
      console.warn('StoreAction: key is required');
      return;
    }

    // Убеждаемся, что value - это строка
    if (typeof value === 'object' && value !== null) {
      value = JSON.stringify(value);
    } else {
      value = String(value || '');
    }

    const storage = context.userContext.data.__storage || {};
    storage[key] = { value, clearAfterRead };
    context.userContext.data.__storage = storage;
    this.updateUserActivity(context);
  }
}


