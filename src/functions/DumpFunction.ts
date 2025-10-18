import { ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class DumpFunction {
  static async execute(params: any, context: ProcessingContext): Promise<string> {
    console.log('🔍🔍🔍 DUMP FUNCTION START 🔍🔍🔍');
    console.log('🔍 Full params object:', JSON.stringify(params, null, 2));
    console.log('🔍 Context object keys:', Object.keys(context || {}));
    
    let { value, format = 'json', depth = 2 } = params;
    
    console.log('🔍 Extracted value:', value, 'type:', typeof value);
    console.log('🔍 Extracted format:', format);
    console.log('🔍 Extracted depth:', depth);
    
    // Если value - это функция, выполняем её
    if (value && typeof value === 'object' && value.function) {
      console.log('🔍 Dump: Evaluating function to get value');
      console.log('🔍 Function object:', JSON.stringify(value, null, 2));
      try {
        console.log('🔍 Before FunctionProcessor.evaluateResult');
        value = await FunctionProcessor.evaluateResult(value, {}, context, context.interpolationContext);
        console.log('🔍 After FunctionProcessor.evaluateResult, new value:', value, 'type:', typeof value);
      } catch (e) {
        console.error('🔍 Dump: Failed to evaluate value function:', e);
        return `[Error evaluating function: ${e instanceof Error ? e.message : String(e)}]`;
      }
    }
    
    // Если value - это строка с интерполяцией, интерполируем её
    if (typeof value === 'string' && (value.includes('{{') || value.includes('${'))) {
      console.log('🔍 Dump: Interpolating string value');
      try {
        const interpolationContext = InterpolationContextBuilder.createContext(context, params);
        console.log('🔍 Before interpolation, value:', value);
        value = await InterpolationSystem.interpolate(value, interpolationContext);
        console.log('🔍 After interpolation, value:', value, 'type:', typeof value);
      } catch (e) {
        console.error('🔍 Dump: Failed to interpolate value:', e);
        return `[Error interpolating: ${e instanceof Error ? e.message : String(e)}]`;
      }
    }
    
    // Всегда печатаем в консоль для отладки
    console.log('🔍 Dump function output:');
    console.log('Value:', value);
    console.log('Type:', typeof value);
    if (Array.isArray(value)) {
      console.log('Array length:', value.length);
    } else if (value && typeof value === 'object') {
      console.log('Object keys:', Object.keys(value));
    }
    console.log('---');
    
    try {
      let result: string;
      
      console.log('🔍 About to process with format:', format.toLowerCase());
      
      switch (format.toLowerCase()) {
        case 'json':
          console.log('🔍 Processing JSON format');
          result = DumpFunction.safeStringify(value, null, 2);
          console.log('🔍 JSON result:', result, 'type:', typeof result);
          break;
          
        case 'compact':
          result = DumpFunction.safeStringify(value);
          break;
          
        case 'table':
          if (Array.isArray(value)) {
            result = DumpFunction.formatAsTable(value);
          } else {
            result = DumpFunction.safeStringify(value, null, 2);
          }
          break;
          
        case 'inspect':
          result = DumpFunction.inspectObject(value, depth);
          break;
          
        case 'type':
          result = DumpFunction.getTypeInfo(value);
          break;
          
        default:
          result = DumpFunction.safeStringify(value, null, 2);
      }
      
      // Также печатаем результат в консоль
      console.log('🔍 Dump result:');
      console.log(result);
      console.log('🔍 Result type:', typeof result);
      console.log('---');
      
      // Убеждаемся, что возвращаем строку
      if (typeof result !== 'string') {
        console.error('🔍 ERROR: Result is not a string!', result);
        return String(result);
      }
      
      return result;
    } catch (e) {
      const errorMsg = `[Error serializing: ${e instanceof Error ? e.message : String(e)}]`;
      console.error('🔍 Dump error:', errorMsg);
      return errorMsg;
    }
  }
  
  private static formatAsTable(array: any[]): string {
    if (array.length === 0) return '[]';
    
    const firstItem = array[0];
    if (typeof firstItem !== 'object' || firstItem === null) {
      return array.map(item => String(item)).join('\n');
    }
    
    // Get all unique keys
    const keys = [...new Set(array.flatMap(item => 
      typeof item === 'object' && item !== null ? Object.keys(item) : []
    ))];
    
    if (keys.length === 0) return '[]';
    
    // Create table header
    const header = keys.join(' | ');
    const separator = keys.map(() => '---').join(' | ');
    
    // Create table rows
    const rows = array.map(item => {
      return keys.map(key => {
        const value = item && typeof item === 'object' ? item[key] : '';
        return String(value ?? '');
      }).join(' | ');
    });
    
    return [header, separator, ...rows].join('\n');
  }
  
  private static inspectObject(obj: any, depth: number): string {
    if (depth <= 0) return '[Max depth reached]';
    
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    
    const type = typeof obj;
    
    if (type === 'string') return `"${obj}"`;
    if (type === 'number' || type === 'boolean') return String(obj);
    if (type === 'function') return '[Function]';
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      const items = obj.slice(0, 5).map(item => this.inspectObject(item, depth - 1));
      const suffix = obj.length > 5 ? `... (+${obj.length - 5} more)` : '';
      return `[${items.join(', ')}${suffix}]`;
    }
    
    if (type === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) return '{}';
      
      const pairs = keys.slice(0, 5).map(key => {
        const value = this.inspectObject(obj[key], depth - 1);
        return `${key}: ${value}`;
      });
      
      const suffix = keys.length > 5 ? `... (+${keys.length - 5} more)` : '';
      return `{${pairs.join(', ')}${suffix}}`;
    }
    
    return String(obj);
  }
  
  private static getTypeInfo(value: any): string {
    const type = typeof value;
    const isArray = Array.isArray(value);
    const isNull = value === null;
    const isUndefined = value === undefined;
    
    let info = `Type: ${type}`;
    
    if (isArray) {
      info += ` (Array, length: ${value.length})`;
    } else if (isNull) {
      info = 'Type: null';
    } else if (isUndefined) {
      info = 'Type: undefined';
    } else if (type === 'object') {
      const keys = Object.keys(value);
      info += ` (Object, keys: ${keys.length})`;
      if (keys.length > 0) {
        info += ` [${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}]`;
      }
    } else if (type === 'string') {
      info += ` (length: ${value.length})`;
    } else if (type === 'number') {
      info += ` (${Number.isInteger(value) ? 'integer' : 'float'})`;
    }
    
    return info;
  }

  private static safeStringify(value: any, replacer?: any, space?: string | number): string {
    console.log('🔍 safeStringify called with value:', value, 'type:', typeof value);
    try {
      // Сначала пробуем обычный JSON.stringify
      console.log('🔍 Trying JSON.stringify...');
      const result = JSON.stringify(value, replacer, space);
      console.log('🔍 JSON.stringify success:', result);
      return result;
    } catch (e) {
      console.log('🔍 JSON.stringify failed:', e);
      // Если не получается, используем более безопасный подход
      try {
        // Создаем копию объекта без циклических ссылок
        const seen = new WeakSet();
        const safeValue = DumpFunction.removeCircularReferences(value, seen);
        return JSON.stringify(safeValue, replacer, space);
      } catch (e2) {
        // Если и это не работает, возвращаем строковое представление
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'string') return `"${value}"`;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (Array.isArray(value)) return `[Array(${value.length})]`;
        if (typeof value === 'object') {
          const keys = Object.keys(value);
          return `{Object with keys: [${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}]}`;
        }
        return String(value);
      }
    }
  }

  private static removeCircularReferences(obj: any, seen: WeakSet<any>): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (seen.has(obj)) {
      return '[Circular Reference]';
    }

    seen.add(obj);

    if (Array.isArray(obj)) {
      return obj.map(item => DumpFunction.removeCircularReferences(item, seen));
    }

    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        try {
          result[key] = DumpFunction.removeCircularReferences(obj[key], seen);
        } catch (e) {
          result[key] = '[Error accessing property]';
        }
      }
    }

    seen.delete(obj);
    return result;
  }
}
