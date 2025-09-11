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
      // Получаем BotInstance из TelegramBotConstructor
      const botInstance = (bot as any).botInstance;
      await this.cancel(botInstance, userId);
      return true;
    }

    // Save input value
    const inputKey = awaiting.key as string;
    const existingInput = (userContext as any).input || {};
    const newInput = { ...existingInput, [inputKey]: text };
    bot.updateUserContext(userId, { input: newInput, awaitingInput: undefined });

    // Run onDone
    if (awaiting.onDone) {
      await bot.processUserAction(userId, awaiting.onDone);
      if (awaiting.clearInputOnDone) {
        bot.updateUserContext(userId, { input: {} });
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
        // Получаем ActionProcessor из BotInstance
        const actionProcessor = (bot as any).getActionProcessor?.();
        const botConstructor = actionProcessor?.getBotConstructor();
        const adapter = botConstructor?.getAdapter();
        
        if (adapter) {
          // Вместо удаления отправляем сообщение о том, что ввод отменен
          await adapter.sendMessage(userId, '❌ Ввод отменен', {});
        }
      }
    } catch {}

    bot.updateUserContext(userId, { awaitingInput: undefined });
    if (awaiting.onCancel) {
      await bot.processUserAction(userId, awaiting.onCancel);
    }
  }
}


