import { ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';

declare const console: any;

/**
 * IsNotEmptyFunction - проверяет, что значение не является пустой строкой, null или undefined
 * 
 * Параметры:
 * - value: значение для проверки (может быть интерполируемым полем)
 * 
 * Возвращает:
 * - true: если значение не пустое, не null и не undefined
 * - false: если значение является пустой строкой, null или undefined
 */
export class IsNotEmptyFunction {
  static async execute(params: any, context: ProcessingContext): Promise<any> {
    // eslint-disable-next-line no-console
    console.log('🔍 IsNotEmptyFunction.execute called with params:', params);
    
    // Создаем контекст интерполяции для этой функции
    const interpolationContext = InterpolationContextBuilder.createContext(context, params);
    
    if (!params.value) {
      // eslint-disable-next-line no-console
      console.log('❌ IsNotEmptyFunction: value parameter missing');
      throw new Error('IsNotEmpty function requires a value parameter');
    }

    // eslint-disable-next-line no-console
    console.log('🔍 IsNotEmptyFunction: interpolating value:', params.value);
    
    // Интерполируем значение
    const value = InterpolationSystem.interpolateAndClean(params.value, interpolationContext);
    
    // eslint-disable-next-line no-console
    console.log('🔍 IsNotEmptyFunction: interpolated value:', value, 'type:', typeof value);
    
    // Проверяем на null, undefined
    if (value === null || value === undefined) {
      // eslint-disable-next-line no-console
      console.log('🔍 IsNotEmptyFunction: value is null/undefined, returning false');
      return false;
    }
    
    // Проверяем на пустую строку
    if (typeof value === 'string' && value.trim() === '') {
      // eslint-disable-next-line no-console
      console.log('🔍 IsNotEmptyFunction: value is empty string, returning false');
      return false;
    }
    
    // Теперь система интерполяции возвращает пустую строку для неинтерполированных переменных,
    // поэтому эта проверка больше не нужна
    
    // eslint-disable-next-line no-console
    console.log('🔍 IsNotEmptyFunction: value is not empty, returning true');
    
    // Если значение существует и не пустое
    return true;
  }
}
