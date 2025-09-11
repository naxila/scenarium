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
  scenario: Scenario; // Добавляем scenario в контекст обработки
  actionProcessor?: any; // Добавляем ActionProcessor в контекст
  bot?: any; // Добавляем bot для отправки сообщений
  chatId?: string; // Добавляем chatId для отправки сообщений
  botInstance?: any; // Добавляем botInstance для доступа к методам бота
}