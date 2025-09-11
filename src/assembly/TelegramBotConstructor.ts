import { ScenarioConfig } from '../types/Scenario';
import { BotInstance } from '../core/BotInstance';
import { FunctionRegistry } from '../registry/FunctionRegistry';
import { TelegramAdapter } from '../telegram/TelegramAdapter';
import { ActionProcessor } from '../core/ActionProcessor';

export class TelegramBotConstructor {
  private botInstance: BotInstance;
  private adapter: TelegramAdapter | null = null;
  private isRunning = false;
  private token: string;
  private botName: string;

  constructor(config: ScenarioConfig, botName?: string) {
    FunctionRegistry.initialize();
    this.token = config.telegramBotToken || '';
    this.botName = botName || 'unknown';
    
    // Создаем BotInstance с передачей себя как botConstructor и имени бота
    this.botInstance = new BotInstance(config.scenario, config.sessionTimeout, this, this.botName);
  }

  async startForUser(userId: string): Promise<void> {
    const scenario = this.botInstance.getScenario();
    await this.botInstance.processForUser(userId, scenario.onStartActions);
  }

  async processUserAction(userId: string, action: any): Promise<void> {
    await this.botInstance.processForUser(userId, action);
  }

  getUserContext(userId: string): any {
    const userContext = this.botInstance.getSessionManager().getUserContext(userId);
    return userContext ? userContext.data : {};
  }

  getScenario(): any {
    return this.botInstance.getScenario();
  }

  getAdapter(): TelegramAdapter | null {
    return this.adapter;
  }

  getBotInstance(): BotInstance {
    return this.botInstance;
  }

  getActionProcessor(): ActionProcessor {
    return this.botInstance.getActionProcessor();
  }

  getBot(): any {
    return this.adapter?.getBot?.() || null;
  }

  getChatId(userId: string): string {
    return userId;
  }

  updateUserContext(userId: string, updates: Record<string, any>): void {
    const sessionManager = this.botInstance.getSessionManager();
    
    // Получаем текущий контекст
    const userContext = sessionManager.getUserContext(userId);
    
    if (userContext) {
      console.log(`💾 Updating context for ${userId}:`, {
        currentData: userContext.data,
        newUpdates: updates
      });
      
      // Мержим данные правильно - все updates идут в data
      userContext.data = { ...userContext.data, ...updates };
      userContext.lastActivity = new Date();
      
      // Сохраняем обратно
      sessionManager.updateUserContext(userId, userContext);
      
      console.log(`✅ Context updated successfully:`, userContext.data);
    } else {
      console.log(`❌ User ${userId} context not found`);
      
      // Создаем новый контекст если не существует
      const newContext = {
        userId: userId,
        data: updates, // Все updates становятся data
        backStack: [],
        createdAt: new Date(),
        lastActivity: new Date()
      };
      
      sessionManager.updateUserContext(userId, newContext);
    }
  }


  /**
   * Запускает бота
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️ Bot is already running');
      return;
    }

    this.adapter = new TelegramAdapter(
      this.token,
      this,
      this.botName
    );
    
    this.isRunning = true;
    console.log('✅ Bot started successfully');
  }

  /**
   * Останавливает бота
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.warn('⚠️ Bot is not running');
      return;
    }

    if (this.adapter) {
      // Останавливаем адаптер если есть метод stop
      if (typeof (this.adapter as any).stop === 'function') {
        await (this.adapter as any).stop();
      }
      this.adapter = null;
    }

    this.isRunning = false;
    console.log('✅ Bot stopped successfully');
  }

  /**
   * Проверяет, запущен ли бот
   */
  isBotRunning(): boolean {
    return this.isRunning;
  }

  dispose(): void {
    this.botInstance.dispose();
  }
}