// Types for managing action state
export interface ActionState {
  actionId: string;
  userId: string;
  botName: string;
  isWaitingForInput: boolean;
  inputType: 'message' | 'document' | 'callback' | 'any';
  inputCount: number;
  maxInputs?: number;
  timeout?: number;
  onInput: (input: any, state: ActionState) => Promise<boolean>; // true = continue waiting, false = completed
  onComplete: (result: any) => void;
  onTimeout?: () => void;
}

export interface ActionStateManager {
  setWaiting(actionId: string, userId: string, botName: string, inputType: string, onInput: Function, onComplete: Function, options?: any): void;
  isWaiting(userId: string, botName: string): ActionState | null;
  processInput(userId: string, botName: string, input: any): Promise<boolean>; // true = processed, false = not ours
  complete(actionId: string): void;
  clear(userId: string, botName: string): void;
  clearAll(botName: string): void;
}
