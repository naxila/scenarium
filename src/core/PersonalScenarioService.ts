import { Scenario } from '../types';

/**
 * Простой сервис для управления персональными сценариями
 * Работает только в памяти, без файловой системы
 * Привязан к конкретному боту
 */
export class PersonalScenarioService {
  private personalScenarios: Map<string, Scenario> = new Map();
  private botName: string;

  constructor(botName: string) {
    this.botName = botName;
  }

  /**
   * Устанавливает персональный сценарий для пользователя
   */
  setPersonalScenario(userId: string, scenario: Scenario): void {
    console.log(`🔍 PersonalScenarioService.setPersonalScenario для пользователя ${userId} в боте ${this.botName}`);
    console.log(`  - До установки: есть ли сценарий? ${this.personalScenarios.has(userId)}`);
    console.log(`  - Размер Map до установки: ${this.personalScenarios.size}`);
    
    this.personalScenarios.set(userId, scenario);
    
    console.log(`  - После установки: есть ли сценарий? ${this.personalScenarios.has(userId)}`);
    console.log(`  - Размер Map после установки: ${this.personalScenarios.size}`);
    console.log(`👤 Персональный сценарий установлен для пользователя ${userId} в боте ${this.botName}`);
  }

  /**
   * Удаляет персональный сценарий пользователя
   */
  removePersonalScenario(userId: string): void {
    console.log(`🔍 PersonalScenarioService.removePersonalScenario для пользователя ${userId} в боте ${this.botName}`);
    console.log(`  - До удаления: есть ли сценарий? ${this.personalScenarios.has(userId)}`);
    console.log(`  - Размер Map до удаления: ${this.personalScenarios.size}`);
    
    const deleted = this.personalScenarios.delete(userId);
    console.log(`  - Результат удаления: ${deleted}`);
    console.log(`  - Размер Map после удаления: ${this.personalScenarios.size}`);
    console.log(`  - После удаления: есть ли сценарий? ${this.personalScenarios.has(userId)}`);
    
    console.log(`🗑️ Персональный сценарий удален для пользователя ${userId} в боте ${this.botName}`);
  }

  /**
   * Получает персональный сценарий пользователя
   */
  getPersonalScenario(userId: string): Scenario | null {
    const scenario = this.personalScenarios.get(userId) || null;
    console.log(`🔍 PersonalScenarioService.getPersonalScenario для пользователя ${userId} в боте ${this.botName}: ${scenario ? 'найден' : 'не найден'}`);
    return scenario;
  }

  /**
   * Проверяет, есть ли персональный сценарий у пользователя
   */
  hasPersonalScenario(userId: string): boolean {
    const hasScenario = this.personalScenarios.has(userId);
    console.log(`🔍 PersonalScenarioService.hasPersonalScenario для пользователя ${userId} в боте ${this.botName}: ${hasScenario}`);
    return hasScenario;
  }

  /**
   * Получает сценарий для пользователя (персональный или дефолтный)
   */
  getScenarioForUser(userId: string, defaultScenario: Scenario): Scenario {
    return this.getPersonalScenario(userId) || defaultScenario;
  }

  /**
   * Очищает все персональные сценарии
   */
  clearAll(): void {
    this.personalScenarios.clear();
    console.log(`🧹 Все персональные сценарии очищены в боте ${this.botName}`);
  }

  /**
   * Получает имя бота
   */
  getBotName(): string {
    return this.botName;
  }
}
