import { BotFactory, TelegramBotConstructor } from './assembly';
import { ActionRegistry, FunctionRegistry } from './registry';
import { RegistryManager } from './registry/RegistryManager';
import { MultiBotManager } from './core/MultiBotManager';

// Инициализация регистров
FunctionRegistry.initialize();
ActionRegistry.initialize();
RegistryManager.initialize();

// Re-export основных классов
export { BotFactory, TelegramBotConstructor };
export { ActionRegistry, FunctionRegistry, RegistryManager };
export { MultiBotManager };

// Re-export типов
export * from './types';
export * from './types/PluginInterfaces';
export * from './types/ActionState';

// Re-export утилит
export * from './utils';
