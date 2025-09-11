import { SendMessageAction } from './SendMessageAction';
import { ProcessingContext } from '../types';
import { BaseActionProcessor } from './BaseAction';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class UpdateMessageAction extends BaseActionProcessor {
  static readonly actionType = 'UpdateMessage';

  async process(action: any, context: ProcessingContext): Promise<void> {
    const chatId = context.userContext.data.telegramData?.chatId || context.userContext.userId;
    
    // Обрабатываем messageId - может быть функцией или простым значением
    let messageId = action.messageId ?? context.localContext.messageId ?? context.userContext.data.lastMessageId;
    
    if (messageId && typeof messageId === 'object' && messageId.function) {
      // Если messageId - это функция, вычисляем её
      try {
        messageId = await FunctionProcessor.evaluateResult(messageId, {}, context);
      } catch (e) {
        console.error('UpdateMessage: failed to evaluate messageId function', e);
        messageId = null;
      }
    }
    
    if (!messageId) {
      return;
    }

    const nextContext: ProcessingContext = {
      ...context,
      localContext: {
        ...context.localContext,
        messageId: messageId,
        __updateMessage__: { chatId, messageId }
      }
    };

    // Делегируем в SendMessageAction
    const delegate = new SendMessageAction();
    await delegate.process({ ...action }, nextContext);
  }
}


