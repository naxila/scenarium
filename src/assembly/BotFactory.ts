import { Scenario, ScenarioConfig } from '../types/Scenario';
import { TelegramBotConstructor } from './TelegramBotConstructor';
import { ScenarioLoader } from '../core/ScenarioLoader';
import { AnalyticsCallbacks } from '../telegram/TelegramAdapter';

export class BotFactory {
  /**
   * Creates a bot from a scenario file
   */
  static async createBotFromFile(scenarioPath: string, token?: string, botName?: string): Promise<TelegramBotConstructor> {
    console.log(`🚀 Creating bot from scenario: ${scenarioPath}`);
    
    try {
      const scenario = await ScenarioLoader.loadScenario(scenarioPath);
      console.log(`✅ Scenario loaded. Menu items:`, Object.keys(scenario.menuItems));
      
      const scenarioConfig: ScenarioConfig = {
        scenario,
        telegramBotToken: token || process.env.TELEGRAM_BOT_TOKEN!
      };
      
      this.validateScenario(scenario);
      return new TelegramBotConstructor(scenarioConfig, botName);
    } catch (error) {
      console.error(`❌ Error creating bot from ${scenarioPath}:`, error);
      throw error;
    }
  }

  /**
   * Creates a bot from configuration (backward compatibility)
   */
  static createBot(scenarioConfig: ScenarioConfig, botName?: string, analyticsCallbacks?: AnalyticsCallbacks): TelegramBotConstructor {
    this.validateScenario(scenarioConfig.scenario);
    return new TelegramBotConstructor(scenarioConfig, botName, analyticsCallbacks);
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