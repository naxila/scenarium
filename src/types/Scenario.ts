import { Action, MenuItem, FunctionDefinition } from './Actions';

export interface Scenario {
  onStartActions: Action | Action[];
  menuItems: Record<string, MenuItem>;
  functions: Record<string, FunctionDefinition>;
}

export interface ScenarioConfig {
  scenario: Scenario;
  telegramBotToken?: string;
  sessionTimeout?: number;
  maxBackStackSize?: number;
}
