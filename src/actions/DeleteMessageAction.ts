import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { ActionProcessor } from '../core/ActionProcessor';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class DeleteMessageAction extends BaseActionProcessor {
  static readonly actionType = 'DeleteMessage';

  async process(action: any, context: ProcessingContext): Promise<void> {
    const chatId = context.userContext.data.telegramData?.chatId || context.userContext.userId;
    
    // Process messageId - can be function or simple value
    let messageId = action.messageId ?? context.localContext.messageId ?? context.userContext.data.lastMessageId;
    
    if (messageId && typeof messageId === 'object' && messageId.function) {
      // If messageId is a function, evaluate it
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
          // Try to delete message
          await adapter.deleteMessage(chatId.toString(), Number(messageId));
        } catch (deleteError: any) {
          // If failed to delete (e.g., message too old), send notification
          if (deleteError.response?.error_code === 400) {
            await adapter.sendMessage(chatId.toString(), '⚠️ Failed to delete message (possibly too old)', {});
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


