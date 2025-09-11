import { ProcessingContext, BaseAction } from '../types';
import { BaseActionProcessor } from '../actions/BaseAction';
import { ICustomAction, RegistrationConfig } from '../types/PluginInterfaces';
import { ActionStateManager } from '../core/ActionStateManager';
import * as actionModules from '../actions';

export type ActionExecutor = (action: BaseAction, context: ProcessingContext) => Promise<void>;

export class ActionRegistry {
  private static registry: Map<string, new () => BaseActionProcessor> = new Map();
  private static customActions: Map<string, ICustomAction> = new Map();
  private static stateManager: ActionStateManager = new ActionStateManager();
  private static isInitialized = false;

  static initialize() {
    if (this.isInitialized) {
      console.warn('ActionRegistry already initialized');
      return;
    }
    
    this.autoRegister();
    this.isInitialized = true;
  }

  static autoRegister(): void {
    const { BaseActionProcessor: _, ...actions } = actionModules;
    
    for (const [name, ActionClass] of Object.entries(actions)) {
      if (ActionClass && 
          typeof ActionClass === 'function' && 
          (ActionClass as any).actionType &&
          ActionClass.prototype instanceof BaseActionProcessor) {
        
        this.register((ActionClass as any).actionType, ActionClass as new () => BaseActionProcessor);
        console.log(`Registered action: ${(ActionClass as any).actionType}`);
      }
    }

    // Ensure there is a default processor
    if (!this.registry.has('*')) {
      console.warn('No default action processor registered');
    }
  }

  /**
   * Registers a standard action (inherits from BaseActionProcessor)
   */
  static register(actionType: string, ActionClass: new () => BaseActionProcessor) {
    this.registry.set(actionType, ActionClass);
  }

  /**
   * Регистрирует кастомное действие (реализующее ICustomAction)
   */
  static registerCustomAction(action: ICustomAction, config: RegistrationConfig = {}) {
    if (!this.isInitialized) {
      throw new Error('ActionRegistry must be initialized before registering custom actions');
    }

    if (this.registry.has(action.actionType) && !config.overwrite) {
      throw new Error(`Action '${action.actionType}' already registered. Use overwrite: true to replace.`);
    }

    this.customActions.set(action.actionType, action);
    
    if (config.verbose !== false) {
      console.log(`Registered custom action: ${action.actionType}`);
    }
  }

  static get(actionType: string): (new () => BaseActionProcessor) | undefined {
    const actionClass = this.registry.get(actionType);
    if (actionClass) {
      return actionClass;
    }
    return this.registry.get('*');
  }

  static has(actionType: string): boolean {
    return this.registry.has(actionType) || this.customActions.has(actionType) || this.registry.has('*');
  }

  static getRegisteredActions(): string[] {
    const standardActions = Array.from(this.registry.keys());
    const customActions = Array.from(this.customActions.keys());
    return [...standardActions, ...customActions];
  }

  static async execute(action: BaseAction, context: ProcessingContext): Promise<void> {
    // Сначала проверяем кастомные действия
    const customAction = this.customActions.get(action.action);
    if (customAction) {
      try {
        await customAction.process(action, context);
        return;
      } catch (error) {
        console.error(`Error executing custom action ${action.action}:`, error);
        throw error;
      }
    }

    // Затем стандартные действия
    const ActionClass = this.get(action.action);
    
    if (!ActionClass) {
      console.warn(`No action processor found for: ${action.action}`);
      return;
    }

    try {
      const processor = new ActionClass();
      await processor.process(action, context);
    } catch (error) {
      console.error(`Error executing action ${action.action}:`, error);
      throw error;
    }
  }

  // Методы для управления состоянием действий
  static setActionWaiting(actionId: string, userId: string, botName: string, inputType: string, onInput: Function, onComplete: Function, options?: any): void {
    console.log('🔧 ActionRegistry.setActionWaiting called:', { actionId, userId, botName, inputType });
    this.stateManager.setWaiting(actionId, userId, botName, inputType, onInput, onComplete, options);
    console.log('✅ ActionRegistry.setActionWaiting completed');
  }

  static async processInput(userId: string, botName: string, input: any): Promise<boolean> {
    return await this.stateManager.processInput(userId, botName, input);
  }

  static isActionWaiting(userId: string, botName: string): boolean {
    return this.stateManager.isWaiting(userId, botName) !== null;
  }

  static completeAction(actionId: string): void {
    this.stateManager.complete(actionId);
  }

  static clearActionState(userId: string, botName: string): void {
    this.stateManager.clear(userId, botName);
  }

  static clearAllActions(botName: string): void {
    this.stateManager.clearAll(botName);
  }
}