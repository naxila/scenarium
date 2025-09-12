import { TelegramBotConstructor } from '../assembly/TelegramBotConstructor';
import { ActionProcessor } from './ActionProcessor';
import { BotInstance } from './BotInstance';

export class InputManager {
  static async handleUserText(bot: TelegramBotConstructor, userId: string, text: string): Promise<boolean> {
    const userContext = bot.getUserContext(userId);
    const awaiting = (userContext as any)?.awaitingInput;
    if (!awaiting || !text.trim()) return false;

    const lower = text.trim().toLowerCase();
    if (lower === 'отмена' || lower === 'cancel') {
      // Get BotInstance from TelegramBotConstructor
      const botInstance = (bot as any).botInstance;
      await this.cancel(botInstance, userId);
      return true;
    }

    // Save input value in user data (not nested in input object)
    const inputKey = awaiting.key as string;
    const updateData = { 
      [inputKey]: text,  // Store directly as key: value (e.g., name: "John", email: "john@example.com")
      awaitingInput: undefined 
    };
    bot.updateUserContext(userId, updateData);

    // Run onDone
    if (awaiting.onDone) {
      await bot.processUserAction(userId, awaiting.onDone);
      if (awaiting.clearInputOnDone) {
        // Clear the specific input key instead of entire input object
        bot.updateUserContext(userId, { [inputKey]: undefined });
      }
      return true;
    }

    return false;
  }

  static async cancel(bot: BotInstance, userId: string): Promise<void> {
    const userContext = bot.getUserContext(userId);
    const awaiting = (userContext as any)?.awaitingInput;
    if (!awaiting) return;

    try {
      if (awaiting.removeHintOnCancel && awaiting.hintMessageId) {
        // Get ActionProcessor from BotInstance
        const actionProcessor = (bot as any).getActionProcessor?.();
        const botConstructor = actionProcessor?.getBotConstructor();
        const adapter = botConstructor?.getAdapter();
        
        if (adapter) {
          // Instead of deleting, send message that input is cancelled
          await adapter.sendMessage(userId, '❌ Input cancelled', {});
        }
      }
    } catch {}

    bot.updateUserContext(userId, { awaitingInput: undefined });
    if (awaiting.onCancel) {
      await bot.processUserAction(userId, awaiting.onCancel);
    }
  }
}


