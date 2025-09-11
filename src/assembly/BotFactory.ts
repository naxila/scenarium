import { Scenario, ScenarioConfig } from '../types/Scenario';
import { TelegramBotConstructor } from './TelegramBotConstructor';
import { ScenarioLoader } from '../core/ScenarioLoader';

export class BotFactory {
  /**
   * Создает бота из файла сценария
   */
  static async createBotFromFile(scenarioPath: string, token?: string, botName?: string): Promise<TelegramBotConstructor> {
    console.log(`🚀 Создаем бота из сценария: ${scenarioPath}`);
    
    try {
      const scenario = await ScenarioLoader.loadScenario(scenarioPath);
      console.log(`✅ Сценарий загружен. Menu items:`, Object.keys(scenario.menuItems));
      
      const scenarioConfig: ScenarioConfig = {
        scenario,
        telegramBotToken: token || process.env.TELEGRAM_BOT_TOKEN!
      };
      
      this.validateScenario(scenario);
      return new TelegramBotConstructor(scenarioConfig, botName);
    } catch (error) {
      console.error(`❌ Ошибка создания бота из ${scenarioPath}:`, error);
      throw error;
    }
  }

  /**
   * Создает бота из конфигурации (обратная совместимость)
   */
  static createBot(scenarioConfig: ScenarioConfig, botName?: string): TelegramBotConstructor {
    this.validateScenario(scenarioConfig.scenario);
    return new TelegramBotConstructor(scenarioConfig, botName);
  }

  private static validateScenario(scenario: Scenario): void {
    if (!scenario.menuItems) {
      throw new Error('Scenario must have menuItems');
    }
    
    if (!scenario.onStartActions) {
      throw new Error('Scenario must have onStartActions');
    }
  }
}