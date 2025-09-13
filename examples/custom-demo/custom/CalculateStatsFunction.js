const { InterpolationContextBuilder, InterpolationSystem } = require('scenarium');

/**
 * Кастомная функция для расчета статистики
 * Показывает использование статического метода execute
 */
class CalculateStatsFunction {
  static async execute(params, context) {
    // Создаем контекст интерполяции для этой функции
    const interpolationContext = InterpolationContextBuilder.createContext(context, params);
    
    // Создаем локальный скоуп для переменных функции
    interpolationContext.local.createScope();
    
    try {
      // Получаем массив чисел
      const numbers = InterpolationSystem.interpolate(params.numbers, interpolationContext);
      
      if (!Array.isArray(numbers) || numbers.length === 0) {
        return {
          count: 0,
          sum: 0,
          average: 0,
          min: 0,
          max: 0
        };
      }
      
      // Вычисляем статистику
      const validNumbers = numbers.filter(n => typeof n === 'number' && !isNaN(n));
      const count = validNumbers.length;
      const sum = validNumbers.reduce((acc, n) => acc + n, 0);
      const average = count > 0 ? sum / count : 0;
      const min = count > 0 ? Math.min(...validNumbers) : 0;
      const max = count > 0 ? Math.max(...validNumbers) : 0;
      
      // Устанавливаем переменные для интерполяции
      interpolationContext.local.setVariable('count', count);
      interpolationContext.local.setVariable('sum', sum);
      interpolationContext.local.setVariable('average', average.toFixed(2));
      interpolationContext.local.setVariable('min', min);
      interpolationContext.local.setVariable('max', max);
      
      const result = {
        count,
        sum,
        average: parseFloat(average.toFixed(2)),
        min,
        max
      };
      
      return result;
      
    } finally {
      // Очищаем локальный скоуп при завершении функции
      interpolationContext.local.clearScope();
    }
  }
}

module.exports = { CalculateStatsFunction };
