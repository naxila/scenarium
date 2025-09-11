import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { InterpolationEngine } from '../utils/InterpolationEngine';
import { FunctionProcessor } from '../core/FunctionProcessor';
import { ActionMappingService } from '../telegram/ActionMappingService';
import { ActionProcessor } from '../core/ActionProcessor';

export class SendMessageAction extends BaseActionProcessor {
  static readonly actionType = 'SendMessage';
  
  async process(action: any, context: ProcessingContext): Promise<void> {
    const fullContext = this.getFullContext(context);
    const interpolatedAction = InterpolationEngine.interpolateObject(action, fullContext);

    
    const userId = context.userContext.userId;
    let text = interpolatedAction.text;

    // Support for inline functions in text field
    if (text && typeof text === 'object' && (text as any).function) {
      try {
        const evaluated = await FunctionProcessor.evaluateResult(text, {}, context);
        text = String(evaluated ?? '');
      } catch (e) {
        console.error('Failed to evaluate text function:', e);
        text = '❌ Error processing message';
      }
    }
    
    // Check that text is not empty
    if (!text || text.trim() === '') {
      console.warn('⚠️ Empty text detected, skipping message send');
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
      
      // Добавляем inline клавиатуру если есть inlineActions
      if (interpolatedAction.inlineActions && interpolatedAction.inlineActions.length > 0) {
        options.reply_markup = this.createCompactInlineKeyboard(
          interpolatedAction.inlineActions,
          messageActionIds // Передаем массив для сохранения ID действий
        );
      }
      
      // Устанавливаем режим разметки по умолчанию, если не задан
      if (!options.parse_mode) {
        options.parse_mode = 'Markdown';
      }

      // Отправляем или обновляем сообщение
      let message: any = null;
      const updateTarget = (context.localContext as any)?.__updateMessage__;
      if (updateTarget && updateTarget.messageId) {
        await adapter.editMessageText(chatId, Number(updateTarget.messageId), text, options);
        message = { message_id: Number(updateTarget.messageId) };
      } else {
        message = await adapter.sendMessage(chatId, text, options);
      }
      
      // Сохраняем ID сообщения и actionIds для будущей очистки
      if (!updateTarget && message && message.message_id) {
        context.userContext.data.lastMessageId = message.message_id;
        context.userContext.data.lastMessageActionIds = messageActionIds;
      }

      // Коллбек onSuccess с доступом к messageId
      if (interpolatedAction.onSuccess && message && message.message_id) {
        const nextContext: ProcessingContext = {
          ...context,
          localContext: {
            ...context.localContext,
            messageId: message.message_id
          }
        };
        await this.processNestedActions(interpolatedAction.onSuccess, nextContext);
      }
      
    } catch (error) {
      console.error(`❌ Failed to send message:`, error);
    }
    
    this.updateUserActivity(context);
  }
  
  private createCompactInlineKeyboard(inlineActions: any[], actionIdsStorage: string[]): any {
    const keyboard = [];
    const actionMappingService = ActionMappingService.getInstance();
    
    for (const action of inlineActions) {
      if (action.onClick) {
        // Регистрируем действие и получаем короткий ID
        const actionId = actionMappingService.registerAction(action.onClick);
        actionIdsStorage.push(actionId); // Сохраняем ID для будущей очистки
        
        const button = {
          text: action.title,
          callback_data: actionId
        };
        
        console.log(`🔗 Mapped action: ${actionId} for button "${action.title}"`);
        keyboard.push([button]);
      }
    }
    
    return {
      inline_keyboard: keyboard
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