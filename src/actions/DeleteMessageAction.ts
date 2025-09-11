import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { ActionProcessor } from '../core/ActionProcessor';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class DeleteMessageAction extends BaseActionProcessor {
  static readonly actionType = 'DeleteMessage';

  async process(action: any, context: ProcessingContext): Promise<void> {
    const chatId = context.userContext.data.telegramData?.chatId || context.userContext.userId;
    
    // Обрабатываем messageId - может быть функцией или простым значением
    let messageId = action.messageId ?? context.localContext.messageId ?? context.userContext.data.lastMessageId;
    
    if (messageId && typeof messageId === 'object' && messageId.function) {
      // Если messageId - это функция, вычисляем её
      try {
        messageId = await FunctionProcessor.evaluateResult(messageId, {}, context);
      } catch (e) {
        console.error('DeleteMessage: failed to evaluate messageId function', e);
        messageId = null;
      }
    }
    
    if (!messageId) {
      return;
    }
    try {
      const actionProcessor = context.actionProcessor;
      const botConstructor = actionProcessor?.getBotConstructor();
      const adapter = botConstructor?.getAdapter();
      
      if (adapter) {
        try {
          // Пытаемся удалить сообщение
          await adapter.deleteMessage(chatId.toString(), Number(messageId));
        } catch (deleteError: any) {
          // Если не удалось удалить (например, сообщение слишком старое), отправляем уведомление
          if (deleteError.response?.error_code === 400) {
            await adapter.sendMessage(chatId.toString(), '⚠️ Не удалось удалить сообщение (возможно, оно слишком старое)', {});
          } else {
            throw deleteError;
          }
        }
      } else {
      }
    } catch (e) {
      console.error('DeleteMessage failed', e);
    }
    this.updateUserActivity(context);
  }
}


