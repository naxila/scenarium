import { ICustomAction, ICustomFunction, RegistrationConfig } from '../types/PluginInterfaces';
import { ActionRegistry } from './ActionRegistry';
import { FunctionRegistry } from './FunctionRegistry';

/**
 * Simple manager for registering actions and functions
 * Allows registering actions and functions as "MyAction": MyActionClass
 */
export class RegistryManager {
  private static isInitialized = false;

  /**
   * Initializes the registration manager
   */
  static initialize() {
    if (this.isInitialized) {
      console.warn('RegistryManager already initialized');
      return;
    }

    // Initialize registries if they are not yet initialized
    ActionRegistry.initialize();
    FunctionRegistry.initialize();

    this.isInitialized = true;
    console.log('RegistryManager initialized');
  }

  /**
   * Registers an action
   * @param actionType - action type (e.g., "MyAction")
   * @param actionClass - action class implementing ICustomAction
   * @param config - registration configuration
   */
  static registerAction(actionType: string, actionClass: ICustomAction, config: RegistrationConfig = {}): void {
    if (!this.isInitialized) {
      throw new Error('RegistryManager must be initialized before registering actions');
    }

    if (ActionRegistry.has(actionType) && !config.overwrite) {
      throw new Error(`Action '${actionType}' already registered. Use overwrite: true to replace.`);
    }

    ActionRegistry.registerCustomAction(actionClass, config);
    
    if (config.verbose !== false) {
      console.log(`✅ Registered action: ${actionType}`);
    }
  }

  /**
   * Регистрирует функцию
   * @param functionName - имя функции (например, "MyFunction")
   * @param functionClass - класс функции, реализующий ICustomFunction
   * @param config - конфигурация регистрации
   */
  static registerFunction(functionName: string, functionClass: ICustomFunction, config: RegistrationConfig = {}): void {
    if (!this.isInitialized) {
      throw new Error('RegistryManager must be initialized before registering functions');
    }

    if (FunctionRegistry.has(functionName) && !config.overwrite) {
      throw new Error(`Function '${functionName}' already registered. Use overwrite: true to replace.`);
    }

    FunctionRegistry.registerCustomFunction(functionClass, config);
    
    if (config.verbose !== false) {
      console.log(`✅ Registered function: ${functionName}`);
    }
  }

  /**
   * Регистрирует несколько действий из объекта
   * @param actions - объект с действиями в формате { "ActionName": ActionClass }
   * @param config - конфигурация регистрации
   */
  static registerActions(actions: Record<string, ICustomAction>, config: RegistrationConfig = {}): void {
    for (const [actionType, actionClass] of Object.entries(actions)) {
      this.registerAction(actionType, actionClass, { ...config, verbose: false });
    }
    
    if (config.verbose !== false) {
      console.log(`✅ Registered ${Object.keys(actions).length} actions`);
    }
  }

  /**
   * Регистрирует несколько функций из объекта
   * @param functions - объект с функциями в формате { "FunctionName": FunctionClass }
   * @param config - конфигурация регистрации
   */
  static registerFunctions(functions: Record<string, ICustomFunction>, config: RegistrationConfig = {}): void {
    for (const [functionName, functionClass] of Object.entries(functions)) {
      this.registerFunction(functionName, functionClass, { ...config, verbose: false });
    }
    
    if (config.verbose !== false) {
      console.log(`✅ Registered ${Object.keys(functions).length} functions`);
    }
  }

  /**
   * Удаляет действие
   * @param actionType - тип действия
   */
  static unregisterAction(actionType: string): void {
    if (!this.isInitialized) {
      throw new Error('RegistryManager must be initialized before unregistering actions');
    }

    (ActionRegistry as any).customActions.delete(actionType);
    console.log(`✅ Unregistered action: ${actionType}`);
  }

  /**
   * Удаляет функцию
   * @param functionName - имя функции
   */
  static unregisterFunction(functionName: string): void {
    if (!this.isInitialized) {
      throw new Error('RegistryManager must be initialized before unregistering functions');
    }

    (FunctionRegistry as any).customFunctions.delete(functionName);
    console.log(`✅ Unregistered function: ${functionName}`);
  }

  /**
   * Получает список всех зарегистрированных действий
   */
  static getRegisteredActions(): string[] {
    return ActionRegistry.getRegisteredActions();
  }

  /**
   * Получает список всех зарегистрированных функций
   */
  static getRegisteredFunctions(): string[] {
    return FunctionRegistry.getRegisteredFunctions();
  }

  /**
   * Получает статистику по регистрациям
   */
  static getStats(): {
    totalActions: number;
    totalFunctions: number;
    customActions: number;
    customFunctions: number;
  } {
    const allActions = ActionRegistry.getRegisteredActions();
    const allFunctions = FunctionRegistry.getRegisteredFunctions();
    const standardActions = ['Navigate', 'SendMessage', 'Back', '*', 'RequestInput', 'CancelAwaitingInput', 'RequestApi', 'Store', 'DeleteMessage', 'UpdateMessage'];
    const standardFunctions = ['Equals', 'JoinToString', 'ReadStorage'];

    return {
      totalActions: allActions.length,
      totalFunctions: allFunctions.length,
      customActions: allActions.filter(action => !standardActions.includes(action)).length,
      customFunctions: allFunctions.filter(func => !standardFunctions.includes(func)).length
    };
  }

  /**
   * Проверяет, инициализирован ли менеджер
   */
  static get initialized(): boolean {
    return this.isInitialized;
  }
}
