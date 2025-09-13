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
        if (action.inlineActions && typeof action.inlineActions === 'object' && action.inlineActions.function) {
          try {
            console.log('🗺️ Processing inlineActions function before interpolation:', action.inlineActions.function);
            console.log('🔍 Interpolation context debug:', {
              hasLocal: !!interpolationContext.local,
              hasUser: !!interpolationContext.user,
              hasData: !!interpolationContext.data,
              localMethods: interpolationContext.local ? Object.getOwnPropertyNames(interpolationContext.local) : 'undefined'
            });
            
            // ПРИНЦИП: Делегируем ответственность за контекст FunctionProcessor
            const processedInlineActions = await FunctionProcessor.evaluateResult(
              action.inlineActions, 
              {}, 
              context, 
              interpolationContext
            );
            console.log('🗺️ Processed inlineActions result:', processedInlineActions);
            processedAction.inlineActions = processedInlineActions;
          } catch (e) {
            console.error('❌ Failed to evaluate inlineActions function:', e);
            processedAction.inlineActions = [];
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
          if (interpolatedAction.inlineActions && Array.isArray(interpolatedAction.inlineActions) && interpolatedAction.inlineActions.length > 0) {
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
          
          console.log('🔍 SendMessage DEBUG - Message operation:', {
            hasUpdateTarget: !!updateTarget,
            updateTargetMessageId: updateTarget?.messageId,
            chatId: chatId,
            text: text.substring(0, 50) + '...',
            isUpdate: !!(updateTarget && updateTarget.messageId)
          });
          
          if (updateTarget && updateTarget.messageId) {
            console.log('🔍 SendMessage DEBUG - Updating existing message');
            const result = await adapter.editMessageText(chatId, Number(updateTarget.messageId), text, options);
            console.log('✅ SendMessage DEBUG - Update result:', result);
            message = { message_id: Number(updateTarget.messageId) };
          } else {
            console.log('🔍 SendMessage DEBUG - Sending new message');
            message = await adapter.sendMessage(chatId, text, options);
            console.log('✅ SendMessage DEBUG - Send result:', message);
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
            console.log('🔍 SendMessage DEBUG - onSuccess triggered:', {
              messageId: message.message_id,
              onSuccessActions: interpolatedAction.onSuccess,
              localScopes: interpolationContext.local.getAllScopes()
            });
            
            // Update local variables with message info
            interpolationContext.local.setVariable('sent', true);
            
            console.log('🔍 SendMessage DEBUG - After setting sent in local scope:', {
              localScopes: interpolationContext.local.getAllScopes()
            });
            
            // Process onSuccess actions with special handling for CURRENT_MESSAGE_ID
            const processedOnSuccess = interpolatedAction.onSuccess.map((action: any) => {
              if (action.action === 'Store' && action.value === 'CURRENT_MESSAGE_ID') {
                console.log('🔍 SendMessage DEBUG - Replacing CURRENT_MESSAGE_ID with actual messageId:', message.message_id);
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