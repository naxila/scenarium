import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { FunctionProcessor } from '../core/FunctionProcessor';
import { ActionMappingService } from '../telegram/ActionMappingService';
import { ActionProcessor } from '../core/ActionProcessor';

export class SendMessageAction extends BaseActionProcessor {
  static readonly actionType = 'SendMessage';
  
  async process(action: any, context: ProcessingContext): Promise<void> {
    // Use withInterpolationContext for consistent context management
    await this.withInterpolationContext(
      context,
      { sent: false, error: null }, // action-specific local variables
      async (interpolationContext) => {
        // Process inlineActions functions before interpolation
        let processedAction = { ...action };
        if (action.inlineActions) {
          // Case 1: inlineActions is a function object
          if (typeof action.inlineActions === 'object' && action.inlineActions.function) {
            try {
              // ПРИНЦИП: Делегируем ответственность за контекст FunctionProcessor
              const processedInlineActions = await FunctionProcessor.evaluateResult(
                action.inlineActions, 
                {}, 
                context, 
                interpolationContext
              );
              processedAction.inlineActions = processedInlineActions;
            } catch (e) {
              console.error('❌ Failed to evaluate inlineActions function:', e);
              processedAction.inlineActions = [];
            }
          }
          // Case 2: inlineActions is an array - process functions inside array elements
          else if (Array.isArray(action.inlineActions)) {
            processedAction.inlineActions = await this.processInlineActionsArray(action.inlineActions, context, interpolationContext);
          }
        }
        
        // Interpolate the action using new system
        const interpolatedAction = this.interpolate(processedAction, interpolationContext);

        const userId = context.userContext.userId;
        let text = interpolatedAction.text;

        // Support for inline functions in text field
        if (text && typeof text === 'object' && (text as any).function) {
          try {
            const evaluated = await FunctionProcessor.evaluateResult(text, {}, context, interpolationContext);
            text = String(evaluated ?? '');
          } catch (e) {
            console.error('Failed to evaluate text function:', e);
            text = '❌ Error processing message';
          }
        }
        
        // Support for inline functions in attachments field
        let attachments = interpolatedAction.attachments;
        if (attachments && typeof attachments === 'object' && (attachments as any).function) {
          try {
            const evaluated = await FunctionProcessor.evaluateResult(attachments, {}, context, interpolationContext);
            attachments = evaluated;
          } catch (e) {
            console.error('Failed to evaluate attachments function:', e);
            attachments = [];
          }
        }
        
        // Check that text is not empty (unless we have attachments)
        const hasAttachments = attachments && 
          Array.isArray(attachments) && 
          attachments.length > 0;
        
        if (!hasAttachments && (!text || typeof text !== 'string' || text.trim() === '')) {
          console.warn('⚠️ Empty or invalid text detected and no attachments, skipping message send');
          return;
        }
        
        console.log(`[User ${userId}] Sending message:`, text);
        
        const chatId = context.userContext.data.telegramData?.chatId || userId;
        
        try {
          const actionProcessor = context.actionProcessor;
          const botConstructor = actionProcessor?.getBotConstructor();
          const adapter = botConstructor?.getAdapter();
          
          if (!adapter) {
            console.warn('Telegram adapter not available, using fallback');
            this.fallbackMessage(text, interpolatedAction.inlineActions);
            return;
          }
          
          const options: any = {};
          const messageActionIds: string[] = []; // Для отслеживания действий этого сообщения
          
          // Флаг для определения есть ли новая replyKeyboard с onSent
          let hasNewReplyKeyboardWithOnSent = false;
          
          const currentUserId = context.userContext.userId;
          
          // Добавляем inline клавиатуру если есть inlineActions
          if (interpolatedAction.inlineActions && Array.isArray(interpolatedAction.inlineActions) && interpolatedAction.inlineActions.length > 0) {
            options.reply_markup = this.createCompactInlineKeyboard(
              interpolatedAction.inlineActions,
              messageActionIds // Передаем массив для сохранения ID действий
            );
          }
          // Добавляем Reply клавиатуру если есть replyKeyboard (объект с buttons внутри)
          else if (interpolatedAction.replyKeyboard && interpolatedAction.replyKeyboard.buttons) {
            const replyKb = interpolatedAction.replyKeyboard;
            const buttons = Array.isArray(replyKb.buttons) ? replyKb.buttons : [];
            if (buttons.length > 0) {
              // Обрабатываем функции в поле text кнопок перед созданием клавиатуры
              const processedButtons = await this.processReplyKeyboardButtons(buttons, context, interpolationContext);
              options.reply_markup = this.createReplyKeyboard(
                processedButtons,
                replyKb.resizeKeyboard !== false, // по умолчанию true
                replyKb.oneTimeKeyboard === true // по умолчанию false
              );
              
              // Сохраняем состояние reply keyboard если есть onSent ИЛИ onClick в кнопках
              // ВАЖНО: onClick и onSent - это разные колбэки:
              // - onClick - индивидуальный для каждой кнопки
              // - onSent - общий для всех кнопок (выполняется если у кнопки нет onClick)
              const originalOnSent = action.replyKeyboard?.onSent;
              
              // Проверяем, есть ли onClick в обработанных кнопках (после обработки функций)
              const hasOnClick = processedButtons.some((row: any) => {
                const rowButtons = Array.isArray(row) ? row : [row];
                return rowButtons.some((btn: any) => typeof btn === 'object' && btn && btn.onClick);
              });
              
              // Сохраняем состояние если есть onSent ИЛИ onClick в кнопках
              if (originalOnSent || hasOnClick) {
                hasNewReplyKeyboardWithOnSent = true;
                // Глубокая копия обработанных кнопок (с результатами функций)
                const buttonsCopy = JSON.parse(JSON.stringify(processedButtons));
                
                // Обрабатываем onClick в кнопках через processFunctionsInObject
                // Это нужно для обработки функций внутри onClick (например, Switch)
                for (const row of buttonsCopy) {
                  const rowButtons = Array.isArray(row) ? row : [row];
                  for (const btn of rowButtons) {
                    if (typeof btn === 'object' && btn && btn.onClick) {
                      // Обрабатываем функции в onClick перед сохранением
                      btn.onClick = await this.processFunctionsInObject(btn.onClick, context, interpolationContext);
                    }
                  }
                }
                
                const onSentCopy = originalOnSent ? JSON.parse(JSON.stringify(originalOnSent)) : undefined;
                // Логируем что сохраняем
                // Используем updateUserContext для правильного сохранения в SessionManager
                botConstructor.updateUserContext(currentUserId, {
                  awaitingReplyKeyboard: {
                    buttons: buttonsCopy,  // обработанные кнопки с результатами функций и обработанными onClick
                    onSent: onSentCopy     // копия onSent (может быть undefined если только onClick)
                  }
                });
              }
            }
          }
          // По умолчанию очищаем клавиатуру (если clearKeyboard !== false)
          else if (interpolatedAction.clearKeyboard !== false) {
            options.reply_markup = { remove_keyboard: true };
          }
          
          // Очищаем старое состояние awaitingReplyKeyboard если не устанавливаем новое
          // Используем updateUserContext для правильной синхронизации с SessionManager
          if (!hasNewReplyKeyboardWithOnSent) {
            botConstructor.updateUserContext(currentUserId, {
              awaitingReplyKeyboard: undefined
            });
          }
          
          // Проверяем результат очистки
          const contextAfterUpdate = botConstructor.getUserContext(currentUserId);
          
          // ОГРАНИЧЕНИЕ TELEGRAM API:
          // reply_markup может быть только одним из: InlineKeyboardMarkup, ReplyKeyboardMarkup, 
          // ReplyKeyboardRemove или ForceReply. Поэтому clearKeyboard работает только когда 
          // нет inline_keyboard и нет replyKeyboard.
          // Для автоматического скрытия reply keyboard после нажатия используйте oneTimeKeyboard: true
          
          // Устанавливаем режим разметки в зависимости от параметра markdown
          if (interpolatedAction.markdown === true) {
            options.parse_mode = 'Markdown';
          } else if (interpolatedAction.markdown === false) {
            options.parse_mode = undefined; // Отключаем парсинг
          } else {
            // По умолчанию отключаем Markdown парсинг
            options.parse_mode = undefined;
          }

          // Отправляем или обновляем сообщение
          let message: any = null;
          const updateTarget = (context.localContext as any)?.__updateMessage__;
          
          // Отправка вложений если есть
          if (hasAttachments) {
            message = await this.sendAttachments(adapter, chatId, attachments, options, text);
          } else if (updateTarget && updateTarget.messageId) {
            await adapter.editMessageText(chatId, Number(updateTarget.messageId), text, options);
            message = { message_id: Number(updateTarget.messageId) };
          } else {
            message = await adapter.sendMessage(chatId, text, options);
          }
          
          // Update local variables
          if (message && message.message_id) {
            // messageId is dynamic and should not be hardcoded in local context
            interpolationContext.local.setVariable('sent', true);
            
            // Обновляем lastMessageId ДО выполнения onSuccess
            if (!updateTarget) {
              context.userContext.data.lastMessageId = message.message_id;
              context.userContext.data.lastMessageActionIds = messageActionIds;
            }
          }

          // Коллбек onSuccess с доступом к messageId
          if (interpolatedAction.onSuccess && message && message.message_id) {
            
            // Update local variables with message info
            interpolationContext.local.setVariable('sent', true);
            
            
            // Process onSuccess actions with special handling for CURRENT_MESSAGE_ID
            const processedOnSuccess = interpolatedAction.onSuccess.map((action: any) => {
              if (action.action === 'Store' && action.value === 'CURRENT_MESSAGE_ID') {
                return {
                  ...action,
                  value: message.message_id.toString()
                };
              }
              return action;
            });
            
            const nextContext: ProcessingContext = {
              ...context,
              localContext: {
                ...context.localContext,
                messageId: message.message_id
              },
              interpolationContext: interpolationContext // Pass interpolation context to nested actions
            };
            await this.processNestedActions(processedOnSuccess, nextContext);
          }
          
        } catch (error) {
          console.error(`❌ Failed to send message:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          interpolationContext.local.setVariable('error', errorMessage);
        }
        
        this.updateUserActivity(context);
      }
    );
  }
  
  /**
   * Process inlineActions array, supporting both flat arrays and 2D arrays (for row grouping)
   */
  private async processInlineActionsArray(inlineActions: any[], context: ProcessingContext, interpolationContext: any): Promise<any[]> {
    const processedArray = [];
    
    for (let i = 0; i < inlineActions.length; i++) {
      const element = inlineActions[i];
      
      // Check if element is a row (array of buttons)
      if (Array.isArray(element)) {
        const processedRow = [];
        for (let j = 0; j < element.length; j++) {
          const rowElement = element[j];
          if (rowElement && typeof rowElement === 'object' && rowElement.function) {
            try {
              const result = await FunctionProcessor.evaluateResult(rowElement, {}, context, interpolationContext);
              if (result != null) {
                if (Array.isArray(result)) {
                  processedRow.push(...result);
                } else {
                  processedRow.push(result);
                }
              }
            } catch (e) {
              console.error(`❌ Failed to evaluate function in inlineActions[${i}][${j}]:`, e);
            }
          } else {
            processedRow.push(rowElement);
          }
        }
        if (processedRow.length > 0) {
          processedArray.push(processedRow);
        }
      }
      // Process function objects
      else if (element && typeof element === 'object' && element.function) {
        try {
          console.log(`🗺️ Processing function in inlineActions[${i}]:`, element.function);
          const result = await FunctionProcessor.evaluateResult(element, {}, context, interpolationContext);
          console.log(`🗺️ Function result for inlineActions[${i}]:`, result);
          
          if (result == null) {
            console.log(`🗺️ Skipping null result for inlineActions[${i}]`);
            continue;
          }
          
          if (Array.isArray(result)) {
            processedArray.push(...result);
          } else {
            processedArray.push(result);
          }
        } catch (e) {
          console.error(`❌ Failed to evaluate function in inlineActions[${i}]:`, e);
        }
      } else {
        // Regular element, add as is
        processedArray.push(element);
      }
    }
    
    return processedArray;
  }
  
  /**
   * Send attachments (supports single attachment or media group)
   */
  private async sendAttachments(adapter: any, chatId: string | number, attachments: any[], options: any, caption?: string): Promise<any> {
    // Если одно вложение - отправляем обычным способом
    if (attachments.length === 1) {
      return this.sendSingleAttachment(adapter, chatId, attachments[0], options, caption);
    }
    
    // Несколько вложений - используем sendMediaGroup
    // Media group поддерживает только photo, video, document, audio
    const mediaGroupTypes = ['photo', 'video', 'document', 'audio'];
    const mediaItems: any[] = [];
    
    // Определяем, есть ли inline клавиатура
    const hasInlineKeyboard = options.reply_markup && options.reply_markup.inline_keyboard;
    
    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      const type = attachment.type || 'document';
      const media = attachment.fileId || attachment.url;
      
      if (!media) {
        console.warn(`⚠️ Attachment ${i} has no fileId or url, skipping`);
        continue;
      }
      
      // Проверяем что тип поддерживается в media group
      if (!mediaGroupTypes.includes(type)) {
        console.warn(`⚠️ Attachment type "${type}" is not supported in media group, skipping`);
        continue;
      }
      
      const mediaItem: any = {
        type: type,
        media: media
      };
      
      // Caption только для первого элемента, НО:
      // Если есть inline клавиатура, caption отправим отдельным сообщением с кнопками
      if (i === 0 && caption && caption.trim() && !hasInlineKeyboard) {
        mediaItem.caption = caption;
        if (options.parse_mode) {
          mediaItem.parse_mode = options.parse_mode;
        }
      }
      
      mediaItems.push(mediaItem);
    }
    
    if (mediaItems.length === 0) {
      throw new Error('No valid attachments for media group');
    }
    
    if (mediaItems.length === 1) {
      // Если остался только один элемент - отправляем обычным способом
      return this.sendSingleAttachment(adapter, chatId, attachments[0], options, caption);
    }
    
    console.log(`📎 Sending media group with ${mediaItems.length} items`);
    
    // Отправляем media group (NOTE: Telegram API не поддерживает reply_markup для media groups)
    const messages = await adapter.sendMediaGroup(chatId, mediaItems);
    
    // WORKAROUND: Если есть inline клавиатура, отправляем caption с кнопками отдельным сообщением
    if (hasInlineKeyboard && caption && caption.trim()) {
      console.log('📎 Media group sent. Sending caption with inline keyboard as separate message...');
      await adapter.sendMessage(chatId, caption, { 
        reply_markup: options.reply_markup,
        parse_mode: options.parse_mode 
      });
    }
    
    // Возвращаем первое сообщение из группы
    return Array.isArray(messages) && messages.length > 0 ? messages[0] : messages;
  }
  
  /**
   * Send single attachment
   */
  private async sendSingleAttachment(adapter: any, chatId: string | number, attachment: any, options: any, caption?: string): Promise<any> {
    const attachmentType = attachment.type || 'document'; // photo, document, video, audio, voice, animation
    
    // Добавляем caption если есть текст
    if (caption && caption.trim()) {
      options.caption = caption;
    }
    
    // Получаем file (либо fileId, либо url)
    const file = attachment.fileId || attachment.url;
    
    if (!file) {
      throw new Error('Attachment must have either fileId or url');
    }
    
    console.log(`📎 Sending ${attachmentType}:`, { file: typeof file === 'string' ? file.substring(0, 50) : file, hasCaption: !!caption });
    
    // Вызываем соответствующий метод адаптера
    switch (attachmentType) {
      case 'photo':
        return adapter.sendPhoto(chatId, file, options);
      case 'document':
        return adapter.sendDocument(chatId, file, options);
      case 'video':
        return adapter.sendVideo(chatId, file, options);
      case 'audio':
        return adapter.sendAudio(chatId, file, options);
      case 'voice':
        return adapter.sendVoice(chatId, file, options);
      case 'animation':
        return adapter.sendAnimation(chatId, file, options);
      case 'sticker':
        return adapter.sendSticker(chatId, file, options);
      default:
        return adapter.sendDocument(chatId, file, options);
    }
  }
  
  /**
   * Create inline keyboard supporting 2D arrays for row grouping
   * Supports onClick (callback) and url (external link)
   */
  private createCompactInlineKeyboard(inlineActions: any[], actionIdsStorage: string[]): any {
    const keyboard = [];
    const actionMappingService = ActionMappingService.getInstance();
    
    for (const action of inlineActions) {
      // Check if this is a row (array of buttons)
      if (Array.isArray(action)) {
        const row = [];
        for (const buttonAction of action) {
          const button = this.createInlineButton(buttonAction, actionMappingService, actionIdsStorage);
          if (button) {
            row.push(button);
          }
        }
        if (row.length > 0) {
          keyboard.push(row);
        }
      }
      // Single button - each on its own row
      else {
        const button = this.createInlineButton(action, actionMappingService, actionIdsStorage);
        if (button) {
          keyboard.push([button]);
        }
      }
    }
    
    return {
      inline_keyboard: keyboard
    };
  }
  
  /**
   * Create a single inline button (callback or url)
   */
  private createInlineButton(buttonAction: any, actionMappingService: ActionMappingService, actionIdsStorage: string[]): any {
    if (!buttonAction.title) return null;
    
    // If onClick is specified - create callback button
    if (buttonAction.onClick) {
      const actionId = actionMappingService.registerAction(buttonAction.onClick);
      actionIdsStorage.push(actionId);
      console.log(`🔗 Mapped action: ${actionId} for button "${buttonAction.title}"`);
      return {
        text: buttonAction.title,
        callback_data: actionId
      };
    }
    
    // If url is specified - create URL button
    if (buttonAction.url) {
      console.log(`🔗 URL button: "${buttonAction.title}" -> ${buttonAction.url}`);
      return {
        text: buttonAction.title,
        url: buttonAction.url
      };
    }
    
    return null;
  }
  
  /**
   * Create Reply keyboard
   * Button can be:
   * - string: just text
   * - object with text: display text (and optionally request_contact/request_location)
   * - object with text and value: display text, but value is what gets sent (we map it)
   * - object with text and onClick: display text, execute onClick action when pressed
   */
  /**
   * Обрабатывает функции в кнопках replyKeyboard:
   * - Функции как элементы массива (список кнопок)
   * - Функции в полях text, value, onClick и других полях кнопок
   */
  private async processReplyKeyboardButtons(buttons: any[], context: ProcessingContext, interpolationContext: any): Promise<any[]> {
    const processedButtons = [];
    
    for (const row of buttons) {
      // Если элемент - функция, обрабатываем её
      if (typeof row === 'object' && row !== null && row.function) {
        try {
          console.log('🔍 DEBUG processReplyKeyboardButtons - Evaluating function:', row.function);
          const evaluated = await FunctionProcessor.evaluateResult(row, {}, context, interpolationContext);
          console.log('🔍 DEBUG processReplyKeyboardButtons - Function result:', JSON.stringify(evaluated).substring(0, 200));
          if (evaluated != null) {
            if (Array.isArray(evaluated)) {
              // Если функция вернула массив, рекурсивно обрабатываем его
              const processedArray = await this.processReplyKeyboardButtons(evaluated, context, interpolationContext);
              processedButtons.push(...processedArray);
            } else {
              // Если функция вернула один элемент, рекурсивно обрабатываем его
              const processed = await this.processReplyKeyboardButtons([evaluated], context, interpolationContext);
              if (processed.length > 0) {
                processedButtons.push(...processed);
              }
            }
          }
        } catch (e) {
          console.error('❌ Failed to evaluate function in replyKeyboard buttons array:', e);
        }
        continue;
      }
      
      if (Array.isArray(row)) {
        // Ряд кнопок
        const processedRow = [];
        for (const btn of row) {
          // Если элемент - функция, обрабатываем её
          if (typeof btn === 'object' && btn !== null && btn.function) {
            try {
              const evaluated = await FunctionProcessor.evaluateResult(btn, {}, context, interpolationContext);
              if (evaluated != null) {
                if (Array.isArray(evaluated)) {
                  processedRow.push(...evaluated);
                } else {
                  processedRow.push(evaluated);
                }
              }
            } catch (e) {
              console.error('❌ Failed to evaluate function in replyKeyboard button row:', e);
            }
          } else if (typeof btn === 'string') {
            processedRow.push(btn);
          } else if (typeof btn === 'object' && btn !== null) {
            // Обрабатываем функции в объекте кнопки, но сохраняем onClick отдельно
            // onClick обрабатывается позже при сохранении в awaitingReplyKeyboard
            const processedBtn = { ...btn };
            // Временно сохраняем onClick
            const originalOnClick = processedBtn.onClick;
            // Удаляем onClick из обработки
            delete processedBtn.onClick;
            // Обрабатываем все остальные поля (text, value и т.д.)
            const processedWithoutOnClick = await this.processFunctionsInObject(processedBtn, context, interpolationContext);
            // Восстанавливаем onClick (он будет обработан отдельно позже)
            processedWithoutOnClick.onClick = originalOnClick;
            processedRow.push(processedWithoutOnClick);
          } else {
            processedRow.push(btn);
          }
        }
        if (processedRow.length > 0) {
          processedButtons.push(processedRow);
        }
      } else if (typeof row === 'string') {
        // Простая строка
        processedButtons.push(row);
      } else if (typeof row === 'object' && row !== null) {
        // Одна кнопка-объект - обрабатываем функции, но сохраняем onClick отдельно
        const processedBtn = { ...row };
        // Временно сохраняем onClick
        const originalOnClick = processedBtn.onClick;
        // Удаляем onClick из обработки
        delete processedBtn.onClick;
        // Обрабатываем все остальные поля (text, value и т.д.)
        const processedWithoutOnClick = await this.processFunctionsInObject(processedBtn, context, interpolationContext);
        // Восстанавливаем onClick (он будет обработан отдельно позже)
        processedWithoutOnClick.onClick = originalOnClick;
        processedButtons.push(processedWithoutOnClick);
      } else {
        processedButtons.push(row);
      }
    }
    
    return processedButtons;
  }

  private createReplyKeyboard(buttons: any[], resizeKeyboard: boolean, oneTimeKeyboard: boolean): any {
    const keyboard = [];
    
    for (const row of buttons) {
      // Each row can be a string, an array of strings, or an array of button objects
      if (Array.isArray(row)) {
        const keyboardRow = row.map(btn => {
          if (typeof btn === 'string') {
            return { text: btn };
          }
          // Button object - extract only Telegram-supported fields
          const telegramBtn: any = { text: btn.text || btn };
          if (btn.request_contact) telegramBtn.request_contact = true;
          if (btn.request_location) telegramBtn.request_location = true;
          return telegramBtn;
        });
        keyboard.push(keyboardRow);
      } else if (typeof row === 'string') {
        keyboard.push([{ text: row }]);
      } else {
        // Single button object
        const telegramBtn: any = { text: row.text || row };
        if (row.request_contact) telegramBtn.request_contact = true;
        if (row.request_location) telegramBtn.request_location = true;
        keyboard.push([telegramBtn]);
      }
    }
    
    return {
      keyboard,
      resize_keyboard: resizeKeyboard,
      one_time_keyboard: oneTimeKeyboard
    };
  }
  
  private createCompactCallbackData(action: any): string {
    // Создаем компактные данные для callback чтобы избежать ограничения 64 байта
    if (!action || typeof action !== 'object') {
      return 'default';
    }
    
    // Для простых действий используем короткие идентификаторы
    if (action.action === 'Navigate') {
      return `nav:${action.menuItem}:${action.addToBackStack ? '1' : '0'}`;
    }
    
    if (action.action === 'Back') {
      return 'back';
    }
    
    if (action.action === 'SendMessage') {
      // Для отправки сообщений используем хэш текста
      const textHash = this.hashCode(action.text || '').toString(36);
      return `msg:${textHash}`;
    }
    
    // Для сложных действий используем JSON но обрезаем до 64 символов
    const jsonData = JSON.stringify(action);
    if (jsonData.length <= 64) {
      return jsonData;
    }
    
    // Если данные слишком большие, используем хэш
    return `hash:${this.hashCode(jsonData).toString(36)}`;
  }
  
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
  

  private fallbackMessage(text: string, inlineActions?: any[]): void {
    console.log('📨 Fallback message (would send in production):');
    console.log('Text:', text);
    if (inlineActions) {
      console.log('Inline actions:', inlineActions.map(a => a.title));
    }
  }
}