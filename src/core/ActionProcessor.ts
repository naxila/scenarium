import { Action, ProcessingContext } from '../types';
import { normalizeActions } from '../utils/actionNormalizer';
import { ActionRegistry } from '../registry/ActionRegistry';
import { BotInstance } from './BotInstance';

export class ActionProcessor {
  private botInstance: BotInstance;
  private botConstructor: any;

  constructor(botInstance: BotInstance, botConstructor?: any) {
    this.botInstance = botInstance;
    this.botConstructor = botConstructor;
  }

  static initialize(botInstance: BotInstance, botConstructor?: any) {
    // Create instance for specific bot
    return new ActionProcessor(botInstance, botConstructor);
  }

  getScenario() {
    return this.botInstance.getScenario();
  }

  getBotInstance(): BotInstance {
    return this.botInstance;
  }

  getBotConstructor(): any {
    return this.botConstructor;
  }

  async processActions(actions: Action | Action[], context: ProcessingContext): Promise<void> {
    const normalizedActions = normalizeActions(actions);
    
    for (const action of normalizedActions) {
      await this.processSingleAction(action, context);
    }
  }

  private async processSingleAction(action: Action, context: ProcessingContext): Promise<void> {
    try {
      await ActionRegistry.execute(action, context);
    } catch (error) {
      console.error(`Error processing action ${action.action}:`, error);
      throw error;
    }
  }

  async executeUserFunction(
    funcName: string, 
    params: Record<string, any>, 
    context: ProcessingContext
  ): Promise<any> {
    const functionProcessor = await import('./FunctionProcessor');
    return await functionProcessor.FunctionProcessor.executeUserFunction(funcName, params, context);
  }
}