import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { ActionProcessor } from '../core/ActionProcessor';
import { ActionMappingService } from '../telegram/ActionMappingService';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class RequestInputAction extends BaseActionProcessor {
  static readonly actionType = 'RequestInput';

  async process(action: any, context: ProcessingContext): Promise<void> {
    // АРХИТЕКТУРНОЕ УЛУЧШЕНИЕ: Используем единый метод управления контекстом
    return this.withInterpolationContext(
      context,
      {
        key: action.key,
        hint: action.hint,
        status: 'waiting'
      },
      async (interpolationContext) => {
        // АРХИТЕКТУРНОЕ УЛУЧШЕНИЕ: Используем унифицированный метод обработки поля hint
        const processedHint = await this.processFieldWithFunctions(
          action.hint,
          'hint', 
          context, 
          interpolationContext,
          'Enter value:'
        );
        
        // Create processed action for interpolation
        const processedAction = { ...action, hint: processedHint };
        
        // Interpolate the processed action with current context
        const interpolatedAction = this.interpolate(processedAction, interpolationContext);
        const { 
          hint = 'Enter value:', 
          key, 
          onDone, 
          onCancel, 
          cancelText = 'Cancel', 
          removeHintOnCancel = false, 
          clearInputOnDone = false,
          allowAttachments = false  // Новый параметр для разрешения вложений
        } = interpolatedAction;

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
          clearInputOnDone,
          allowAttachments  // Сохраняем флаг для обработки вложений
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
            // Примечание: reply_keyboard не очищается при наличии inline_keyboard
            // из-за ограничения Telegram API (reply_markup может быть только одного типа)
          } else {
            // Нет inline кнопки - очищаем reply keyboard
            options.reply_markup = { remove_keyboard: true };
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
      }
    );
  }
}


