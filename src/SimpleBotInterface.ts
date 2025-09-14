import { BotFactory, TelegramBotConstructor } from './assembly';
import { Scenario, ScenarioConfig } from './types/Scenario';

export interface AnalyticsEventCallbacks {
  onMessageReceived?: (userId: string, message: string, messageData: any) => void;
  onMessageSent?: (userId: string, message: string, messageData: any) => void;
  onUserStarted?: (userId: string, userData: any) => void;
  onUserAction?: (userId: string, action: string, actionData: any) => void;
  onError?: (error: Error, context?: any) => void;
}

export interface AnalyticsBotConfig {
  token: string;
  scenario: Scenario;
  botName?: string;
  callbacks?: AnalyticsEventCallbacks;
}

export class AnalyticsInterface {
  private bot: TelegramBotConstructor;
  private callbacks: AnalyticsEventCallbacks;
  private isRunning = false;

  constructor(config: AnalyticsBotConfig) {
    this.callbacks = config.callbacks || {};
    
    const scenarioConfig: ScenarioConfig = {
      scenario: config.scenario,
      telegramBotToken: config.token
    };

    this.bot = BotFactory.createBot(scenarioConfig, config.botName);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Получаем экземпляр бота для перехвата событий
    const adapter = this.bot.getAdapter();
    if (adapter) {
      const telegramBot = adapter.getBot();
      
      if (telegramBot) {
        // Перехватываем входящие сообщения
        telegramBot.on('message', (msg) => {
          const userId = msg.chat.id.toString();
          const message = msg.text || '';
          
          if (this.callbacks.onMessageReceived) {
            this.callbacks.onMessageReceived(userId, message, msg);
          }
        });

        // Перехватываем callback queries
        telegramBot.on('callback_query', (query) => {
          const userId = query.message?.chat.id.toString();
          const action = query.data || '';
          
          if (userId && this.callbacks.onUserAction) {
            this.callbacks.onUserAction(userId, action, query);
          }
        });

        // Перехватываем ошибки
        telegramBot.on('error', (error) => {
          if (this.callbacks.onError) {
            this.callbacks.onError(error);
          }
        });

        telegramBot.on('polling_error', (error) => {
          if (this.callbacks.onError) {
            this.callbacks.onError(error, { type: 'polling' });
          }
        });
      }
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️ Bot is already running');
      return;
    }

    try {
      await this.bot.start();
      this.isRunning = true;
      console.log('✅ AnalyticsInterface started successfully');
    } catch (error) {
      if (this.callbacks.onError) {
        this.callbacks.onError(error as Error, { action: 'start' });
      }
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.warn('⚠️ Bot is not running');
      return;
    }

    try {
      await this.bot.stop();
      this.isRunning = false;
      console.log('✅ AnalyticsInterface stopped successfully');
    } catch (error) {
      if (this.callbacks.onError) {
        this.callbacks.onError(error as Error, { action: 'stop' });
      }
      throw error;
    }
  }

  isBotRunning(): boolean {
    return this.isRunning;
  }

  // Метод для отправки сообщения (с коллбеком)
  async sendMessage(userId: string, text: string, options?: any): Promise<any> {
    try {
      const adapter = this.bot.getAdapter();
      if (!adapter) {
        throw new Error('Bot adapter not available');
      }

      const result = await adapter.sendMessage(userId, text, options);
      
      if (this.callbacks.onMessageSent) {
        this.callbacks.onMessageSent(userId, text, { result, options });
      }

      return result;
    } catch (error) {
      if (this.callbacks.onError) {
        this.callbacks.onError(error as Error, { action: 'sendMessage', userId, text });
      }
      throw error;
    }
  }

  // Получение контекста пользователя
  getUserContext(userId: string): any {
    return this.bot.getUserContext(userId);
  }

  // Обновление контекста пользователя
  updateUserContext(userId: string, updates: Record<string, any>): void {
    this.bot.updateUserContext(userId, updates);
  }

  // Получение сценария
  getScenario(): Scenario {
    return this.bot.getScenario();
  }

  // Обработка пользовательского действия
  async processUserAction(userId: string, action: any): Promise<void> {
    try {
      await this.bot.processUserAction(userId, action);
    } catch (error) {
      if (this.callbacks.onError) {
        this.callbacks.onError(error as Error, { action: 'processUserAction', userId, actionData: action });
      }
      throw error;
    }
  }
}
