import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { InterpolationEngine } from '../utils/InterpolationEngine';

export class CustomAction extends BaseActionProcessor {
  static readonly actionType = '*';
  
  async process(action: any, context: ProcessingContext): Promise<void> {
    const fullContext = this.getFullContext(context);
    const interpolatedAction = InterpolationEngine.interpolateObject(action, fullContext);
    
    console.log(`[User ${context.userContext.userId}] Custom action:`, interpolatedAction);
    this.updateUserActivity(context);
  }
}