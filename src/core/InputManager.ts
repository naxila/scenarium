import { TelegramBotConstructor } from '../assembly/TelegramBotConstructor';
import { ActionProcessor } from './ActionProcessor';
import { BotInstance } from './BotInstance';

export class InputManager {
  static async handleUserText(bot: TelegramBotConstructor, userId: string, text: string, message?: any): Promise<boolean> {
    const userContext = bot.getUserContext(userId);
    const awaiting = (userContext as any)?.awaitingInput;
    if (!awaiting) return false;

    // Используем text или caption из message (для фото/видео с подписью)
    const actualText = text?.trim() || message?.caption?.trim() || '';
    
    const lower = actualText.toLowerCase();
    if (lower === 'отмена' || lower === 'cancel') {
      // Get BotInstance from TelegramBotConstructor
      const botInstance = (bot as any).botInstance;
      await this.cancel(botInstance, userId);
      return true;
    }

    const inputKey = awaiting.key as string;
    const attachmentsKey = `${inputKey}_attachments`;
    
    // Extract attachments if allowAttachments is enabled and message is provided
    let attachments: Array<any> = [];
    if (awaiting.allowAttachments && message) {
      attachments = this.extractAttachments(message);
      console.log(`📎 Extracted ${attachments.length} attachments for key ${attachmentsKey}:`, attachments);
    }

    // If no text and no attachments (and attachments are required), don't process
    if (!actualText && attachments.length === 0) {
      return false;
    }

    // Save input value in user data (not nested in input object)
    const updateData: Record<string, any> = { 
      awaitingInput: undefined 
    };
    
    // Save text if present (text or caption)
    if (actualText) {
      updateData[inputKey] = actualText;
    }
    
    // Save attachments if any
    if (attachments.length > 0) {
      updateData[attachmentsKey] = attachments;
    }
    
    bot.updateUserContext(userId, updateData);

    // Run onDone
    if (awaiting.onDone) {
      await bot.processUserAction(userId, awaiting.onDone);
      if (awaiting.clearInputOnDone) {
        // Clear the specific input key and attachments key
        const clearData: Record<string, any> = { [inputKey]: undefined };
        if (attachments.length > 0) {
          clearData[attachmentsKey] = undefined;
        }
        bot.updateUserContext(userId, clearData);
      }
      return true;
    }

    return false;
  }

  /**
   * Extract attachments from Telegram message with full info
   * Returns array of objects with type, fileId, and additional metadata
   */
  private static extractAttachments(message: any): Array<{
    type: string;
    fileId: string;
    fileUniqueId?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    duration?: number;
  }> {
    const attachments: Array<any> = [];
    
    // Photo - array of sizes, take the largest
    if (message.photo && Array.isArray(message.photo) && message.photo.length > 0) {
      const largestPhoto = message.photo[message.photo.length - 1];
      if (largestPhoto.file_id) {
        attachments.push({
          type: 'photo',
          fileId: largestPhoto.file_id,
          fileUniqueId: largestPhoto.file_unique_id,
          fileSize: largestPhoto.file_size,
          width: largestPhoto.width,
          height: largestPhoto.height
        });
      }
    }
    
    // Document
    if (message.document?.file_id) {
      attachments.push({
        type: 'document',
        fileId: message.document.file_id,
        fileUniqueId: message.document.file_unique_id,
        fileName: message.document.file_name,
        mimeType: message.document.mime_type,
        fileSize: message.document.file_size
      });
    }
    
    // Video
    if (message.video?.file_id) {
      attachments.push({
        type: 'video',
        fileId: message.video.file_id,
        fileUniqueId: message.video.file_unique_id,
        fileName: message.video.file_name,
        mimeType: message.video.mime_type,
        fileSize: message.video.file_size,
        width: message.video.width,
        height: message.video.height,
        duration: message.video.duration
      });
    }
    
    // Audio
    if (message.audio?.file_id) {
      attachments.push({
        type: 'audio',
        fileId: message.audio.file_id,
        fileUniqueId: message.audio.file_unique_id,
        fileName: message.audio.file_name,
        mimeType: message.audio.mime_type,
        fileSize: message.audio.file_size,
        duration: message.audio.duration
      });
    }
    
    // Voice
    if (message.voice?.file_id) {
      attachments.push({
        type: 'voice',
        fileId: message.voice.file_id,
        fileUniqueId: message.voice.file_unique_id,
        mimeType: message.voice.mime_type,
        fileSize: message.voice.file_size,
        duration: message.voice.duration
      });
    }
    
    // Video note (круглые видео)
    if (message.video_note?.file_id) {
      attachments.push({
        type: 'video_note',
        fileId: message.video_note.file_id,
        fileUniqueId: message.video_note.file_unique_id,
        fileSize: message.video_note.file_size,
        duration: message.video_note.duration
      });
    }
    
    // Sticker
    if (message.sticker?.file_id) {
      attachments.push({
        type: 'sticker',
        fileId: message.sticker.file_id,
        fileUniqueId: message.sticker.file_unique_id,
        fileSize: message.sticker.file_size,
        width: message.sticker.width,
        height: message.sticker.height
      });
    }
    
    // Animation (GIF)
    if (message.animation?.file_id) {
      attachments.push({
        type: 'animation',
        fileId: message.animation.file_id,
        fileUniqueId: message.animation.file_unique_id,
        fileName: message.animation.file_name,
        mimeType: message.animation.mime_type,
        fileSize: message.animation.file_size,
        width: message.animation.width,
        height: message.animation.height,
        duration: message.animation.duration
      });
    }
    
    return attachments;
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


