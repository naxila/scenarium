const { InterpolationSystem } = require('scenarium');

/**
 * Кастомные функции для работы со строками
 * Демонстрирует создание функций с различными параметрами
 */
class StringFunction {
  get functionName() { return 'String'; }

  async execute(params, context) {
    const interpolationContext = context.interpolationContext;
    
    if (!interpolationContext) {
      throw new Error('StringFunction: interpolationContext is required');
    }
    
    const operation = InterpolationSystem.interpolate(params.operation, interpolationContext);
    const input = InterpolationSystem.interpolate(params.input, interpolationContext);
    
    switch (operation) {
      case 'uppercase':
        return String(input).toUpperCase();
        
      case 'lowercase':
        return String(input).toLowerCase();
        
      case 'reverse':
        return String(input).split('').reverse().join('');
        
      case 'length':
        return String(input).length;
        
      default:
        throw new Error(`Unknown string operation: ${operation}`);
    }
  }
}

module.exports = { StringFunction };
