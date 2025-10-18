import { Scenario } from './Scenario';

export interface UserContext {
  userId: string;
  data: Record<string, any>;
  backStack: string[];
  currentMenu?: string;
  createdAt: Date;
  lastActivity: Date;
}

export interface ProcessingContext {
  userContext: UserContext;
  scenarioContext: Record<string, any>;
  localContext: Record<string, any>;
  scenario: Scenario; // Add scenario to processing context
  actionProcessor?: any; // Add ActionProcessor to context
  bot?: any; // Add bot for sending messages
  chatId?: string; // Add chatId for sending messages
  botInstance?: any; // Add botInstance for accessing bot methods
  interpolationContext?: any; // Add interpolation context for nested actions
  telegram?: any; // Add telegram context for global access
}