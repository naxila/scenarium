const { BaseActionProcessor } = require('scenarium');

/**
 * Кастомное действие для показа статистики пользователей
 * Показывает использование BaseActionProcessor
 */
class ShowUserStatsAction extends BaseActionProcessor {
  get actionType() {
    return 'ShowUserStats';
  }

  async process(action, context) {
    // Создаем контекст интерполяции
    const interpolationContext = this.createInterpolationContext(context, action);
    
    // Создаем локальный скоуп
    interpolationContext.local.createScope();
    
    try {
      // Получаем данные пользователей
      const users = interpolationContext.data.getVariable('users') || [];
      
      // Устанавливаем переменные для интерполяции
      interpolationContext.local.setVariable('userCount', users.length);
      interpolationContext.local.setVariable('users', users);
      
      // Форматируем сообщение
      const message = this.interpolate(action.message || 'Статистика пользователей', interpolationContext);
      
      // Отправляем сообщение
      await this.sendMessage(context, message, action.inlineActions);
      
    } finally {
      // Очищаем локальный скоуп
      interpolationContext.local.clearScope();
    }
  }
}

module.exports = { ShowUserStatsAction };
