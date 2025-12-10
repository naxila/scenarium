import TelegramBot from 'node-telegram-bot-api';
import { TelegramService } from './TelegramService';
import { ActionMappingService } from '../telegram/ActionMappingService';
import { InputManager } from '../core/InputManager';
import { TelegramBotConstructor } from '../assembly/TelegramBotConstructor';
import { ActionRegistry } from '../registry/ActionRegistry';
import { parseStartParams } from '../utils/startParamsParser';

// Интерфейс для callback'ов аналитики
export interface AnalyticsCallbacks {
  onMessageReceived?: (userId: string, message: string, messageData: any) => void;
  onMessageSent?: (userId: string, message: string, messageData: any) => void;
  onUserStarted?: (userId: string, userData: any) => void;
  onUserAction?: (userId: string, action: string, actionData: any) => void;
  onError?: (error: Error, context: any) => void;
}

export class TelegramAdapter {
  private bot: TelegramBot;
  private botConstructor: TelegramBotConstructor;
  private botName: string;
  private analyticsCallbacks?: AnalyticsCallbacks;
  private mediaGroupBuffer: Map<string, { messages: any[], timeout: NodeJS.Timeout }> = new Map();

  constructor(token: string, botConstructor: TelegramBotConstructor, botName: string = 'default', analyticsCallbacks?: AnalyticsCallbacks) {
    this.bot = new TelegramBot(token, { polling: true });
    this.botConstructor = botConstructor;
    this.botName = botName;
    this.analyticsCallbacks = analyticsCallbacks;
    
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // /start command handler
    this.bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
      const userId = msg.chat.id.toString();
      const startPayload = match?.[1]; // Parameters after /start

      // Вызываем callback аналитики для начала работы пользователя
      if (this.analyticsCallbacks?.onUserStarted) {
        this.analyticsCallbacks.onUserStarted(userId, { startPayload, message: msg });
      }

      try {
        await this.handleStartCommand(userId, startPayload, msg);
      } catch (error) {
        console.error('Error handling /start command:', error);
        this.sendSafeMessage(msg.chat.id, '❌ Error occurred while starting bot');
      }
    });

    // /menu command handler
    this.bot.onText(/\/menu/, async (msg) => {
      const userId = msg.chat.id.toString();

      try {
        await this.handleMenuCommand(userId, msg);
      } catch (error) {
        console.error('Error handling /menu command:', error);
        this.sendSafeMessage(msg.chat.id, '❌ Error occurred while opening menu');
      }
    });

    // /help command handler
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

      // Вызываем callback аналитики для входящего сообщения
      if (this.analyticsCallbacks?.onMessageReceived) {
        this.analyticsCallbacks.onMessageReceived(userId, text, msg);
      }

      try {
        // Проверяем, является ли сообщение частью media group
        if (msg.media_group_id) {
          await this.handleMediaGroupMessage(userId, text, msg);
        } else {
          await this.handleUserMessage(userId, text, msg);
        }
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

    // Обработчик контактов
    this.bot.on('contact', async (msg) => {
      const userId = msg.chat.id.toString();
      
      try {
        await this.handleContact(userId, msg);
      } catch (error) {
        console.error('Error handling contact:', error);
        this.sendSafeMessage(msg.chat.id, '❌ Произошла ошибка при обработке контакта');
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

  /**
   * Обновляет telegram контекст в userContext.data
   */
  private updateTelegramContext(userId: string, msg: any): void {
    this.botConstructor.updateUserContext(userId, {
      telegram: {
        chatId: msg.chat.id,
        userId: msg.from?.id,
        firstName: msg.from?.first_name || msg.chat.first_name,
        lastName: msg.from?.last_name || msg.chat.last_name,
        username: msg.from?.username || msg.chat.username,
        chatType: msg.chat.type,
        isBot: msg.from?.is_bot || false,
        languageCode: msg.from?.language_code,
        messageId: msg.message_id,
        date: msg.date
      },
      lastActivity: new Date().toISOString(),
      lastMessage: msg.text || ''
    });
  }

  private async handleStartCommand(userId: string, startPayload: string | undefined, msg: any): Promise<void> {
    console.log(`🚀 User ${userId} started bot`);
    
    const botInstance = this.botConstructor;
    
    // Парсим start параметры
    const startParams = parseStartParams(startPayload);
    console.log(`📋 Parsed start params for user ${userId}:`, startParams);
    
    // Просто передаем объект с данными - они все пойдут в data
    this.botConstructor.updateUserContext(userId, {
      telegramData: {
        chatId: msg.chat.id,
        firstName: msg.chat.first_name,
        lastName: msg.chat.last_name,
        username: msg.chat.username,
        type: msg.chat.type
      },
      telegram: {
        chatId: msg.chat.id,
        userId: msg.from?.id,
        firstName: msg.from?.first_name || msg.chat.first_name,
        lastName: msg.from?.last_name || msg.chat.last_name,
        username: msg.from?.username || msg.chat.username,
        chatType: msg.chat.type,
        isBot: msg.from?.is_bot || false,
        languageCode: msg.from?.language_code,
        messageId: msg.message_id,
        date: msg.date
      },
      startPayload: startPayload,
      startParams: startParams,
      startTime: new Date().toISOString()
    });
  
    // Запускаем onStartActions для пользователя с startParams в локальном контексте
    await this.botConstructor.startForUser(userId, { startParams });
  }

  private async handleMenuCommand(userId: string, msg: any): Promise<void> {
    console.log(`📋 User ${userId} requested menu`);
    
    // Обновляем telegram контекст
    this.updateTelegramContext(userId, msg);
    
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
    
    // Обновляем telegram контекст
    this.updateTelegramContext(userId, msg);
    
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

  private async handleContact(userId: string, msg: any): Promise<void> {
    const contact = msg.contact;
    if (!contact) {
      return;
    }

    // Обновляем telegram контекст
    this.updateTelegramContext(userId, msg);

    // Проверяем, ждет ли какое-то действие ввода контакта
    const inputData = {
      type: 'contact',
      contact: contact,
      data: msg
    };
    
    const handled = await ActionRegistry.processInput(userId, this.botName, inputData);
    
    if (handled) {
      return; // Обработано ожидающим действием
    }

    // Если никто не ждет контакт, отправляем сообщение
    this.sendSafeMessage(msg.chat.id, '❌ Нет обработчика для контактов в текущем меню.');
  }

  /**
   * Обработка сообщения из media group
   * Буферизирует сообщения и обрабатывает их все вместе после паузы
   */
  private async handleMediaGroupMessage(userId: string, text: string, msg: any): Promise<void> {
    const mediaGroupId = msg.media_group_id;
    
    console.log(`📎 Received media group message: ${mediaGroupId}, total buffered groups: ${this.mediaGroupBuffer.size}`);
    
    // Получаем или создаем буфер для этой группы
    let groupData = this.mediaGroupBuffer.get(mediaGroupId);
    
    if (!groupData) {
      groupData = {
        messages: [],
        timeout: setTimeout(() => {
          this.processMediaGroup(userId, mediaGroupId);
        }, 1000) // Ждем 1 секунду после последнего сообщения
      };
      this.mediaGroupBuffer.set(mediaGroupId, groupData);
    } else {
      // Сбрасываем таймер, так как пришло новое сообщение из группы
      clearTimeout(groupData.timeout);
      groupData.timeout = setTimeout(() => {
        this.processMediaGroup(userId, mediaGroupId);
      }, 1000);
    }
    
    // Добавляем сообщение в буфер
    groupData.messages.push(msg);
    console.log(`📎 Added message to media group ${mediaGroupId}, total messages: ${groupData.messages.length}`);
  }

  /**
   * Обработка собранной media group
   */
  private async processMediaGroup(userId: string, mediaGroupId: string): Promise<void> {
    const groupData = this.mediaGroupBuffer.get(mediaGroupId);
    
    if (!groupData || groupData.messages.length === 0) {
      console.warn(`⚠️ No messages found for media group ${mediaGroupId}`);
      return;
    }
    
    console.log(`📎 Processing media group ${mediaGroupId} with ${groupData.messages.length} messages`);
    
    // Удаляем из буфера
    this.mediaGroupBuffer.delete(mediaGroupId);
    
    // НЕ сортируем - используем порядок прихода в буфер
    // Это наиболее близко к реальному порядку отправки от пользователя
    // message_id ненадежен, т.к. отражает порядок прихода на сервер, а не выбора
    const messages = groupData.messages;
    
    // Берем caption из первого сообщения (если есть)
    const firstMessage = messages[0];
    const text = firstMessage.caption || firstMessage.text || '';
    
    // Создаем объединенное сообщение со всеми вложениями
    const combinedMessage = { ...firstMessage };
    
    // Собираем все вложения в порядке прихода сообщений
    const allPhotos: any[] = [];
    const allVideos: any[] = [];
    const allDocuments: any[] = [];
    
    for (const msg of messages) {
      // msg.photo - это массив размеров одного фото, берем только самый большой (последний)
      if (msg.photo && Array.isArray(msg.photo) && msg.photo.length > 0) {
        const largestPhoto = msg.photo[msg.photo.length - 1];
        allPhotos.push(largestPhoto);
      }
      if (msg.video) {
        allVideos.push(msg.video);
      }
      if (msg.document) {
        allDocuments.push(msg.document);
      }
    }
    
    console.log(`📎 Media group composition (order of arrival): ${allPhotos.length} photos, ${allVideos.length} videos, ${allDocuments.length} documents`);
    
    // Добавляем собранные вложения в combinedMessage
    if (allPhotos.length > 0) combinedMessage.photo_group = allPhotos;
    if (allVideos.length > 0) combinedMessage.video_group = allVideos;
    if (allDocuments.length > 0) combinedMessage.document_group = allDocuments;
    
    // Устанавливаем флаг media group
    combinedMessage.is_media_group = true;
    combinedMessage.media_group_count = groupData.messages.length;
    
    // Обрабатываем как обычное сообщение
    await this.handleUserMessage(userId, text, combinedMessage);
  }

  private async handleUserMessage(userId: string, text: string, msg: any): Promise<void> {
    // Вызываем callback аналитики для входящего сообщения
    if (this.analyticsCallbacks?.onMessageReceived) {
      console.log('🔍 TelegramAdapter - вызываем onMessageReceived callback');
      this.analyticsCallbacks.onMessageReceived(userId, text, msg);
    }

    // Проверяем, ждет ли какое-то действие ввода
    const handled = await ActionRegistry.processInput(userId, this.botName, {
      type: 'message',
      data: msg
    });
    
    if (handled) {
      return; // Обработано ожидающим действием
    }

    const botInstance = this.botConstructor;
    
    // Обновляем telegram контекст при каждом сообщении
    this.updateTelegramContext(userId, msg);

    // Проверка: ожидается ли ввод от пользователя
    const userContext = this.botConstructor.getUserContext(userId);
    const awaiting = userContext?.awaitingInput;
    
    // Проверяем есть ли вложения в сообщении
    const hasAttachments = msg.photo || msg.document || msg.video || msg.audio || 
                          msg.voice || msg.video_note || msg.sticker || msg.animation;
    
    if (awaiting && (text.trim() || (awaiting.allowAttachments && hasAttachments))) {
      try {
        // Передаем msg для извлечения вложений
        const handled = await InputManager.handleUserText(this.botConstructor, userId, text, msg);
        if (handled) return;
      } catch (error) {
        console.error('Error processing awaited input:', error);
      }
    }

    // Проверка: ожидается ли ответ от Reply Keyboard
    const awaitingReplyKb = userContext?.awaitingReplyKeyboard;
    console.log('🔍 DEBUG handleUserMessage - checking awaitingReplyKeyboard:', {
      userId,
      text,
      hasAwaitingReplyKb: !!awaitingReplyKb,
      awaitingReplyKb: awaitingReplyKb ? JSON.stringify(awaitingReplyKb).substring(0, 200) : null,
      userContextKeys: userContext ? Object.keys(userContext) : []
    });
    
    if (awaitingReplyKb && text.trim()) {
      try {
        console.log('🔍 DEBUG - Processing reply keyboard response for text:', text);
        const handled = await this.handleReplyKeyboardResponse(userId, text, awaitingReplyKb);
        console.log('🔍 DEBUG - Reply keyboard handled:', handled);
        if (handled) return;
      } catch (error) {
        console.error('Error processing reply keyboard response:', error);
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
    // Обновляем telegram контекст
    if (query.message) {
      this.updateTelegramContext(userId, query.message);
    }
    
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

  /**
   * Handle response from Reply Keyboard
   */
  private async handleReplyKeyboardResponse(userId: string, text: string, awaitingReplyKb: any): Promise<boolean> {
    console.log('🔍 DEBUG handleReplyKeyboardResponse - START:', {
      userId,
      text,
      awaitingReplyKb: JSON.stringify(awaitingReplyKb).substring(0, 300)
    });
    
    const { buttons, onSent } = awaitingReplyKb;
    
    // Ищем кнопку по тексту
    let matchedButton: any = null;
    let matchedValue: string | null = null;
    
    for (const row of buttons) {
      const rowButtons = Array.isArray(row) ? row : [row];
      for (const btn of rowButtons) {
        const btnText = typeof btn === 'string' ? btn : btn.text;
        if (btnText === text) {
          matchedButton = btn;
          // Если у кнопки есть value - используем его, иначе текст кнопки
          matchedValue = (typeof btn === 'object' && btn.value) ? btn.value : text;
          break;
        }
      }
      if (matchedButton) break;
    }
    
    console.log('🔍 DEBUG handleReplyKeyboardResponse - Button search result:', {
      matchedButton: matchedButton ? JSON.stringify(matchedButton) : null,
      matchedValue
    });
    
    // Если кнопка найдена
    if (matchedButton) {
      console.log(`🔘 Reply keyboard button pressed: "${text}", value: "${matchedValue}"`);
      
      // Очищаем состояние ожидания ПЕРЕД выполнением действия
      console.log('🔍 DEBUG - Clearing awaitingReplyKeyboard BEFORE action');
      this.botConstructor.updateUserContext(userId, { awaitingReplyKeyboard: undefined });
      
      // Проверим что очистилось
      const contextAfterClear = this.botConstructor.getUserContext(userId);
      console.log('🔍 DEBUG - Context after clear:', {
        awaitingReplyKb: !!contextAfterClear?.awaitingReplyKeyboard
      });
      
      // Если у кнопки есть свой onClick - выполняем его
      if (typeof matchedButton === 'object' && matchedButton.onClick) {
        console.log('🔍 DEBUG - Executing button onClick');
        await this.botConstructor.processUserAction(userId, matchedButton.onClick);
        return true;
      }
      
      // Иначе выполняем общий onSent с переданным value
      if (onSent) {
        console.log('🔍 DEBUG - Executing onSent');
        // Сохраняем value в контекст перед выполнением onSent
        this.botConstructor.updateUserContext(userId, { 
          replyKeyboardValue: matchedValue,
          replyKeyboardText: text
        });
        await this.botConstructor.processUserAction(userId, onSent);
        return true;
      }
    }
    
    // Кнопка не найдена - но все равно обрабатываем onSent если есть
    if (onSent) {
      console.log(`🔘 Reply keyboard custom text (not matched): "${text}"`);
      this.botConstructor.updateUserContext(userId, { 
        awaitingReplyKeyboard: undefined,
        replyKeyboardValue: text,
        replyKeyboardText: text
      });
      await this.botConstructor.processUserAction(userId, onSent);
      return true;
    }
    
    console.log('🔍 DEBUG handleReplyKeyboardResponse - No handler, returning false');
    return false;
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
    const result = await this.bot.sendMessage(chatId, text, options);
    
    // Вызываем callback аналитики для отправленного сообщения
    if (this.analyticsCallbacks?.onMessageSent) {
      this.analyticsCallbacks.onMessageSent(chatId, text, { result, options });
    }
    
    return result;
  }

  // Методы для отправки файлов
  async sendPhoto(chatId: string | number, photo: string, options?: any): Promise<any> {
    return this.bot.sendPhoto(chatId, photo, options);
  }

  async sendDocument(chatId: string | number, document: string, options?: any): Promise<any> {
    return this.bot.sendDocument(chatId, document, options);
  }

  async sendVideo(chatId: string | number, video: string, options?: any): Promise<any> {
    return this.bot.sendVideo(chatId, video, options);
  }

  async sendAudio(chatId: string | number, audio: string, options?: any): Promise<any> {
    return this.bot.sendAudio(chatId, audio, options);
  }

  async sendVoice(chatId: string | number, voice: string, options?: any): Promise<any> {
    return this.bot.sendVoice(chatId, voice, options);
  }

  async sendAnimation(chatId: string | number, animation: string, options?: any): Promise<any> {
    return this.bot.sendAnimation(chatId, animation, options);
  }

  async sendSticker(chatId: string | number, sticker: string, options?: any): Promise<any> {
    return this.bot.sendSticker(chatId, sticker, options);
  }

  async sendMediaGroup(chatId: string | number, media: any[], options?: any): Promise<any> {
    return this.bot.sendMediaGroup(chatId, media, options);
  }

  async editMessageText(chatId: string, messageId: number, text: string, options?: any): Promise<void> {
    console.log('🔍 TelegramAdapter.editMessageText DEBUG:', {
      chatId: chatId,
      messageId: messageId,
      text: text.substring(0, 100) + '...',
      options: options,
      textLength: text.length
    });
    
    try {
      const result = await this.bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        ...options
      });
      console.log('✅ TelegramAdapter.editMessageText SUCCESS:', result);
    } catch (error) {
      console.error('❌ TelegramAdapter.editMessageText ERROR:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        chatId: chatId,
        messageId: messageId
      });
      throw error;
    }
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
    console.log('🔍 TelegramAdapter.deleteMessage DEBUG:', {
      chatId: chatId,
      messageId: messageId,
      chatIdType: typeof chatId,
      messageIdType: typeof messageId
    });
    
    try {
      const result = await this.bot.deleteMessage(chatId, messageId);
      console.log('✅ TelegramAdapter.deleteMessage SUCCESS:', result);
      console.log(`✅ Message ${messageId} deleted in chat ${chatId}`);
    } catch (error) {
      console.error('❌ TelegramAdapter.deleteMessage ERROR:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        response: (error as any)?.response,
        code: (error as any)?.code,
        chatId: chatId,
        messageId: messageId
      });
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