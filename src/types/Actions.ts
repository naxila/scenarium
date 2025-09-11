// Base interface for all actions
export interface BaseAction {
  action: string;
  [key: string]: any;
}

// Helper types
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

// General type for everything
export type Action = BaseAction;