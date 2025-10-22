import { ProcessingContext } from '../types';
import { InterpolationContextBuilder, InterpolationSystem } from '../interpolation';
import { FunctionProcessor } from '../core/FunctionProcessor';

export class DateFormatFunction {
  static async execute(params: any, context: ProcessingContext): Promise<string> {
    const interpolationContext = InterpolationContextBuilder.createContext(context, params);
    interpolationContext.local.createScope();

    try {
      if (!params.date) {
        throw new Error('DateFormat function requires a "date" parameter');
      }

      if (!params.format) {
        throw new Error('DateFormat function requires a "format" parameter');
      }

      let dateValue = params.date;
      let formatValue = params.format;
      
      // If date is a function, evaluate it first
      if (dateValue && typeof dateValue === 'object' && dateValue.function) {
        dateValue = await FunctionProcessor.evaluateResult(dateValue, {}, context, interpolationContext);
      } else if (typeof dateValue === 'string') {
        dateValue = InterpolationSystem.interpolateAndClean(dateValue, interpolationContext);
      }

      // If format is a function, evaluate it first
      if (formatValue && typeof formatValue === 'object' && formatValue.function) {
        formatValue = await FunctionProcessor.evaluateResult(formatValue, {}, context, interpolationContext);
      } else if (typeof formatValue === 'string') {
        formatValue = InterpolationSystem.interpolateAndClean(formatValue, interpolationContext);
      }

      // Parse the date
      const date = new Date(dateValue);
      
      if (isNaN(date.getTime())) {
        throw new Error(`DateFormat function: invalid date format "${dateValue}"`);
      }

      // Format the date
      const formatted = this.formatDate(date, formatValue);
      console.log(`🔍 DateFormatFunction: "${dateValue}" formatted as "${formatValue}" = "${formatted}"`);
      
      interpolationContext.local.setVariable('result', formatted);
      return formatted;

    } catch (error) {
      console.error('❌ DateFormatFunction error:', error);
      throw error;
    } finally {
      interpolationContext.local.clearScope();
    }
  }

  private static formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

    return format
      .replace(/YYYY/g, String(year))
      .replace(/MM/g, month)
      .replace(/DD/g, day)
      .replace(/HH/g, hours)
      .replace(/mm/g, minutes)
      .replace(/ss/g, seconds)
      .replace(/SSS/g, milliseconds)
      .replace(/YY/g, String(year).slice(-2))
      .replace(/M/g, String(date.getMonth() + 1))
      .replace(/D/g, String(date.getDate()))
      .replace(/H/g, String(date.getHours()))
      .replace(/m/g, String(date.getMinutes()))
      .replace(/s/g, String(date.getSeconds()));
  }
}
