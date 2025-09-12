import { SendMessageAction } from './SendMessageAction';
import { ProcessingContext } from '../types';
import { BaseActionProcessor } from './BaseAction';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class UpdateMessageAction extends BaseActionProcessor {
  static readonly actionType = 'UpdateMessage';

  async process(action: any, context: ProcessingContext): Promise<void> {
    console.log('🔍 UpdateMessage DEBUG - Initial state:', {
      action: action,
      hasInterpolationContext: !!context.interpolationContext,
      localContext: context.localContext,
      userStorage: context.userContext.data.__storage
    });

    // Create interpolation context for this action
    const interpolationContext = this.createInterpolationContext(context);
    
    // Create local scope for action-specific variables
    interpolationContext.local.createScope();
    
    try {
      const chatId = context.userContext.data.telegramData?.chatId || context.userContext.userId;
      
      // Process messageId - can be function or simple value
      let messageId = action.messageId ?? context.userContext.data.lastMessageId;
      
      console.log('🔍 UpdateMessage DEBUG - MessageId resolution:', {
        originalMessageId: action.messageId,
        fallbackUserData: context.userContext.data.lastMessageId,
        resolvedMessageId: messageId
      });
      
      // Set action-specific local variables
      interpolationContext.local.setVariable('chatId', chatId);
      interpolationContext.local.setVariable('messageId', messageId);
      
      if (messageId && typeof messageId === 'object' && messageId.function) {
        // If messageId is a function, evaluate it
        try {
          console.log('🔍 UpdateMessage DEBUG - Evaluating messageId function:', messageId);
          messageId = await FunctionProcessor.evaluateResult(messageId, {}, context, interpolationContext);
          console.log('🔍 UpdateMessage DEBUG - Function result:', messageId);
          interpolationContext.local.setVariable('messageId', messageId);
        } catch (e) {
          console.error('UpdateMessage: failed to evaluate messageId function', e);
          messageId = null;
          interpolationContext.local.setVariable('error', e instanceof Error ? e.message : 'Unknown error');
        }
      }
    
      console.log('🔍 UpdateMessage DEBUG - Final messageId:', {
        messageId: messageId,
        type: typeof messageId,
        isEmpty: !messageId
      });
    
      if (!messageId) {
        console.log('❌ UpdateMessage: No messageId, returning early');
        return;
      }

      // Set update context in local scope
      interpolationContext.local.setVariable('updateMessage', { chatId, messageId });
      
      // Interpolate action using new system
      console.log('🔍 UpdateMessage DEBUG - Before interpolation:', {
        originalText: action.text,
        messageId: messageId,
        localScopes: interpolationContext.local.getAllScopes()
      });
      
      const interpolatedAction = this.interpolate(action, interpolationContext);
      
      console.log('🔍 UpdateMessage DEBUG - After interpolation:', {
        interpolatedAction: interpolatedAction,
        localScopes: interpolationContext.local.getAllScopes()
      });
      
      console.log('🔍 UpdateMessage DEBUG - Delegating to SendMessage:', {
        chatId: chatId,
        messageId: messageId,
        text: interpolatedAction.text,
        updateContext: { chatId, messageId }
      });
      
      console.log('🔍 UpdateMessage DEBUG - Final text analysis:', {
        originalText: action.text,
        interpolatedText: interpolatedAction.text,
        hasMessageIdInOriginal: action.text?.includes('{{messageId}}'),
        hasMessageIdInInterpolated: interpolatedAction.text?.includes('{{messageId}}'),
        messageIdValue: messageId
      });
      
      const nextContext: ProcessingContext = {
        ...context,
        localContext: {
          ...context.localContext,
          messageId: messageId,
          __updateMessage__: { chatId, messageId }
        },
        interpolationContext: interpolationContext // Pass interpolation context
      };

      // Delegate to SendMessageAction
      const delegate = new SendMessageAction();
      await delegate.process({ ...interpolatedAction }, nextContext);
      
      console.log('✅ UpdateMessage DEBUG - SendMessage delegation completed');
      
      interpolationContext.local.setVariable('status', 'completed');
    } finally {
      // Clear local scope when action completes
      interpolationContext.local.clearScope();
    }
  }
}


