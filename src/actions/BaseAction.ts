import { ProcessingContext, BaseAction } from '../types';
import { InterpolationEngine } from '../utils/InterpolationEngine';

export abstract class BaseActionProcessor {
  // Статическое свойство для определения action type
  static readonly actionType: string;
  
  // Абстрактный метод обработки
  abstract process(action: BaseAction, context: ProcessingContext): Promise<void>;
  
  // Общие вспомогательные методы
  protected updateUserActivity(context: ProcessingContext): void {
    context.userContext.lastActivity = new Date();
  }
  
  protected getFullContext(context: ProcessingContext): Record<string, any> {
    return InterpolationEngine.createContext(context);
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