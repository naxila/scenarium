import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { InputManager } from '../core/InputManager';

export class CancelAwaitingInputAction extends BaseActionProcessor {
  static readonly actionType = 'CancelAwaitingInput';

  async process(action: any, context: ProcessingContext): Promise<void> {
    // Получаем BotInstance из контекста
    const actionProcessor = context.actionProcessor;
    const botInstance = actionProcessor?.getBotInstance();
    
    if (botInstance) {
      await InputManager.cancel(botInstance, context.userContext.userId);
    }
  }
}


