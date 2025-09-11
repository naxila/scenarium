import { UserContext } from '../types/Context';

export class UserSessionManager {
  private userSessions: Map<string, UserContext> = new Map();
  private readonly sessionTimeout: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(sessionTimeout: number = 30 * 60 * 1000) {
    this.sessionTimeout = sessionTimeout;
    this.cleanupInterval = setInterval(() => this.cleanupSessions(), 60 * 1000);
  }

  getOrCreateUserContext(userId: string): UserContext {
    let userContext = this.userSessions.get(userId);
    
    if (!userContext) {
      userContext = {
        userId,
        data: {},
        backStack: [],
        createdAt: new Date(),
        lastActivity: new Date()
      };
      this.userSessions.set(userId, userContext);
    } else {
      userContext.lastActivity = new Date();
    }
    
    return userContext;
  }

  getUserContext(userId: string): UserContext | undefined {
    return this.userSessions.get(userId);
  }

  updateUserContext(userId: string, updates: Partial<UserContext>): void {
    let userContext = this.userSessions.get(userId);
    
    if (!userContext) {
      // Создаем новый контекст
      userContext = {
        userId: userId,
        data: updates.data || {},
        backStack: updates.backStack || [],
        currentMenu: updates.currentMenu,
        createdAt: new Date(),
        lastActivity: new Date()
      };
    } else {
      // Мержим существующий контекст
      if (updates.data) {
        userContext.data = { ...userContext.data, ...updates.data };
      }
      if (updates.backStack) {
        userContext.backStack = updates.backStack;
      }
      if (updates.currentMenu !== undefined) {
        userContext.currentMenu = updates.currentMenu;
      }
      userContext.lastActivity = new Date();
    }
    
    this.userSessions.set(userId, userContext);
    console.log(`💾 Session updated for ${userId}:`, userContext.data);
  }

  deleteUserContext(userId: string): void {
    this.userSessions.delete(userId);
  }

  private cleanupSessions(): void {
    const now = Date.now();
    for (const [userId, context] of this.userSessions.entries()) {
      if (now - context.lastActivity.getTime() > this.sessionTimeout) {
        this.userSessions.delete(userId);
      }
    }
  }

  dispose(): void {
    clearInterval(this.cleanupInterval);
    this.userSessions.clear();
  }
}
