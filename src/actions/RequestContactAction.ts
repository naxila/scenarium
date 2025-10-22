import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { ActionRegistry } from '../registry/ActionRegistry';

export class RequestContactAction extends BaseActionProcessor {
  static readonly actionType = 'RequestContact';

  async process(action: any, context: ProcessingContext): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('RequestContact: Starting process for action:', action);
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
        const { message = 'Пожалуйста, поделитесь своим контактом:', onSuccess, onFailure, successMessage = '✅' } = interpolatedAction;

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
          successMessage: successMessage,
          timestamp: Date.now()
        };

      // Отправляем сообщение с кнопкой запроса контакта
      try {
        const actionProcessor = context.actionProcessor;
        const botConstructor = actionProcessor?.getBotConstructor();
        const adapter = botConstructor?.getAdapter();
        
        if (!adapter) {
          return;
        }
        
        await adapter.sendMessage(chatId, message, {
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
      } catch (error) {
        console.error('RequestContact: Failed to send message:', error);
      }

      // Устанавливаем состояние ожидания через ActionRegistry (использует статический ActionStateManager)
      const botName = context.actionProcessor?.getBotConstructor()?.getAdapter()?.botName || 'default';
      
      ActionRegistry.setActionWaiting(
        'RequestContact',
        userId,
        botName,
        'contact',
        this.handleContactInput.bind(this, context),
        this.handleContactComplete.bind(this, context),
        { onSuccess, onFailure }
      );

        // Contact request sent successfully
      }
    );
  }

  private async handleContactInput(context: ProcessingContext, input: any, state: any): Promise<boolean> {
    const contact = input.contact;
    if (!contact) {
      // Если контакт не получен, вызываем onFailure
      const awaitingContact = context.userContext.data.awaitingContact;
      if (awaitingContact && awaitingContact.onFailure) {
        const onFailureActions = Array.isArray(awaitingContact.onFailure) 
          ? awaitingContact.onFailure 
          : [awaitingContact.onFailure];
        
        for (const actionData of onFailureActions) {
          await context.actionProcessor.processActions(actionData, context);
        }
      }
      return false; // Завершаем ожидание
    }

    // Сохраняем номер телефона в контексте пользователя
    context.userContext.data.phone_number = contact.phone_number;

    // Отправляем сообщение об успехе до выполнения onSuccess
    const awaitingContact = context.userContext.data.awaitingContact;
    const successMessage = awaitingContact?.successMessage || '✅';
    
    const chatId = context.userContext.data.telegramData?.chatId || context.userContext.userId;
    try {
      const actionProcessor = context.actionProcessor;
      const botConstructor = actionProcessor?.getBotConstructor();
      const adapter = botConstructor?.getAdapter();
      
      if (adapter) {
        await adapter.sendMessage(chatId, successMessage, {
          reply_markup: {
            remove_keyboard: true
          }
        });
      }
    } catch (error) {
      console.error('RequestContact: Failed to send success message:', error);
    }

    // Выполняем коллбек onSuccess
    if (awaitingContact && awaitingContact.onSuccess) {
      const onSuccessActions = Array.isArray(awaitingContact.onSuccess) 
        ? awaitingContact.onSuccess 
        : [awaitingContact.onSuccess];
      
      for (const actionData of onSuccessActions) {
        await context.actionProcessor.processActions(actionData, context);
      }
    }

    // Очищаем состояние ожидания
    delete context.userContext.data.awaitingContact;
    return false; // Завершаем ожидание
  }

  private async handleContactComplete(context: ProcessingContext, input: any, state: any): Promise<void> {
    // Очищаем состояние ожидания контакта
    delete context.userContext.data.awaitingContact;
  }
}