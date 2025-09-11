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
      // Don't remove action immediately - leave for possible repeated clicks
      return this.actionMap.get(actionId);
    }
  
    // Explicit removal when needed (when deleting message)
    removeAction(actionId: string): void {
      this.actionMap.delete(actionId);
    }
  
    clearMessageActions(messageActionIds: string[]): void {
      messageActionIds.forEach(id => this.actionMap.delete(id));
    }
  
    // Remove action only after successful execution
    markActionCompleted(actionId: string): void {
      // Can add logic to mark actions as completed
      // but don't remove immediately
      console.log(`✅ Action ${actionId} completed`);
    }
  
    private clearOldActions(): void {
      const keys = Array.from(this.actionMap.keys());
      const keysToRemove = keys.slice(0, Math.floor(this.MAX_ACTIONS / 2));
      
      keysToRemove.forEach(key => this.actionMap.delete(key));
      console.log(`🧹 Cleared ${keysToRemove.length} old actions`);
    }
  }