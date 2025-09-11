import { BotFactory, TelegramBotConstructor } from './assembly';
import { ActionRegistry, FunctionRegistry } from './registry';
import { RegistryManager } from './registry/RegistryManager';
import { MultiBotManager } from './core/MultiBotManager';
import { ScenarioLoader } from './core/ScenarioLoader';

// Initialize registries
FunctionRegistry.initialize();
ActionRegistry.initialize();
RegistryManager.initialize();

// Re-export main classes
export { BotFactory, TelegramBotConstructor };
export { ActionRegistry, FunctionRegistry, RegistryManager };
export { MultiBotManager };
export { ScenarioLoader };

// Re-export types
export * from './types';
export * from './types/PluginInterfaces';
export * from './types/ActionState';

// Re-export utilities
export * from './utils';
