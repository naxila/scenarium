const { BaseActionProcessor } = require('scenarium/dist/actions/BaseAction');

/**
 * Кастомное действие для выполнения математических вычислений
 * Демонстрирует создание действия с обработкой параметров и сохранением результатов
 */
class CalculatorAction extends BaseActionProcessor {
  get actionType() { return 'Calculate'; }

  async process(action, context) {
    // Create interpolation context for this action
    const interpolationContext = this.createInterpolationContext(context);
    
    // Create local scope for action-specific variables
    interpolationContext.local.createScope();
    
    try {
      // Interpolate the action with current context
      const interpolatedAction = this.interpolate(action, interpolationContext);
      const { expression, operation, a, b, saveTo } = interpolatedAction;
      
      let result;
      
      // Выполняем вычисления
      switch (operation) {
        case 'add':
          result = a + b;
          break;
        case 'subtract':
          result = a - b;
          break;
        case 'multiply':
          result = a * b;
          break;
        case 'divide':
          if (b === 0) {
            throw new Error('Division by zero is not allowed');
          }
          result = a / b;
          break;
        case 'power':
          result = Math.pow(a, b);
          break;
        case 'sqrt':
          if (a < 0) {
            throw new Error('Square root of negative number is not allowed');
          }
          result = Math.sqrt(a);
          break;
        case 'expression':
          // Безопасное вычисление выражения
          result = this.evaluateExpression(expression);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
      
      // Округляем результат до 2 знаков после запятой
      result = Math.round(result * 100) / 100;
      
      // Сохраняем результат в контекст пользователя
      if (saveTo) {
        context.userContext.data[saveTo] = result;
        context.userContext.data[`${saveTo}_timestamp`] = new Date().toISOString();
      }
      
      // Сохраняем последний результат
      context.userContext.data.lastCalculation = {
        operation: operation,
        a: a,
        b: b,
        result: result,
        timestamp: new Date().toISOString()
      };
      
      console.log(`🧮 Calculation: ${a} ${operation} ${b} = ${result}`);
      this.updateUserActivity(context);
      
    } finally {
      interpolationContext.local.clearScope();
    }
  }
  
  /**
   * Безопасное вычисление математического выражения
   */
  evaluateExpression(expression) {
    // Удаляем все символы кроме цифр, операторов и скобок
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    
    try {
      // Используем Function для безопасного вычисления
      return Function(`"use strict"; return (${sanitized})`)();
    } catch (error) {
      throw new Error(`Invalid expression: ${expression}`);
    }
  }
}

module.exports = { CalculatorAction };
