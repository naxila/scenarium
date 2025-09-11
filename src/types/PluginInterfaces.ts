import { ProcessingContext } from './Context';

/**
 * Interface for custom actions
 * Simple interface for registering actions
 */
export interface ICustomAction {
  /**
   * Unique action type
   */
  readonly actionType: string;

  /**
   * Executes action
   * @param action - action data from scenario
   * @param context - execution context
   */
  process(action: any, context: ProcessingContext): Promise<void>;
}

/**
 * Interface for custom functions
 * Simple interface for registering functions
 */
export interface ICustomFunction {
  /**
   * Unique function name
   */
  readonly functionName: string;

  /**
   * Executes function
   * @param params - function parameters
   * @param context - execution context
   * @returns function execution result
   */
  execute(params: any, context: ProcessingContext): Promise<any>;
}

/**
 * Registration configuration
 */
export interface RegistrationConfig {
  /**
   * Overwrite existing actions/functions
   */
  overwrite?: boolean;

  /**
   * Logging registration operations
   */
  verbose?: boolean;
}
