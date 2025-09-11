import { ProcessingContext, BaseAction } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';

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
}