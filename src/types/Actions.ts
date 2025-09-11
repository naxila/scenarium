// Базовый интерфейс для всех действий
export interface BaseAction {
  action: string;
  [key: string]: any;
}

// Вспомогательные типы
export interface InlineAction {
  title: string;
  onClick: BaseAction | BaseAction[];
}

export interface MenuItem {
  onNavigation: BaseAction | BaseAction[];
  onDocument?: BaseAction | BaseAction[];
}

export interface FunctionDefinition {
  params: Record<string, any>;
  result: any;
}

// Общий тип для всего
export type Action = BaseAction;