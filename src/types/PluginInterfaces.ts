import { ProcessingContext } from './Context';

/**
 * Интерфейс для кастомных действий
 * Простой интерфейс для регистрации действий
 */
export interface ICustomAction {
  /**
   * Уникальный тип действия
   */
  readonly actionType: string;

  /**
   * Выполняет действие
   * @param action - данные действия из сценария
   * @param context - контекст выполнения
   */
  process(action: any, context: ProcessingContext): Promise<void>;
}

/**
 * Интерфейс для кастомных функций
 * Простой интерфейс для регистрации функций
 */
export interface ICustomFunction {
  /**
   * Уникальное имя функции
   */
  readonly functionName: string;

  /**
   * Выполняет функцию
   * @param params - параметры функции
   * @param context - контекст выполнения
   * @returns результат выполнения функции
   */
  execute(params: any, context: ProcessingContext): Promise<any>;
}

/**
 * Конфигурация для регистрации
 */
export interface RegistrationConfig {
  /**
   * Перезаписать существующие действия/функции
   */
  overwrite?: boolean;

  /**
   * Логирование операций регистрации
   */
  verbose?: boolean;
}
