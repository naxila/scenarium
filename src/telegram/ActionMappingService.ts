export class ActionMappingService {
    private static instance: ActionMappingService;
    private actionMap: Map<string, any> = new Map();
    private nextId: number = 1;
    private readonly MAX_ACTIONS = 1000;
  
    static getInstance(): ActionMappingService {
      if (!ActionMappingService.instance) {
        ActionMappingService.instance = new ActionMappingService();
      }
      return ActionMappingService.instance;
    }
  
    registerAction(action: any): string {
      const actionId = `a${this.nextId++}`;
      this.actionMap.set(actionId, action);
      
      if (this.actionMap.size > this.MAX_ACTIONS) {
        this.clearOldActions();
      }
      
      return actionId;
    }
  
    getAction(actionId: string): any | undefined {
      // Не удаляем действие сразу - оставляем для возможных повторных нажатий
      return this.actionMap.get(actionId);
    }
  
    // Явное удаление когда нужно (при удалении сообщения)
    removeAction(actionId: string): void {
      this.actionMap.delete(actionId);
    }
  
    clearMessageActions(messageActionIds: string[]): void {
      messageActionIds.forEach(id => this.actionMap.delete(id));
    }
  
    // Удаляем действие только после успешного выполнения
    markActionCompleted(actionId: string): void {
      // Можно добавить логику пометки действий как выполненных
      // но пока не удаляем сразу
      console.log(`✅ Action ${actionId} completed`);
    }
  
    private clearOldActions(): void {
      const keys = Array.from(this.actionMap.keys());
      const keysToRemove = keys.slice(0, Math.floor(this.MAX_ACTIONS / 2));
      
      keysToRemove.forEach(key => this.actionMap.delete(key));
      console.log(`🧹 Cleared ${keysToRemove.length} old actions`);
    }
  }