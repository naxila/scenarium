const { BaseActionProcessor } = require('scenarium/dist/actions/BaseAction');

/**
 * Кастомное действие для логирования
 * Демонстрирует создание простого кастомного действия
 */
class LogAction extends BaseActionProcessor {
  get actionType() { return 'Log'; }

  async process(action, context) {
    // Create interpolation context for this action
    const interpolationContext = this.createInterpolationContext(context);
    
    // Create local scope for action-specific variables
    interpolationContext.local.createScope();
    
    try {
      // Interpolate the action with current context
      const interpolatedAction = this.interpolate(action, interpolationContext);
      const { message, level = 'info' } = interpolatedAction;
      
      // Логируем с указанным уровнем
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [${level.toUpperCase()}] [User: ${context.userContext.userId}] ${message}`;
      
      switch (level.toLowerCase()) {
        case 'error':
          console.error(logMessage);
          break;
        case 'warn':
          console.warn(logMessage);
          break;
        case 'debug':
          console.debug(logMessage);
          break;
        default:
          console.log(logMessage);
      }
      
      // Обновляем активность пользователя
      this.updateUserActivity(context);
    } finally {
      interpolationContext.local.clearScope();
    }
  }
}

module.exports = { LogAction };
