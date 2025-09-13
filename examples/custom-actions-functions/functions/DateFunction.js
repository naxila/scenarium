const { InterpolationSystem } = require('scenarium');

/**
 * Кастомные функции для работы с датами
 * Демонстрирует создание функций с временными операциями
 */
class DateFunction {
  get functionName() { return 'Date'; }

  async execute(params, context) {
    const interpolationContext = context.interpolationContext;
    
    if (!interpolationContext) {
      throw new Error('DateFunction: interpolationContext is required');
    }
    
    const operation = InterpolationSystem.interpolate(params.operation, interpolationContext);
    const dateInput = InterpolationSystem.interpolate(params.date, interpolationContext);
    const format = InterpolationSystem.interpolate(params.format, interpolationContext);
    
    let date;
    
    // Определяем дату
    if (dateInput) {
      if (dateInput === 'now') {
        date = new Date();
      } else if (typeof dateInput === 'string' && !isNaN(Date.parse(dateInput))) {
        date = new Date(dateInput);
      } else if (typeof dateInput === 'number') {
        date = new Date(dateInput);
      } else {
        throw new Error(`DateFunction: invalid date input "${dateInput}"`);
      }
    } else {
      date = new Date();
    }
    
    if (isNaN(date.getTime())) {
      throw new Error(`DateFunction: invalid date "${dateInput}"`);
    }
    
    switch (operation) {
      case 'format':
        return this.formatDate(date, format || 'YYYY-MM-DD HH:mm:ss');
        
      case 'timestamp':
        return date.getTime();
        
      case 'year':
        return date.getFullYear();
        
      case 'month':
        return date.getMonth() + 1; // JavaScript months are 0-based
        
      case 'day':
        return date.getDate();
        
      case 'hour':
        return date.getHours();
        
      case 'minute':
        return date.getMinutes();
        
      case 'second':
        return date.getSeconds();
        
      case 'dayOfWeek':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
        
      case 'dayOfYear':
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
        
      case 'isWeekend':
        const day = date.getDay();
        return day === 0 || day === 6;
        
      case 'isLeapYear':
        const year = date.getFullYear();
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        
      case 'add':
        const addValue = parseInt(InterpolationSystem.interpolate(params.value, interpolationContext)) || 0;
        const addUnit = InterpolationSystem.interpolate(params.unit, interpolationContext) || 'days';
        return this.addToDate(date, addValue, addUnit);
        
      case 'subtract':
        const subValue = parseInt(InterpolationSystem.interpolate(params.value, interpolationContext)) || 0;
        const subUnit = InterpolationSystem.interpolate(params.unit, interpolationContext) || 'days';
        return this.addToDate(date, -subValue, subUnit);
        
      case 'diff':
        const otherDateInput = InterpolationSystem.interpolate(params.otherDate, interpolationContext);
        const diffUnit = InterpolationSystem.interpolate(params.unit, interpolationContext) || 'days';
        
        let otherDate;
        if (otherDateInput === 'now') {
          otherDate = new Date();
        } else if (typeof otherDateInput === 'string' && !isNaN(Date.parse(otherDateInput))) {
          otherDate = new Date(otherDateInput);
        } else if (typeof otherDateInput === 'number') {
          otherDate = new Date(otherDateInput);
        } else {
          throw new Error(`DateFunction: invalid otherDate input "${otherDateInput}"`);
        }
        
        return this.diffDates(date, otherDate, diffUnit);
        
      case 'age':
        const birthDate = new Date(dateInput);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        return age;
        
      default:
        throw new Error(`Unknown date operation: ${operation}`);
    }
  }
  
  /**
   * Форматирует дату согласно переданному формату
   */
  formatDate(date, format) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }
  
  /**
   * Добавляет значение к дате
   */
  addToDate(date, value, unit) {
    const result = new Date(date);
    
    switch (unit) {
      case 'years':
        result.setFullYear(result.getFullYear() + value);
        break;
      case 'months':
        result.setMonth(result.getMonth() + value);
        break;
      case 'days':
        result.setDate(result.getDate() + value);
        break;
      case 'hours':
        result.setHours(result.getHours() + value);
        break;
      case 'minutes':
        result.setMinutes(result.getMinutes() + value);
        break;
      case 'seconds':
        result.setSeconds(result.getSeconds() + value);
        break;
      default:
        throw new Error(`Unknown date unit: ${unit}`);
    }
    
    return result;
  }
  
  /**
   * Вычисляет разность между датами
   */
  diffDates(date1, date2, unit) {
    const diffMs = Math.abs(date1.getTime() - date2.getTime());
    
    switch (unit) {
      case 'milliseconds':
        return diffMs;
      case 'seconds':
        return Math.floor(diffMs / 1000);
      case 'minutes':
        return Math.floor(diffMs / (1000 * 60));
      case 'hours':
        return Math.floor(diffMs / (1000 * 60 * 60));
      case 'days':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      case 'weeks':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
      case 'months':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44)); // Average month length
      case 'years':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25)); // Average year length
      default:
        throw new Error(`Unknown date unit: ${unit}`);
    }
  }
}

module.exports = { DateFunction };
