import { TelegramBotConstructor } from '../assembly/TelegramBotConstructor';
import { BotFactory } from '../assembly/BotFactory';
import { FunctionRegistry } from '../registry/FunctionRegistry';
import { ActionRegistry } from '../registry/ActionRegistry';

export interface BotConfig {
  name: string;
  token: string;
  scenarioPath: string;
  enabled?: boolean;
}

export interface MultiBotConfig {
  bots: BotConfig[];
  globalSettings?: {
    sessionTimeout?: number;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
  };
}

export class MultiBotManager {
  private bots: Map<string, TelegramBotConstructor> = new Map();
  private _config: MultiBotConfig;
  private isInitialized = false;

  constructor(config: MultiBotConfig) {
    this._config = config;
  }

  /**
   * Initializes manager and all bots
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('⚠️ MultiBotManager already initialized');
      return;
    }

    console.log('🚀 Initializing MultiBotManager...');
    
    // Initialize registries (once for all bots)
    FunctionRegistry.initialize();
    ActionRegistry.initialize();

    // Initialize bots
    for (const botConfig of this._config.bots) {
      if (botConfig.enabled !== false) {
        await this.initializeBot(botConfig);
      } else {
        console.log(`⏸️ Bot '${botConfig.name}' is disabled`);
      }
    }

    this.isInitialized = true;
    console.log(`✅ MultiBotManager initialized with ${this.bots.size} bots`);
  }

  /**
   * Инициализирует отдельного бота
   */
  private async initializeBot(botConfig: BotConfig): Promise<void> {
    try {
      console.log(`🤖 Initializing bot: ${botConfig.name}`);
      
      // Создаем бота из сценария с токеном и именем
      const bot = await BotFactory.createBotFromFile(botConfig.scenarioPath, botConfig.token, botConfig.name);
      
      // Сохраняем бота
      this.bots.set(botConfig.name, bot);
      
      console.log(`✅ Bot '${botConfig.name}' initialized successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to initialize bot '${botConfig.name}':`, error);
      throw error;
    }
  }

  /**
   * Запускает всех ботов
   */
  async startAll(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MultiBotManager not initialized. Call initialize() first.');
    }

    console.log('🚀 Starting all bots...');
    
    const startPromises = Array.from(this.bots.entries()).map(async ([name, bot]) => {
      try {
        await bot.start();
        console.log(`✅ Bot '${name}' started successfully`);
      } catch (error) {
        console.error(`❌ Failed to start bot '${name}':`, error);
        throw error;
      }
    });

    await Promise.all(startPromises);
    console.log('🎉 All bots started successfully');
  }

  /**
   * Останавливает всех ботов
   */
  async stopAll(): Promise<void> {
    console.log('🛑 Stopping all bots...');
    
    const stopPromises = Array.from(this.bots.entries()).map(async ([name, bot]) => {
      try {
        await bot.stop();
        console.log(`✅ Bot '${name}' stopped successfully`);
      } catch (error) {
        console.error(`❌ Failed to stop bot '${name}':`, error);
      }
    });

    await Promise.all(stopPromises);
    console.log('✅ All bots stopped');
  }

  /**
   * Запускает конкретного бота
   */
  async startBot(botName: string): Promise<void> {
    const bot = this.bots.get(botName);
    if (!bot) {
      throw new Error(`Bot '${botName}' not found`);
    }

    await bot.start();
    console.log(`✅ Bot '${botName}' started`);
  }

  /**
   * Останавливает конкретного бота
   */
  async stopBot(botName: string): Promise<void> {
    const bot = this.bots.get(botName);
    if (!bot) {
      throw new Error(`Bot '${botName}' not found`);
    }

    await bot.stop();
    console.log(`✅ Bot '${botName}' stopped`);
  }

  /**
   * Получает информацию о всех ботах
   */
  getBotsInfo(): Array<{ name: string; status: string; scenarioPath: string }> {
    return Array.from(this.bots.entries()).map(([name, bot]) => ({
      name,
      status: bot.isBotRunning() ? 'running' : 'stopped',
      scenarioPath: this._config.bots.find(b => b.name === name)?.scenarioPath || ''
    }));
  }

  /**
   * Получает конкретного бота
   */
  getBot(botName: string): TelegramBotConstructor | undefined {
    return this.bots.get(botName);
  }

  /**
   * Получает BotInstance конкретного бота
   */
  getBotInstance(botName: string): any {
    const bot = this.bots.get(botName);
    return bot?.getBotInstance?.() || null;
  }

  /**
   * Проверяет, инициализирован ли менеджер
   */
  isManagerInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Получает количество активных ботов
   */
  getActiveBotsCount(): number {
    return this.bots.size;
  }

  /**
   * Получает конфигурацию менеджера
   */
  get config(): MultiBotConfig {
    return this._config;
  }
}
