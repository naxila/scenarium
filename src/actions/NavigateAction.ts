import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { ActionProcessor } from '../core/ActionProcessor';
import { ActionMappingService } from '../telegram/ActionMappingService';

export class NavigateAction extends BaseActionProcessor {
  static readonly actionType = 'Navigate';
  
  async process(action: any, context: ProcessingContext): Promise<void> {
    const { 
      menuItem, 
      addToBackStack = true,
      removePreviousMessage = false,
      uniqueInStack = true 
    } = action;
    

    // Очищаем действия предыдущего сообщения
    if (removePreviousMessage) {
      await this.cleanupPreviousActions(context);
      await this.deletePreviousMessages(context);
    }
    
    const isBackAction = context.localContext.isBackAction === true;

    // Обновляем текущее меню
    context.userContext.currentMenu = menuItem;
    this.updateUserActivity(context);

    // Поддерживаем стек так, чтобы последний элемент всегда соответствовал текущему меню
    if (addToBackStack && !isBackAction) {
      this.addToBackStack(context, menuItem, uniqueInStack);
    }

    // Получаем меню из сценария
    const menu = context.scenario.menuItems[menuItem];
    if (!menu) {
      console.warn(`❌ Menu item ${menuItem} not found, falling back to start actions`);
      await this.fallbackToStart(context);
      return;
    }
    
    // Рекурсивный вызов обработки действий меню
    await this.processNestedActions(menu.onNavigation, context);
  }
  
  private async deletePreviousMessages(context: ProcessingContext): Promise<void> {
    const chatId = context.userContext.data.telegramData?.chatId;
    const messageId = context.userContext.data.lastMessageId;
    
    if (!chatId || !messageId) {
      return;
    }
    
    try {
      const actionProcessor = context.actionProcessor;
      const botConstructor = actionProcessor?.getBotConstructor();
      const adapter = botConstructor?.getAdapter();
      
      if (adapter) {
        await adapter.sendMessage(chatId.toString(), '🗑️ Предыдущее сообщение удалено', {});
        delete context.userContext.data.lastMessageId;
      }
    } catch (error) {
      console.error(`❌ Failed to delete message ${messageId}:`, error);
    }
  }

  private async cleanupPreviousActions(context: ProcessingContext): Promise<void> {
    const actionIds = context.userContext.data.lastMessageActionIds;
    
    if (actionIds && actionIds.length > 0) {
      console.log(`🧹 Cleaning up ${actionIds.length} previous message actions`);
      const actionMappingService = ActionMappingService.getInstance(); // Теперь будет работать
      actionMappingService.clearMessageActions(actionIds);
      
      // Очищаем storage
      delete context.userContext.data.lastMessageActionIds;
    }
  }
  
  private addToBackStack(context: ProcessingContext, menu: string, unique: boolean): void {
    const stack = context.userContext.backStack;
    const lastItem = stack[stack.length - 1];

    // Если включена уникальность — уберём предыдущее вхождение этого меню в стеке
    if (unique) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i] === menu) {
          stack.splice(i, 1);
          break;
        }
      }
    }

    // Если последний элемент уже текущий — не дублируем
    if (lastItem === menu) {
      console.log(`🔄 Skip duplicate: ${menu} (already last in stack)`);
    } else {
      stack.push(menu);
      console.log(`➕ Added to stack: ${menu}`);
    }
    
    // Лимит размера стека
    if (stack.length > 20) {
      stack.shift();
    }
    
    console.log(`📊 Stack size: ${stack.length}`);
  }
  
  private async fallbackToStart(context: ProcessingContext): Promise<void> {
    console.log(`🏠 Falling back to onStartActions`);
    
    // Сбрасываем текущее меню и стек
    context.userContext.currentMenu = undefined;
    context.userContext.backStack = [];
    
    // Запускаем onStartActions
    if (context.scenario.onStartActions) {
      await this.processNestedActions(context.scenario.onStartActions, context);
    } else {
      await this.processNestedActions([
        {
          action: "SendMessage",
          text: "🏠 Возврат в начало навигации"
        }
      ], context);
    }
  }
}