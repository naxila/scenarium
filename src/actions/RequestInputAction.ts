import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { ActionProcessor } from '../core/ActionProcessor';
import { ActionMappingService } from '../telegram/ActionMappingService';

export class RequestInputAction extends BaseActionProcessor {
  static readonly actionType = 'RequestInput';

  async process(action: any, context: ProcessingContext): Promise<void> {
    const { hint = 'Введите значение:', key, onDone, onCancel, cancelText = 'Отмена', removeHintOnCancel = false, clearInputOnDone = false } = action;

    if (!key || typeof key !== 'string') {
      console.warn('RequestInput: key is required and must be a string');
      return;
    }

    const userId = context.userContext.userId;
    const chatId = context.userContext.data.telegramData?.chatId || userId;

    // Сохраняем состояние ожидания ввода в сессию пользователя
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

      // Добавляем inline кнопку "Отмена", если задан onCancel
      if (onCancel) {
        const mapping = ActionMappingService.getInstance();
        // Помечаем как действие отмены ввода, чтобы обработчик callback мог удалить хинт
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
    }

    this.updateUserActivity(context);
  }
}


