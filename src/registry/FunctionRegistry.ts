import { EqualsFunction } from '../functions/EqualsFunction';
import { JoinToStringFunction } from '../functions/JoinToStringFunction';
import { ReadStorageFunction } from '../functions/ReadStorageFunction';
import { ProcessingContext } from '../types';
import { ICustomFunction, RegistrationConfig } from '../types/PluginInterfaces';

type FunctionExecutor = (params: any, context: ProcessingContext) => Promise<any>;

export class FunctionRegistry {
  private static registry: Map<string, FunctionExecutor> = new Map();
  private static customFunctions: Map<string, ICustomFunction> = new Map();
  private static isInitialized = false;

  static initialize() {
    if (this.isInitialized) {
      console.warn('FunctionRegistry already initialized');
      return;
    }

    this.register('Equals', EqualsFunction.execute);
    this.register('JoinToString', JoinToStringFunction.execute);
    this.register('ReadStorage', ReadStorageFunction.execute);
    
    this.isInitialized = true;
    console.log('FunctionRegistry initialized with standard functions');
  }

  /**
   * Registers a standard function
   */
  static register(name: string, func: FunctionExecutor) {
    this.registry.set(name, func);
  }

  /**
   * Registers a custom function (implementing ICustomFunction)
   */
  static registerCustomFunction(func: ICustomFunction, config: RegistrationConfig = {}) {
    if (!this.isInitialized) {
      throw new Error('FunctionRegistry must be initialized before registering custom functions');
    }

    if (this.registry.has(func.functionName) && !config.overwrite) {
      throw new Error(`Function '${func.functionName}' already registered. Use overwrite: true to replace.`);
    }

    this.customFunctions.set(func.functionName, func);
    
    if (config.verbose !== false) {
      console.log(`Registered custom function: ${func.functionName}`);
    }
  }

  static get(name: string): FunctionExecutor | undefined {
    // Сначала проверяем кастомные функции
    const customFunction = this.customFunctions.get(name);
    if (customFunction) {
      return customFunction.execute.bind(customFunction);
    }

    // Затем стандартные функции
    return this.registry.get(name);
  }

  static has(name: string): boolean {
    return this.registry.has(name) || this.customFunctions.has(name);
  }

  static getRegisteredFunctions(): string[] {
    const standardFunctions = Array.from(this.registry.keys());
    const customFunctions = Array.from(this.customFunctions.keys());
    return [...standardFunctions, ...customFunctions];
  }
}