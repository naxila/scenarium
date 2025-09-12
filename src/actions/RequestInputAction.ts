import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { ActionProcessor } from '../core/ActionProcessor';
import { ActionMappingService } from '../telegram/ActionMappingService';

export class RequestInputAction extends BaseActionProcessor {
  static readonly actionType = 'RequestInput';

  async process(action: any, context: ProcessingContext): Promise<void> {
    // Create interpolation context for this action
    const interpolationContext = this.createInterpolationContext(context);
    
    // Create local scope for action-specific variables
    interpolationContext.local.createScope();
    
    try {
      // Interpolate the action with current context
      const interpolatedAction = this.interpolate(action, interpolationContext);
      const { hint = 'Enter value:', key, onDone, onCancel, cancelText = 'Cancel', removeHintOnCancel = false, clearInputOnDone = false } = interpolatedAction;

      if (!key || typeof key !== 'string') {
        console.warn('RequestInput: key is required and must be a string');
        return;
      }

      // Set action-specific local variables
      interpolationContext.local.setVariable('key', key);
      interpolationContext.local.setVariable('hint', hint);
      interpolationContext.local.setVariable('status', 'waiting');

      const userId = context.userContext.userId;
      const chatId = context.userContext.data.telegramData?.chatId || userId;

    // Save input waiting state to user session
    context.userContext.data.awaitingInput = {
      key,
      onDone,
      onCancel,
      removeHintOnCancel,
      clearInputOnDone
    };

    try {
      const actionProcessor = context.actionProcessor;
      const botConstructor = actionProcessor?.getBotConstructor();
      const adapter = botConstructor?.getAdapter();
      
      if (!adapter) {
        console.warn('Telegram adapter not available, cannot send hint');
        return;
      }
      
      const options: any = { parse_mode: 'Markdown' };

      // Add inline "Cancel" button if onCancel is specified
      if (onCancel) {
        const mapping = ActionMappingService.getInstance();
        // Mark as input cancellation action so callback handler can remove hint
        const cancelAction = { ...onCancel, _requestInputCancel: true };
        const actionId = mapping.registerAction(cancelAction);
        options.reply_markup = {
          inline_keyboard: [[
            { text: String(cancelText), callback_data: actionId }
          ]]
        };
      }

      const message = await adapter.sendMessage(chatId, hint, options);
      if (message && message.message_id) {
        context.userContext.data.awaitingInput = {
          ...context.userContext.data.awaitingInput,
          hintMessageId: message.message_id
        };
      }
    } catch (error) {
      console.error('RequestInput: failed to send hint', error);
      interpolationContext.local.setVariable('error', error instanceof Error ? error.message : 'Unknown error');
    }

    this.updateUserActivity(context);
    } finally {
      // Clear local scope when action completes
      interpolationContext.local.clearScope();
    }
  }
}


