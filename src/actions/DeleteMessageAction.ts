import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { ActionProcessor } from '../core/ActionProcessor';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class DeleteMessageAction extends BaseActionProcessor {
  static readonly actionType = 'DeleteMessage';

  async process(action: any, context: ProcessingContext): Promise<void> {
    // Use withInterpolationContext for consistent context management
    await this.withInterpolationContext(
      context,
      {}, // action-specific local variables will be set below
      async (interpolationContext) => {
        // Interpolate the action with current context
        const interpolatedAction = this.interpolate(action, interpolationContext);
        
        const chatId = context.userContext.data.telegramData?.chatId || context.userContext.userId;
        
        // Process messageId - can be function or simple value
        let messageId = interpolatedAction.messageId ?? context.userContext.data.lastMessageId;
        
        // Set action-specific local variables
        interpolationContext.local.setVariable('chatId', chatId);
        // messageId is dynamic and should not be hardcoded in local context
        
        if (messageId && typeof messageId === 'object' && messageId.function) {
          // If messageId is a function, evaluate it
          try {
            console.log('🔍 DeleteMessage DEBUG - Evaluating messageId function:', messageId);
            messageId = await FunctionProcessor.evaluateResult(messageId, {}, context, interpolationContext);
            console.log('🔍 DeleteMessage DEBUG - Function result:', messageId);
            // messageId is dynamic and should not be hardcoded in local context
          } catch (e) {
            console.error('DeleteMessage: failed to evaluate messageId function', e);
            messageId = null;
            interpolationContext.local.setVariable('error', e instanceof Error ? e.message : 'Unknown error');
          }
        }
        
        console.log('🔍 DeleteMessage DEBUG - Final messageId:', {
          messageId: messageId,
          type: typeof messageId,
          chatId: chatId,
          isEmpty: !messageId
        });
        
        if (!messageId) {
          console.log('❌ DeleteMessage: No messageId, returning early');
          return;
        }
        
        try {
          const actionProcessor = context.actionProcessor;
          const botConstructor = actionProcessor?.getBotConstructor();
          const adapter = botConstructor?.getAdapter();
          
          if (adapter) {
            try {
              console.log('🔍 DeleteMessage DEBUG - Attempting to delete:', {
                chatId: chatId.toString(),
                messageId: Number(messageId),
                messageIdType: typeof messageId
              });
              
              // Try to delete message
              const result = await adapter.deleteMessage(chatId.toString(), Number(messageId));
              console.log('✅ DeleteMessage DEBUG - Delete successful:', result);
              interpolationContext.local.setVariable('deleted', true);
            } catch (deleteError: any) {
              console.log('❌ DeleteMessage DEBUG - Delete failed:', deleteError);
              
              // If failed to delete (e.g., message too old), send notification
              if (deleteError.response?.error_code === 400) {
                console.log('⚠️ DeleteMessage DEBUG - Message too old, sending notification');
                await adapter.sendMessage(chatId.toString(), '⚠️ Failed to delete message (possibly too old)', {});
              } else {
                throw deleteError;
              }
            }
          } else {
            console.log('❌ DeleteMessage DEBUG - No adapter available');
          }
        } catch (e) {
          console.error('DeleteMessage failed', e);
          interpolationContext.local.setVariable('error', e instanceof Error ? e.message : 'Unknown error');
        }
        
        this.updateUserActivity(context);
      }
    );
  }
}


