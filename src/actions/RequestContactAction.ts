import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';

export class RequestContactAction extends BaseActionProcessor {
  static readonly actionType = 'RequestContact';

  async process(action: any, context: ProcessingContext): Promise<void> {
    return this.withInterpolationContext(
      context,
      {
        message: action.message,
        status: 'waiting'
      },
      async (interpolationContext) => {
        // Обрабатываем поле message с функциями
        const processedMessage = await this.processFieldWithFunctions(
          action.message,
          'message',
          context,
          interpolationContext,
          'Пожалуйста, поделитесь своим контактом:'
        );

        // Создаем обработанное действие для интерполяции
        const processedAction = { ...action, message: processedMessage };
        
        // Интерполируем обработанное действие с текущим контекстом
        const interpolatedAction = this.interpolate(processedAction, interpolationContext);
        const { message = 'Пожалуйста, поделитесь своим контактом:', onSuccess, onFailure } = interpolatedAction;

        // Устанавливаем локальные переменные действия
        interpolationContext.local.setVariable('message', message);
        interpolationContext.local.setVariable('status', 'waiting');

        const userId = context.userContext.userId;
        const chatId = context.userContext.data.telegramData?.chatId || userId;

        // Сохраняем состояние ожидания контакта в сессии пользователя
        context.userContext.data.awaitingContact = {
          message: message,
          onSuccess: onSuccess,
          onFailure: onFailure,
          timestamp: Date.now()
        };

        // Отправляем сообщение с кнопкой запроса контакта
        if (context.bot && context.bot.api) {
          await context.bot.api.sendMessage(chatId, message, {
            reply_markup: {
              keyboard: [
                [{
                  text: '📱 Поделиться контактом',
                  request_contact: true
                }]
              ],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          });
        }

        // Состояние ожидания контакта установлено

        // Contact request sent successfully
      }
    );
  }
}