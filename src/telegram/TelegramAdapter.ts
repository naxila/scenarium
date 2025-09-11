import TelegramBot from 'node-telegram-bot-api';
import { TelegramService } from './TelegramService';
import { ActionMappingService } from '../telegram/ActionMappingService';
import { InputManager } from '../core/InputManager';
import { TelegramBotConstructor } from '../assembly/TelegramBotConstructor';
import { ActionRegistry } from '../registry/ActionRegistry';

export class TelegramAdapter {
  private bot: TelegramBot;
  private botConstructor: TelegramBotConstructor;
  private botName: string;

  constructor(token: string, botConstructor: TelegramBotConstructor, botName: string = 'default') {
    this.bot = new TelegramBot(token, { polling: true });
    this.botConstructor = botConstructor;
    this.botName = botName;
    
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Обработчик команды /start
    this.bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
      const userId = msg.chat.id.toString();
      const startPayload = match?.[1]; // Параметры после /start

      try {
        await this.handleStartCommand(userId, startPayload, msg);
      } catch (error) {
        console.error('Error handling /start command:', error);
        this.sendSafeMessage(msg.chat.id, '❌ Произошла ошибка при запуске бота');
      }
    });

    // Обработчик команды /menu
    this.bot.onText(/\/menu/, async (msg) => {
      const userId = msg.chat.id.toString();

      try {
        await this.handleMenuCommand(userId, msg);
      } catch (error) {
        console.error('Error handling /menu command:', error);
        this.sendSafeMessage(msg.chat.id, '❌ Произошла ошибка при открытии меню');
      }
    });

    // Обработчик команды /help
    this.bot.onText(/\/help/, async (msg) => {
      const userId = msg.chat.id.toString();

      try {
        await this.handleHelpCommand(userId, msg);
      } catch (error) {
        console.error('Error handling /help command:', error);
        this.sendSafeMessage(msg.chat.id, '❌ Произошла ошибка при открытии помощи');
      }
    });

    // Обработчик текстовых сообщений
    this.bot.on('message', async (msg) => {
      // Пропускаем команды, которые уже обработаны onText
      if (msg.text?.startsWith('/')) {
        return;
      }

      const userId = msg.chat.id.toString();
      const text = msg.text || '';

      try {
        await this.handleUserMessage(userId, text, msg);
      } catch (error) {
        console.error('Error handling message:', error);
        this.sendSafeMessage(msg.chat.id, '❌ Произошла ошибка при обработке сообщения');
      }
    });

    // Обработчик документов (JSON файлы)
    this.bot.on('document', async (msg) => {
      const userId = msg.chat.id.toString();
      
      try {
        await this.handleDocument(userId, msg);
      } catch (error) {
        console.error('Error handling document:', error);
        this.sendSafeMessage(msg.chat.id, '❌ Произошла ошибка при обработке документа');
      }
    });

    // Обработчик callback query (для inline кнопок)
    this.bot.on('callback_query', async (query) => {
      if (!query.message) {
        console.error('Invalid callback query: no message', query);
        return;
      }

      const userId = query.message.chat.id.toString();
      const data = query.data;

      if (userId && data) {
        try {
          await this.handleCallbackQuery(userId, data, query);
        } catch (error) {
          console.error('Error handling callback query:', error);
          this.sendSafeMessage(query.message.chat.id, '❌ Произошла ошибка при обработке действия');
        }
      } else {
        console.error('Invalid callback query:', query);
      }

      // Ответ на callback query
      this.bot.answerCallbackQuery(query.id).catch(console.error);
    });

    // Обработчик ошибок polling
    this.bot.on('polling_error', (error) => {
      console.error('Telegram Polling Error:', error);
    });

    // Обработчик общих ошибок
    this.bot.on('error', (error) => {
      console.error('Telegram Bot Error:', error);
    });

    console.log('✅ Telegram bot handlers configured');
  }

  private async handleStartCommand(userId: string, startPayload: string | undefined, msg: any): Promise<void> {
    console.log(`🚀 User ${userId} started bot`);
    
    const botInstance = this.botConstructor;
    
    // Просто передаем объект с данными - они все пойдут в data
    this.botConstructor.updateUserContext(userId, {
      telegramData: {
        chatId: msg.chat.id,
        firstName: msg.chat.first_name,
        lastName: msg.chat.last_name,
        username: msg.chat.username,
        type: msg.chat.type
      },
      startPayload: startPayload,
      startTime: new Date().toISOString()
    });
  
    // Запускаем onStartActions для пользователя
    await this.botConstructor.startForUser(userId);
  }

  private async handleMenuCommand(userId: string, msg: any): Promise<void> {
    console.log(`📋 User ${userId} requested menu`);
    
    const botInstance = this.botConstructor;
    
    // Просто запускаем start actions вместо проверки меню
    // Это надежнее и проще
    try {
      await this.botConstructor.startForUser(userId);
      console.log(`✅ Restarted from beginning for user ${userId}`);
    } catch (error) {
      console.error('Error restarting from menu command:', error);
      this.sendSafeMessage(msg.chat.id, '❌ Не удалось открыть меню');
    }
  }

  private async handleHelpCommand(userId: string, msg: any): Promise<void> {
    console.log(`❓ User ${userId} requested help`);
    
    const botInstance = this.botConstructor;
    
    await this.botConstructor.processUserAction(userId, {
      action: 'Navigate',
      menuItem: 'Help',
      addToBackStack: true
    });
  }

  private async handleDocument(userId: string, msg: any): Promise<void> {
    // Проверяем, ждет ли какое-то действие ввода
    const handled = await ActionRegistry.processInput(userId, this.botName, {
      type: 'document',
      data: msg
    });
    
    if (handled) {
      return; // Обработано ожидающим действием
    }

    // Обычная обработка документа
    const document = msg.document;
    
    if (!document) {
      this.sendSafeMessage(msg.chat.id, '❌ Документ не найден');
      return;
    }

    // Проверяем, что это JSON файл
    const fileName = document.file_name || '';
    if (!fileName.toLowerCase().endsWith('.json')) {
      this.sendSafeMessage(msg.chat.id, '❌ Пожалуйста, отправьте JSON файл');
      return;
    }

    try {
      // Скачиваем файл
      const fileLink = await this.bot.getFileLink(document.file_id);
      const response = await fetch(fileLink);
      const jsonContent = await response.text();

      // Сохраняем содержимое в контекст пользователя
      this.botConstructor.updateUserContext(userId, {
        lastDocument: jsonContent,
        lastDocumentName: fileName
      });

      // Отправляем сообщение пользователю
      this.sendSafeMessage(msg.chat.id, '❌ Нет обработчика для документов в текущем меню. Используйте кнопки меню для загрузки сценариев.');

    } catch (error) {
      console.error('Error processing document:', error);
      this.sendSafeMessage(msg.chat.id, `❌ Ошибка при обработке файла: ${error}`);
    }
  }

  private async handleUserMessage(userId: string, text: string, msg: any): Promise<void> {
    // Проверяем, ждет ли какое-то действие ввода
    const handled = await ActionRegistry.processInput(userId, this.botName, {
      type: 'message',
      data: msg
    });
    
    if (handled) {
      return; // Обработано ожидающим действием
    }

    const botInstance = this.botConstructor;
    
    // Обновляем время последней активности
    this.botConstructor.updateUserContext(userId, {
      lastActivity: new Date().toISOString(),
      lastMessage: text
    });

    // Проверка: ожидается ли ввод от пользователя
    const userContext = this.botConstructor.getUserContext(userId);
    const awaiting = userContext?.awaitingInput;
    if (awaiting && text.trim()) {
      try {
        const handled = await InputManager.handleUserText(this.botConstructor, userId, text);
        if (handled) return;
      } catch (error) {
        console.error('Error processing awaited input:', error);
      }
    }

    // Обработка специальных текстовых команд
    if (text.toLowerCase() === 'меню') {
      await this.handleMenuCommand(userId, msg);
      return;
    }

    if (text.toLowerCase() === 'помощь' || text.toLowerCase() === 'help') {
      await this.handleHelpCommand(userId, msg);
      return;
    }

    if (text.toLowerCase() === 'назад' || text.toLowerCase() === 'back') {
      await this.botConstructor.processUserAction(userId, {
        action: 'Back'
      });
      return;
    }

    // Для обычных сообщений отправляем подсказку
    if (text.trim()) {
      this.sendSafeMessage(
        msg.chat.id,
        '🤖 Я обрабатываю команды. Используйте:\n' +
        '/start - начать работу\n' +
        '/menu - главное меню\n' +
        '/help - помощь\n\n' +
        'Или используйте кнопки меню для навигации.',
        { reply_to_message_id: msg.message_id }
      );
    }
  }

  private async handleCallbackQuery(userId: string, data: string, query: any): Promise<void> {
    // Проверяем, ждет ли какое-то действие ввода
    const handled = await ActionRegistry.processInput(userId, this.botName, {
      type: 'callback',
      data: query
    });
    
    if (handled) {
      return; // Обработано ожидающим действием
    }

    try {
      console.log('🔍 Callback data received:', data);
      
      const actionMappingService = ActionMappingService.getInstance();
      const action = actionMappingService.getAction(data);
      
      if (!action) {
        throw new Error(`Action not found: ${data}. It may have been already used or expired.`);
      }
      
      console.log('✅ Action executed:', action);
      
      // Единая обработка отмены RequestInput
      if (action._requestInputCancel) {
        const botInstance = (this.botConstructor as any).botInstance;
        await InputManager.cancel(botInstance, userId);
        return;
      }
      
      this.botConstructor.updateUserContext(userId, {
        lastActivity: new Date().toISOString(),
        lastAction: action.action
      });
      
      await this.botConstructor.processUserAction(userId, action);
      
      // Помечаем как выполненное, но не удаляем сразу
      actionMappingService.markActionCompleted(data);
      
    } catch (error) {
      console.error('Error processing callback query:', error);
      
      if (query.message) {
        this.sendSafeMessage(
          query.message.chat.id, 
          '❌ Это действие уже было использовано или устарело.'
        );
      }
    }
  }

  private getActionByHash(hash: string): any {
    // Заготовленные действия для хэшей
    const actionMap: Record<string, any> = {
      'hash:abc123': { 
        action: 'SendMessage', 
        text: 'Специальное действие выполнено! 🎉' 
      },
      'hash:def456': { 
        action: 'SendMessage', 
        text: 'Премиум функция активирована! 💎' 
      }
    };
    
    return actionMap[hash] || { 
      action: 'SendMessage', 
      text: 'Действие выполнено! ✅' 
    };
  }

  private async sendSafeMessage(chatId: number | string, text: string, options?: any): Promise<void> {
    try {
      await this.bot.sendMessage(chatId.toString(), text, options);
    } catch (error) {
      console.error('Failed to send safe message:', error);
      // Если сервис не доступен, логируем
      console.log('📨 Message (fallback):', text);
    }
  }

  // cancelAwaitingInput вынесен в InputManager

  // Публичные методы для управления ботом
  async sendMessage(chatId: string, text: string, options?: any): Promise<any> {
    return await this.bot.sendMessage(chatId, text, options);
  }

  async editMessageText(chatId: string, messageId: number, text: string, options?: any): Promise<void> {
    await this.bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      ...options
    });
  }

  async answerCallbackQuery(queryId: string, options?: any): Promise<void> {
    try {
      await this.bot.answerCallbackQuery(queryId, options);
    } catch (error) {
      console.error('Failed to answer callback query:', error);
    }
  }

  // Удаление сообщения
  async deleteMessage(chatId: string, messageId: number): Promise<void> {
    try {
      await this.bot.deleteMessage(chatId, messageId);
      console.log(`✅ Message ${messageId} deleted in chat ${chatId}`);
    } catch (error) {
      console.error(`Failed to delete message ${messageId} in chat ${chatId}:`, error);
      throw error;
    }
  }

  // Остановка бота
  async stop(): Promise<void> {
    try {
      this.bot.stopPolling();
      console.log('🛑 Telegram bot polling stopped');
    } catch (error) {
      console.error('Error stopping bot polling:', error);
    }
  }

  // Получение информации о боте
  async getMe(): Promise<any> {
    try {
      return await this.bot.getMe();
    } catch (error) {
      console.error('Failed to get bot info:', error);
      return null;
    }
  }

  // Получение экземпляра бота
  getBot(): TelegramBot {
    return this.bot;
  }

  // Установка webhook (если нужно) - исправлено на setWebHook
  async setWebhook(url: string, options?: any): Promise<void> {
    try {
      await this.bot.setWebHook(url, options);
      console.log(`✅ Webhook set to: ${url}`);
    } catch (error) {
      console.error('Failed to set webhook:', error);
      throw error;
    }
  }

  // Удаление webhook - исправлено на deleteWebHook
  async deleteWebhook(): Promise<void> {
    try {
      await this.bot.deleteWebHook();
      console.log('✅ Webhook deleted');
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      throw error;
    }
  }
}