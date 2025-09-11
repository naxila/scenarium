import * as fs from 'fs';
import * as path from 'path';
import { Scenario } from '../types';

export interface ScenarioConfig {
  entryPoint?: string; // Entry point (default: scenario.json)
  modules?: string[];  // Array of module folders: ["api", "user", "settings"]
}

export class ScenarioLoader {
  /**
   * Loads a scenario from a file or folder
   * @param scenarioPath Path to .json file or scenario folder
   * @returns Loaded scenario
   */
  static async loadScenario(scenarioPath: string): Promise<Scenario> {
    console.log(`🔍 Loading scenario: ${scenarioPath}`);
    
    try {
      const stats = fs.statSync(scenarioPath);
      console.log(`📁 Type: ${stats.isFile() ? 'file' : 'folder'}`);
      
      if (stats.isFile()) {
        // Load from single file
        return this.loadFromFile(scenarioPath);
      } else if (stats.isDirectory()) {
        // Load from folder
        return this.loadFromDirectory(scenarioPath);
      } else {
        throw new Error(`Invalid scenario path: ${scenarioPath}`);
      }
    } catch (error) {
      console.error(`❌ Error loading scenario ${scenarioPath}:`, error);
      throw error;
    }
  }

  /**
   * Loads a scenario from a single JSON file
   */
  private static async loadFromFile(filePath: string): Promise<Scenario> {
    console.log(`📄 Loading scenario from file: ${filePath}`);
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const scenario = JSON.parse(content);
    
    this.validateScenario(scenario);
    return scenario;
  }

  /**
   * Loads a scenario from a folder with dynamic structure
   */
  private static async loadFromDirectory(dirPath: string): Promise<Scenario> {
    console.log(`📁 Loading scenario from folder: ${dirPath}`);
    
    // Load scenario configuration
    const config = this.loadScenarioConfig(dirPath);
    
    // Load entry point
    const entryPointPath = path.join(dirPath, config.entryPoint || 'scenario.json');
    const mainScenario = await this.loadFromFile(entryPointPath);
    
    // Load additional components
    const additionalComponents = await this.loadAdditionalComponents(dirPath, config);
    
    // Merge all components
    const mergedScenario = this.mergeScenarioComponents(mainScenario, additionalComponents);
    
    this.validateScenario(mergedScenario);
    return mergedScenario;
  }

  /**
   * Loads scenario configuration from scenario.config.json
   */
  private static loadScenarioConfig(dirPath: string): ScenarioConfig {
    const configPath = path.join(dirPath, 'scenario.config.json');
    
    if (fs.existsSync(configPath)) {
      console.log(`⚙️ Loading configuration: ${configPath}`);
      const content = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(content);
    }
    
    // Return default configuration
    return {
      entryPoint: 'scenario.json',
      modules: ['modules']
    };
  }

  /**
   * Loads additional scenario components
   */
  private static async loadAdditionalComponents(dirPath: string, config: ScenarioConfig): Promise<Partial<Scenario>> {
    const components: Partial<Scenario> = {
      menuItems: {},
      functions: {}
    };
    
    // Load modules from array of folders
    if (config.modules && Array.isArray(config.modules)) {
      for (const modulePath of config.modules) {
        const fullModulePath = path.join(dirPath, modulePath);
        if (fs.existsSync(fullModulePath)) {
          console.log(`📁 Loading module from: ${fullModulePath}`);
          const moduleData = await this.loadBusinessModules(fullModulePath);
          components.menuItems = { ...components.menuItems, ...moduleData.menuItems };
          components.functions = { ...components.functions, ...moduleData.functions };
          // Add module data to common context
          Object.assign(components, moduleData.data);
        } else {
          console.warn(`⚠️ Module folder not found: ${fullModulePath}`);
        }
      }
    }
    
    return components;
  }

  /**
   * Loads business modules from folder
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
        
        // Load menu items from module
        if (moduleData.menuItems) {
          Object.assign(menuItems, moduleData.menuItems);
        }
        
        // Load functions from module
        if (moduleData.functions) {
          Object.assign(functions, moduleData.functions);
        }
        
        // Load data from module (if exists)
        if (moduleData.data) {
          Object.assign(data, moduleData.data);
        }
      }
    }
    
    return { menuItems, functions, data };
  }


  /**
   * Merges scenario components
   */
  private static mergeScenarioComponents(mainScenario: Scenario, additionalComponents: Partial<Scenario>): Scenario {
    // Create base object with main properties
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
    
    // Add all additional data from modules
    const dataKeys = Object.keys(additionalComponents).filter(k => k !== 'menuItems' && k !== 'functions');
    
    
    // Create object with additional data
    const additionalData: Record<string, any> = {};
    for (const key of dataKeys) {
      additionalData[key] = (additionalComponents as any)[key];
    }
    
    // Merge all data
    return Object.assign(merged, additionalData) as Scenario;
  }

  /**
   * Validates scenario structure
   */
  private static validateScenario(scenario: any): void {
    if (!scenario.menuItems) {
      throw new Error('Scenario must contain menuItems');
    }
    
    console.log(`✅ Scenario is valid. Menu items: ${Object.keys(scenario.menuItems).length}, Functions: ${Object.keys(scenario.functions || {}).length}`);
  }
}
