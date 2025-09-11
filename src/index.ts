import { BotFactory, TelegramBotConstructor } from './assembly';
import { ActionRegistry, FunctionRegistry } from './registry';
import { RegistryManager } from './registry/RegistryManager';
import { MultiBotManager } from './core/MultiBotManager';
import { ScenarioLoader } from './core/ScenarioLoader';

// Инициализация регистров
FunctionRegistry.initialize();
ActionRegistry.initialize();
RegistryManager.initialize();

// Re-export основных классов
export { BotFactory, TelegramBotConstructor };
export { ActionRegistry, FunctionRegistry, RegistryManager };
export { MultiBotManager };
export { ScenarioLoader };

// Re-export типов
export * from './types';
export * from './types/PluginInterfaces';
export * from './types/ActionState';

// Re-export утилит
export * from './utils';
