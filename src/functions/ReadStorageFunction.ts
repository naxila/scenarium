import { ProcessingContext } from '../types';

export class ReadStorageFunction {
  static async execute(params: any, context: ProcessingContext): Promise<any> {
    const { key, fallbackValue } = params || {};
    if (!key) return fallbackValue;

    const storage = (context.userContext.data.__storage || {}) as Record<string, { value: any, clearAfterRead?: boolean }>;
    const record = storage[key];
    if (!record) return fallbackValue;

    const result = record.value;
    
    if (record.clearAfterRead) {
      delete storage[key];
      context.userContext.data.__storage = storage;
    }
    return result;
  }
}


