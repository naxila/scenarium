const { InterpolationSystem } = require('scenarium');

/**
 * Кастомные математические функции
 * Демонстрирует создание функций с числовыми операциями
 */
class MathFunction {
  get functionName() { return 'Math'; }

  async execute(params, context) {
    const interpolationContext = context.interpolationContext;
    
    if (!interpolationContext) {
      throw new Error('MathFunction: interpolationContext is required');
    }
    
    const operation = InterpolationSystem.interpolate(params.operation, interpolationContext);
    const values = InterpolationSystem.interpolate(params.values, interpolationContext);
    
    if (!Array.isArray(values)) {
      throw new Error('MathFunction: values parameter must be an array');
    }
    
    // Преобразуем все значения в числа
    const numbers = values.map(v => {
      const num = parseFloat(v);
      if (isNaN(num)) {
        throw new Error(`MathFunction: invalid number "${v}"`);
      }
      return num;
    });
    
    switch (operation) {
      case 'max':
        return Math.max(...numbers);
        
      case 'min':
        return Math.min(...numbers);
        
      case 'sum':
        return numbers.reduce((sum, num) => sum + num, 0);
        
      case 'average':
        return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        
      case 'abs':
        if (numbers.length !== 1) {
          throw new Error('MathFunction: abs operation requires exactly one value');
        }
        return Math.abs(numbers[0]);
        
      case 'round':
        if (numbers.length !== 1) {
          throw new Error('MathFunction: round operation requires exactly one value');
        }
        return Math.round(numbers[0]);
        
      case 'floor':
        if (numbers.length !== 1) {
          throw new Error('MathFunction: floor operation requires exactly one value');
        }
        return Math.floor(numbers[0]);
        
      case 'ceil':
        if (numbers.length !== 1) {
          throw new Error('MathFunction: ceil operation requires exactly one value');
        }
        return Math.ceil(numbers[0]);
        
      case 'random':
        const min = numbers[0] || 0;
        const max = numbers[1] || 1;
        return Math.random() * (max - min) + min;
        
      case 'randomInt':
        const minInt = Math.floor(numbers[0] || 0);
        const maxInt = Math.floor(numbers[1] || 1);
        return Math.floor(Math.random() * (maxInt - minInt + 1)) + minInt;
        
      case 'power':
        if (numbers.length !== 2) {
          throw new Error('MathFunction: power operation requires exactly two values');
        }
        return Math.pow(numbers[0], numbers[1]);
        
      case 'sqrt':
        if (numbers.length !== 1) {
          throw new Error('MathFunction: sqrt operation requires exactly one value');
        }
        if (numbers[0] < 0) {
          throw new Error('MathFunction: sqrt operation requires non-negative value');
        }
        return Math.sqrt(numbers[0]);
        
      case 'log':
        if (numbers.length !== 1) {
          throw new Error('MathFunction: log operation requires exactly one value');
        }
        if (numbers[0] <= 0) {
          throw new Error('MathFunction: log operation requires positive value');
        }
        return Math.log(numbers[0]);
        
      case 'sin':
        if (numbers.length !== 1) {
          throw new Error('MathFunction: sin operation requires exactly one value');
        }
        return Math.sin(numbers[0]);
        
      case 'cos':
        if (numbers.length !== 1) {
          throw new Error('MathFunction: cos operation requires exactly one value');
        }
        return Math.cos(numbers[0]);
        
      case 'tan':
        if (numbers.length !== 1) {
          throw new Error('MathFunction: tan operation requires exactly one value');
        }
        return Math.tan(numbers[0]);
        
      default:
        throw new Error(`Unknown math operation: ${operation}`);
    }
  }
}

module.exports = { MathFunction };
