import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';

export class CustomAction extends BaseActionProcessor {
  static readonly actionType = '*';
  
  async process(action: any, context: ProcessingContext): Promise<void> {
    const interpolationContext = this.createInterpolationContext(context);
    interpolationContext.local.createScope();
    
    try {
      const interpolatedAction = this.interpolate(action, interpolationContext);
      console.log(`[User ${context.userContext.userId}] Custom action:`, interpolatedAction);
      this.updateUserActivity(context);
    } finally {
      interpolationContext.local.clearScope();
    }
  }
}