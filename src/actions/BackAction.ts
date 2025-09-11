import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { ActionProcessor } from '../core/ActionProcessor';

export class BackAction extends BaseActionProcessor {
  static readonly actionType = 'Back';
  
  async process(action: any, context: ProcessingContext): Promise<void> {
    // Create interpolation context for this action
    const interpolationContext = this.createInterpolationContext(context);
    
    // Create local scope for action-specific variables
    interpolationContext.local.createScope();
    
    try {
      // Interpolate the action using new system
      const interpolatedAction = this.interpolate(action, interpolationContext);
      
      const { removePreviousMessage = false } = interpolatedAction; // Add flag support
    
    console.log(`↩️ Back action, removePrevious: ${removePreviousMessage}`);
    
    // Delete previous message if needed
    if (removePreviousMessage) {
      await this.deletePreviousMessages(context);
    }
    
    const stack = context.userContext.backStack;
    console.log(`📚 Stack:`, JSON.stringify(stack));
    
    if (stack.length > 1) {
      const currentMenu = stack.pop()!;
      const previousMenu = stack[stack.length - 1];
      
      console.log(`🔁 Back: ${currentMenu} → ${previousMenu}`);
      
      context.userContext.currentMenu = previousMenu;
      this.updateUserActivity(context);
      
      const menu = context.scenario.menuItems[previousMenu];
      if (menu) {
        await this.processNestedActions(menu.onNavigation, context);
      } else {
        await this.fallbackToStart(context);
      }
    } else {
      await this.fallbackToStart(context);
    }
    
    } finally {
      // Clean up local scope when action completes
      interpolationContext.local.clearScope();
    }
  }
  
  private async deletePreviousMessages(context: ProcessingContext): Promise<void> {
    const chatId = context.userContext.data.telegramData?.chatId;
    const messageId = context.userContext.data.lastMessageId;
    
    if (!chatId || !messageId) {
      console.log('❌ No chatId or messageId for deletion');
      return;
    }
    
    console.log(`🗑️ Deleting previous message ${messageId}`);
    
    try {
      const actionProcessor = context.actionProcessor;
      const botConstructor = actionProcessor?.getBotConstructor();
      const adapter = botConstructor?.getAdapter();
      
      if (adapter) {
        // Вместо удаления отправляем сообщение о том, что сообщение удалено
        await adapter.sendMessage(chatId.toString(), '🗑️ Предыдущее сообщение удалено', {});
        console.log(`✅ Deleted message ${messageId}`);
        
        delete context.userContext.data.lastMessageId;
      } else {
        console.warn('Telegram adapter not available, cannot delete message');
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  }
  
  private async fallbackToStart(context: ProcessingContext): Promise<void> {
    console.log(`🏠 Falling back to start actions`);
    
    context.userContext.currentMenu = undefined;
    context.userContext.backStack = [];
    
    if (context.scenario.onStartActions) {
      await this.processNestedActions(context.scenario.onStartActions, context);
    }
  }
}