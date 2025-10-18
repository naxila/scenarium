import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class CustomAction extends BaseActionProcessor {
  static readonly actionType = '*';
  
  async process(action: any, context: ProcessingContext): Promise<void> {
    const interpolationContext = this.createInterpolationContext(context);
    interpolationContext.local.createScope();
    
    try {
      const interpolatedAction = this.interpolate(action, interpolationContext);
      console.log(`[User ${context.userContext.userId}] Custom action:`, interpolatedAction);
      
      // Выполняем функцию если это функция
      if (interpolatedAction && typeof interpolatedAction === 'object' && interpolatedAction.function) {
        console.log(`🔍 CustomAction: Executing function ${interpolatedAction.function}`);
        const result = await FunctionProcessor.evaluateResult(interpolatedAction, {}, context, interpolationContext);
        console.log(`🔍 CustomAction: Function result:`, result);
      }
      
      this.updateUserActivity(context);
    } finally {
      interpolationContext.local.clearScope();
    }
  }
}