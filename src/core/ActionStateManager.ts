import { ActionState, ActionStateManager as IActionStateManager } from '../types/ActionState';

export class ActionStateManager implements IActionStateManager {
  private states: Map<string, ActionState> = new Map(); // key: "botName:userId"
  
  setWaiting(actionId: string, userId: string, botName: string, inputType: string, onInput: Function, onComplete: Function, options: any = {}): void {
    const key = `${botName}:${userId}`;
    
    console.log('🔧 ActionStateManager.setWaiting called:', { actionId, userId, botName, inputType, key });
    
    // Очищаем предыдущее состояние для этого пользователя в этом боте
    this.clear(userId, botName);
    
    const state: ActionState = {
      actionId,
      userId,
      botName,
      isWaitingForInput: true,
      inputType: inputType as any,
      inputCount: 0,
      maxInputs: options.maxInputs,
      timeout: options.timeout,
      onInput: onInput as any,
      onComplete: onComplete as any,
      onTimeout: options.onTimeout
    };
    
    this.states.set(key, state);
    console.log('✅ ActionStateManager.setWaiting completed, state saved:', { key, stateCount: this.states.size });
    
    // Устанавливаем таймаут если нужно
    if (options.timeout) {
      setTimeout(() => {
        const currentState = this.states.get(key);
        if (currentState && currentState.actionId === actionId) {
          this.clear(userId, botName);
          if (options.onTimeout) {
            options.onTimeout();
          }
        }
      }, options.timeout);
    }
  }
  
  async processInput(userId: string, botName: string, input: any): Promise<boolean> {
    const key = `${botName}:${userId}`;
    const state = this.states.get(key);
    
    console.log('🔍 ActionStateManager.processInput called:', { userId, botName, key, hasState: !!state, inputType: input?.type });
    
    if (!state || !state.isWaitingForInput) {
      console.log('❌ No waiting state found for user');
      return false; // Не ждем ввода от этого пользователя
    }
    
    // Проверяем тип ввода
    if (state.inputType !== 'any' && state.inputType !== input.type) {
      return false; // Не тот тип ввода
    }
    
    try {
      state.inputCount++;
      
      // Вызываем обработчик ввода
      const shouldContinue = await state.onInput(input, state);
      
      if (!shouldContinue) {
        // Действие завершено
        this.clear(userId, botName);
        state.onComplete({ inputCount: state.inputCount, lastInput: input });
      }
      
      return true; // Ввод обработан
    } catch (error) {
      console.error('Error processing input:', error);
      this.clear(userId, botName);
      return false;
    }
  }
  
  isWaiting(userId: string, botName: string): ActionState | null {
    const key = `${botName}:${userId}`;
    return this.states.get(key) || null;
  }
  
  complete(actionId: string): void {
    for (const [key, state] of this.states.entries()) {
      if (state.actionId === actionId) {
        this.states.delete(key);
        state.onComplete({ inputCount: state.inputCount });
        break;
      }
    }
  }
  
  clear(userId: string, botName: string): void {
    const key = `${botName}:${userId}`;
    this.states.delete(key);
  }
  
  clearAll(botName: string): void {
    for (const [key, state] of this.states.entries()) {
      if (state.botName === botName) {
        this.states.delete(key);
      }
    }
  }
}
