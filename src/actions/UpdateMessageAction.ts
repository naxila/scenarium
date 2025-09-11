import { SendMessageAction } from './SendMessageAction';
import { ProcessingContext } from '../types';
import { BaseActionProcessor } from './BaseAction';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class UpdateMessageAction extends BaseActionProcessor {
  static readonly actionType = 'UpdateMessage';

  async process(action: any, context: ProcessingContext): Promise<void> {
    const chatId = context.userContext.data.telegramData?.chatId || context.userContext.userId;
    
    // Process messageId - can be function or simple value
    let messageId = action.messageId ?? context.localContext.messageId ?? context.userContext.data.lastMessageId;
    
    if (messageId && typeof messageId === 'object' && messageId.function) {
      // If messageId is a function, evaluate it
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

    // Delegate to SendMessageAction
    const delegate = new SendMessageAction();
    await delegate.process({ ...action }, nextContext);
  }
}


