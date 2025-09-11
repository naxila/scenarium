import { Scenario, UserContext, ProcessingContext } from '../types';
import { UserSessionManager } from './UserSessionManager';
import { ActionProcessor } from './ActionProcessor';

export class BotInstance {
  private scenario: Scenario;
  private sessionManager: UserSessionManager;
  private scenarioContext: Record<string, any> = {};
  private actionProcessor: ActionProcessor;
  private botName: string;
  private botConstructor: any;

  constructor(scenario: Scenario, sessionTimeout?: number, botConstructor?: any, botName?: string) {
    this.scenario = scenario;
    this.sessionManager = new UserSessionManager(sessionTimeout);
    this.botName = botName || 'unknown';
    this.botConstructor = botConstructor;
    
    // Initialize scenarioContext with data from scenario
    this.initializeScenarioContext();
    
    // Create ActionProcessor instance for this bot
    this.actionProcessor = ActionProcessor.initialize(this, botConstructor);
  }

  private initializeScenarioContext(): void {
    // Add all scenario properties except standard ones to scenarioContext
    const standardProps = ['onStartActions', 'menuItems', 'functions'];
    for (const [key, value] of Object.entries(this.scenario)) {
      if (!standardProps.includes(key)) {
        this.scenarioContext[key] = value;
      }
    }
  }

  getScenario(): Scenario {
    return this.scenario;
  }

  getScenarioContext(): Record<string, any> {
    return this.scenarioContext;
  }

  getSessionManager(): UserSessionManager {
    return this.sessionManager;
  }

  getActionProcessor(): ActionProcessor {
    return this.actionProcessor;
  }

  updateScenario(newScenario: Scenario): void {
    this.scenario = newScenario;
    console.log('✅ Scenario updated in BotInstance');
  }

  updateScenarioContext(updates: Record<string, any>): void {
    Object.assign(this.scenarioContext, updates);
  }

  async processForUser(userId: string, actions: any, localContext: Record<string, any> = {}): Promise<void> {
    const userContext = this.sessionManager.getOrCreateUserContext(userId);
    
    // Update userContext with data from localContext if provided
    if (localContext && Object.keys(localContext).length > 0) {
      userContext.data = { ...userContext.data, ...localContext };
      userContext.lastActivity = new Date();
    }
    
    console.log(`👤 Processing for user ${userId}, current menu: ${userContext.currentMenu || 'none'}`);
    console.log(`📚 Back stack: ${JSON.stringify(userContext.backStack)}`);
    
    const processingContext: ProcessingContext = {
      userContext,
      scenarioContext: this.scenarioContext,
      localContext,
      scenario: this.scenario,
      actionProcessor: this.actionProcessor,
      bot: this.botConstructor?.getBot?.() || null,
      chatId: userId,
      botInstance: this
    };
  
    await this.actionProcessor.processActions(actions, processingContext);
  }

  async executeUserFunctionForUser(
    userId: string, 
    funcName: string, 
    params: Record<string, any> = {}, 
    localContext: Record<string, any> = {}
  ): Promise<any> {
    const userContext = this.sessionManager.getOrCreateUserContext(userId);
    
    const processingContext: ProcessingContext = {
      userContext,
      scenarioContext: this.scenarioContext,
      localContext,
      scenario: this.scenario,
      actionProcessor: this.actionProcessor,
      bot: this.botConstructor?.getBot?.() || null,
      chatId: userId,
      botInstance: this
    };

    return await this.actionProcessor.executeUserFunction(funcName, params, processingContext);
  }

  getUserContext(userId: string): any {
    const userContext = this.sessionManager.getUserContext(userId);
    return userContext ? userContext.data : {};
  }

  updateUserContext(userId: string, updates: Record<string, any>): void {
    const sessionManager = this.sessionManager;
    
    // Get current context
    const userContext = sessionManager.getUserContext(userId);
    
    if (userContext) {
      // Merge data correctly - all updates go to data
      userContext.data = { ...userContext.data, ...updates };
      userContext.lastActivity = new Date();
      
      // Save back
      sessionManager.updateUserContext(userId, userContext);
    } else {
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

  async processUserAction(userId: string, action: any): Promise<void> {
    await this.processForUser(userId, action);
  }

  dispose(): void {
    this.sessionManager.dispose();
  }
}