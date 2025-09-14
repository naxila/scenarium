import { ScenarioConfig } from '../types/Scenario';
import { BotInstance } from '../core/BotInstance';
import { FunctionRegistry } from '../registry/FunctionRegistry';
import { TelegramAdapter, AnalyticsCallbacks } from '../telegram/TelegramAdapter';
import { ActionProcessor } from '../core/ActionProcessor';

export class TelegramBotConstructor {
  private botInstance: BotInstance;
  private adapter: TelegramAdapter | null = null;
  private isRunning = false;
  private token: string;
  private botName: string;
  private analyticsCallbacks?: AnalyticsCallbacks;

  constructor(config: ScenarioConfig, botName?: string, analyticsCallbacks?: AnalyticsCallbacks) {
    FunctionRegistry.initialize();
    this.token = config.telegramBotToken || '';
    this.botName = botName || 'unknown';
    this.analyticsCallbacks = analyticsCallbacks;
    
    // Create BotInstance with self as botConstructor and bot name
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
    
    // Get current context
    const userContext = sessionManager.getUserContext(userId);
    
    if (userContext) {
      console.log(`💾 Updating context for ${userId}:`, {
        currentData: userContext.data,
        newUpdates: updates
      });
      
      // Merge data correctly - all updates go to data
      userContext.data = { ...userContext.data, ...updates };
      userContext.lastActivity = new Date();
      
      // Save back
      sessionManager.updateUserContext(userId, userContext);
      
      console.log(`✅ Context updated successfully:`, userContext.data);
    } else {
      console.log(`❌ User ${userId} context not found`);
      
      // Create new context if it doesn't exist
      const newContext = {
        userId: userId,
        data: updates, // All updates become data
        backStack: [],
        createdAt: new Date(),
        lastActivity: new Date()
      };
      
      sessionManager.updateUserContext(userId, newContext);
    }
  }


  /**
   * Starts the bot
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️ Bot is already running');
      return;
    }

    this.adapter = new TelegramAdapter(
      this.token,
      this,
      this.botName,
      this.analyticsCallbacks
    );
    
    this.isRunning = true;
    console.log('✅ Bot started successfully');
  }

  /**
   * Stops the bot
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.warn('⚠️ Bot is not running');
      return;
    }

    if (this.adapter) {
      // Stop adapter if stop method exists
      if (typeof (this.adapter as any).stop === 'function') {
        await (this.adapter as any).stop();
      }
      this.adapter = null;
    }

    this.isRunning = false;
    console.log('✅ Bot stopped successfully');
  }

  /**
   * Checks if the bot is running
   */
  isBotRunning(): boolean {
    return this.isRunning;
  }

  dispose(): void {
    this.botInstance.dispose();
  }
}