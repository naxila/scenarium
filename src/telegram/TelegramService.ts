import TelegramBot from 'node-telegram-bot-api';

export class TelegramService {
  private static instance: TelegramService;
  private bot: TelegramBot | null = null;

  static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  setBot(bot: TelegramBot): void {
    this.bot = bot;
  }

  async sendMessage(chatId: string, text: string, options?: any): Promise<any> {
    if (!this.bot) {
      console.warn('Telegram bot not initialized, message not sent:', text);
      const mockMessage = {
        message_id: Math.floor(Math.random() * 1000) + 1000,
        chat: { id: chatId },
        text: text,
        date: Date.now()
      };
      return mockMessage;
    }
  
    try {
      const message = await this.bot.sendMessage(chatId, text, options);
      return message;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }

  async editMessageText(chatId: string, messageId: number, text: string, options?: any): Promise<void> {
    if (!this.bot) {
      console.warn('Telegram bot not initialized, message not edited');
      return;
    }

    try {
      await this.bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        ...options
      });
      console.log(`✅ Message edited for ${chatId}`);
    } catch (error) {
      console.error('❌ Failed to edit message:', error);
      throw error;
    }
  }

  async deleteMessage(chatId: string, messageId: number): Promise<void> {
    if (!this.bot) {
      console.warn('Telegram bot not initialized, message not deleted');
      return;
    }

    try {
      await this.bot.deleteMessage(chatId, messageId);
      console.log(`✅ Message ${messageId} deleted for chat ${chatId}`);
    } catch (error) {
      console.error('❌ Failed to delete message:', error);
      // Не бросаем ошибку, так как удаление сообщений не критично
    }
  }

  createInlineKeyboard(inlineActions: any[]): any {
    return {
      inline_keyboard: [
        inlineActions.map(action => ({
          text: action.title,
          callback_data: JSON.stringify(action.onClick)
        }))
      ]
    };
  }
}