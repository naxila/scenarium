import * as fs from 'fs';
import * as path from 'path';
import { Scenario } from '../types';

export interface ScenarioConfig {
  entryPoint?: string; // Точка входа (по умолчанию: scenario.json)
  modules?: string[];  // Массив папок с модулями: ["api", "user", "settings"]
}

export class ScenarioLoader {
  /**
   * Загружает сценарий из файла или папки
   * @param scenarioPath Путь к файлу .json или папке со сценарием
   * @returns Загруженный сценарий
   */
  static async loadScenario(scenarioPath: string): Promise<Scenario> {
    console.log(`🔍 Загружаем сценарий: ${scenarioPath}`);
    
    try {
      const stats = fs.statSync(scenarioPath);
      console.log(`📁 Тип: ${stats.isFile() ? 'файл' : 'папка'}`);
      
      if (stats.isFile()) {
        // Загружаем из одного файла
        return this.loadFromFile(scenarioPath);
      } else if (stats.isDirectory()) {
        // Загружаем из папки
        return this.loadFromDirectory(scenarioPath);
      } else {
        throw new Error(`Неверный путь к сценарию: ${scenarioPath}`);
      }
    } catch (error) {
      console.error(`❌ Ошибка загрузки сценария ${scenarioPath}:`, error);
      throw error;
    }
  }

  /**
   * Загружает сценарий из одного JSON файла
   */
  private static async loadFromFile(filePath: string): Promise<Scenario> {
    console.log(`📄 Загружаем сценарий из файла: ${filePath}`);
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const scenario = JSON.parse(content);
    
    this.validateScenario(scenario);
    return scenario;
  }

  /**
   * Загружает сценарий из папки с динамической структурой
   */
  private static async loadFromDirectory(dirPath: string): Promise<Scenario> {
    console.log(`📁 Загружаем сценарий из папки: ${dirPath}`);
    
    // Загружаем конфигурацию сценария
    const config = this.loadScenarioConfig(dirPath);
    
    // Загружаем точку входа
    const entryPointPath = path.join(dirPath, config.entryPoint || 'scenario.json');
    const mainScenario = await this.loadFromFile(entryPointPath);
    
    // Загружаем дополнительные компоненты
    const additionalComponents = await this.loadAdditionalComponents(dirPath, config);
    
    // Объединяем все компоненты
    const mergedScenario = this.mergeScenarioComponents(mainScenario, additionalComponents);
    
    this.validateScenario(mergedScenario);
    return mergedScenario;
  }

  /**
   * Загружает конфигурацию сценария из scenario.config.json
   */
  private static loadScenarioConfig(dirPath: string): ScenarioConfig {
    const configPath = path.join(dirPath, 'scenario.config.json');
    
    if (fs.existsSync(configPath)) {
      console.log(`⚙️ Загружаем конфигурацию: ${configPath}`);
      const content = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(content);
    }
    
    // Возвращаем конфигурацию по умолчанию
    return {
      entryPoint: 'scenario.json',
      modules: ['modules']
    };
  }

  /**
   * Загружает дополнительные компоненты сценария
   */
  private static async loadAdditionalComponents(dirPath: string, config: ScenarioConfig): Promise<Partial<Scenario>> {
    const components: Partial<Scenario> = {
      menuItems: {},
      functions: {}
    };
    
    // Загружаем модули из массива папок
    if (config.modules && Array.isArray(config.modules)) {
      for (const modulePath of config.modules) {
        const fullModulePath = path.join(dirPath, modulePath);
        if (fs.existsSync(fullModulePath)) {
          console.log(`📁 Загружаем модуль из: ${fullModulePath}`);
          const moduleData = await this.loadBusinessModules(fullModulePath);
          components.menuItems = { ...components.menuItems, ...moduleData.menuItems };
          components.functions = { ...components.functions, ...moduleData.functions };
          // Добавляем данные модулей в общий контекст
          Object.assign(components, moduleData.data);
        } else {
          console.warn(`⚠️ Папка модуля не найдена: ${fullModulePath}`);
        }
      }
    }
    
    return components;
  }

  /**
   * Загружает бизнес-модули из папки
   */
  private static async loadBusinessModules(modulesPath: string): Promise<{ menuItems: Record<string, any>, functions: Record<string, any>, data: Record<string, any> }> {
    
    const menuItems: Record<string, any> = {};
    const functions: Record<string, any> = {};
    const data: Record<string, any> = {};
    const files = fs.readdirSync(modulesPath);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(modulesPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const moduleData = JSON.parse(content);
        
        // Загружаем menu items из модуля
        if (moduleData.menuItems) {
          Object.assign(menuItems, moduleData.menuItems);
        }
        
        // Загружаем функции из модуля
        if (moduleData.functions) {
          Object.assign(functions, moduleData.functions);
        }
        
        // Загружаем данные из модуля (если есть)
        if (moduleData.data) {
          Object.assign(data, moduleData.data);
        }
      }
    }
    
    return { menuItems, functions, data };
  }


  /**
   * Объединяет компоненты сценария
   */
  private static mergeScenarioComponents(mainScenario: Scenario, additionalComponents: Partial<Scenario>): Scenario {
    // Создаем базовый объект с основными свойствами
    const merged = {
      ...mainScenario,
      menuItems: {
        ...mainScenario.menuItems,
        ...additionalComponents.menuItems
      },
      functions: {
        ...mainScenario.functions,
        ...additionalComponents.functions
      }
    };
    
    // Добавляем все дополнительные данные из модулей
    const dataKeys = Object.keys(additionalComponents).filter(k => k !== 'menuItems' && k !== 'functions');
    
    
    // Создаем объект с дополнительными данными
    const additionalData: Record<string, any> = {};
    for (const key of dataKeys) {
      additionalData[key] = (additionalComponents as any)[key];
    }
    
    // Объединяем все данные
    return Object.assign(merged, additionalData) as Scenario;
  }

  /**
   * Валидирует структуру сценария
   */
  private static validateScenario(scenario: any): void {
    if (!scenario.menuItems) {
      throw new Error('Сценарий должен содержать menuItems');
    }
    
    console.log(`✅ Сценарий валиден. Menu items: ${Object.keys(scenario.menuItems).length}, Functions: ${Object.keys(scenario.functions || {}).length}`);
  }
}
