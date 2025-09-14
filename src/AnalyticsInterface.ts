import { BotFactory, TelegramBotConstructor } from './assembly';
import { ScenarioConfig } from './types/Scenario';

export interface AnalyticsEventCallbacks {
  onMessageReceived?: (userId: string, message: string, messageData: any) => void;
  onMessageSent?: (userId: string, message: string, messageData: any) => void;
  onUserStarted?: (userId: string, userData: any) => void;
  onUserAction?: (userId: string, action: string, actionData: any) => void;
  onError?: (error: Error, context: any) => void;
}

export interface AnalyticsBotConfig {
  token: string;
  scenario: any;
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

    this.bot = BotFactory.createBot(scenarioConfig, config.botName, this.callbacks);
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
      console.error('❌ AnalyticsInterface.start - ошибка запуска:', error);
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
      console.error('❌ AnalyticsInterface.stop - ошибка остановки:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error as Error, { action: 'stop' });
      }
      throw error;
    }
  }

  isBotRunning(): boolean {
    return this.isRunning;
  }

  getBot(): TelegramBotConstructor {
    return this.bot;
  }
}