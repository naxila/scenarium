# Custom Actions & Functions Demo

Демонстрационный проект, показывающий как создавать и использовать кастомные действия и функции с библиотекой Scenarium.

## 🎯 Цель проекта

Этот проект демонстрирует:
- Создание кастомных действий (Custom Actions)
- Создание кастомных функций (Custom Functions)
- Регистрацию действий и функций в BotFactory
- Использование кастомных компонентов в сценариях

## 📁 Структура проекта

```
custom-actions-functions/
├── actions/                    # Кастомные действия
│   ├── LogAction.js           # Действие для логирования
│   ├── WeatherAction.js       # Действие для получения погоды
│   └── CalculatorAction.js    # Действие для вычислений
├── functions/                  # Кастомные функции
│   ├── StringFunction.js      # Функции для работы со строками
│   ├── MathFunction.js        # Математические функции
│   └── DateFunction.js        # Функции для работы с датами
├── scenarios/                  # Сценарии бота
│   ├── custom-demo.json       # Основной сценарий
│   └── simple-test.json       # Простой тестовый сценарий
├── index.js                   # Главный файл приложения
├── package.json               # Зависимости проекта
├── CHANGELOG.md               # История изменений
└── README.md                  # Документация
```

## 📋 Структура сценария

Правильная структура сценария Scenarium:

```json
{
  "onStartActions": [...],     // Действия при запуске (обязательно)
  "menuItems": {...},          // Элементы меню (обязательно)
  "data": {...}               // Общие данные (опционально)
}
```

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
cd scenarium/examples/custom-actions-functions
npm install
```

### 2. Настройка окружения

Скопируйте файл `env.template` в `.env` и настройте:

```bash
cp env.template .env
```

Отредактируйте `.env`:
```env
BOT_TOKEN=your_bot_token_here
WEATHER_API_KEY=your_openweather_api_key_here  # Опционально
LOG_LEVEL=info
```

### 3. Запуск бота

```bash
npm start
```

## 🔧 Кастомные действия

### LogAction
Действие для логирования сообщений с различными уровнями.

**Параметры:**
- `message` - сообщение для логирования
- `level` - уровень логирования (info, warn, error, debug)

**Пример использования:**
```json
{
  "action": "Log",
  "message": "Пользователь {{userContext.userId}} выполнил действие",
  "level": "info"
}
```

### WeatherAction
Действие для получения информации о погоде через API.

**Параметры:**
- `city` - название города

**Пример использования:**
```json
{
  "action": "Weather",
  "city": "Москва"
}
```

**Результат:** Сохраняет данные о погоде в `userContext.data.weather`

### CalculatorAction
Действие для выполнения математических вычислений.

**Параметры:**
- `operation` - тип операции (add, subtract, multiply, divide, power, sqrt, expression)
- `a` - первое число
- `b` - второе число (для бинарных операций)
- `expression` - математическое выражение (для operation: expression)
- `saveTo` - ключ для сохранения результата

**Пример использования:**
```json
{
  "action": "Calculate",
  "operation": "add",
  "a": 15,
  "b": 25,
  "saveTo": "result"
}
```

## ⚙️ Кастомные функции

### StringFunction
Функции для работы со строками.

**Доступные операции:**
- `uppercase` - преобразование в верхний регистр
- `lowercase` - преобразование в нижний регистр
- `capitalize` - первая буква заглавная
- `reverse` - переворот строки
- `length` - длина строки
- `trim` - удаление пробелов
- `replace` - замена подстроки
- `substring` - извлечение подстроки
- `split` - разделение строки
- `contains` - проверка содержания
- `startsWith` - проверка начала
- `endsWith` - проверка окончания
- `repeat` - повторение строки

**Пример использования:**
```json
{
  "function": {
    "String": {
      "operation": "uppercase",
      "input": "hello world"
    }
  }
}
```

### MathFunction
Математические функции.

**Доступные операции:**
- `max` - максимальное значение
- `min` - минимальное значение
- `sum` - сумма чисел
- `average` - среднее арифметическое
- `abs` - абсолютное значение
- `round` - округление
- `floor` - округление вниз
- `ceil` - округление вверх
- `random` - случайное число
- `randomInt` - случайное целое число
- `power` - возведение в степень
- `sqrt` - квадратный корень
- `log` - натуральный логарифм
- `sin`, `cos`, `tan` - тригонометрические функции

**Пример использования:**
```json
{
  "function": {
    "Math": {
      "operation": "sum",
      "values": [1, 2, 3, 4, 5]
    }
  }
}
```

### DateFunction
Функции для работы с датами.

**Доступные операции:**
- `format` - форматирование даты
- `timestamp` - временная метка
- `year`, `month`, `day` - компоненты даты
- `hour`, `minute`, `second` - компоненты времени
- `dayOfWeek` - день недели
- `dayOfYear` - день года
- `isWeekend` - проверка выходного
- `isLeapYear` - проверка високосного года
- `add` - добавление к дате
- `subtract` - вычитание из даты
- `diff` - разность дат
- `age` - вычисление возраста

**Пример использования:**
```json
{
  "function": {
    "Date": {
      "operation": "format",
      "date": "now",
      "format": "DD.MM.YYYY HH:mm"
    }
  }
}
```

## 📝 Создание собственных действий

### 1. Создание класса действия

```javascript
const { BaseActionProcessor } = require('scenarium');

class MyCustomAction extends BaseActionProcessor {
  static readonly actionType = 'myAction';

  async process(action, context) {
    const interpolationContext = this.createInterpolationContext(context);
    interpolationContext.local.createScope();
    
    try {
      // Ваша логика здесь
      const param1 = this.interpolate(action.param1, interpolationContext);
      
      // Обработка параметров
      console.log('Custom action executed with:', param1);
      
      // Обновление активности пользователя
      this.updateUserActivity(context);
      
    } finally {
      interpolationContext.local.clearScope();
    }
  }
}

module.exports = { MyCustomAction };
```

### 2. Регистрация действия

```javascript
const { BotFactory } = require('scenarium');
const { MyCustomAction } = require('./actions/MyCustomAction');

// Регистрация действия
BotFactory.registerAction(MyCustomAction);
```

## 📝 Создание собственных функций

### 1. Создание класса функции

```javascript
const { InterpolationSystem } = require('scenarium');

class MyCustomFunction {
  static async execute(params, context) {
    const interpolationContext = context.interpolationContext;
    
    if (!interpolationContext) {
      throw new Error('MyCustomFunction: interpolationContext is required');
    }
    
    const input = InterpolationSystem.interpolate(params.input, interpolationContext);
    
    // Ваша логика здесь
    const result = input * 2; // Пример: удваиваем значение
    
    return result;
  }
}

module.exports = { MyCustomFunction };
```

### 2. Регистрация функции

```javascript
const { BotFactory } = require('scenarium');
const { MyCustomFunction } = require('./functions/MyCustomFunction');

// Регистрация функции
BotFactory.registerFunction('MyCustom', MyCustomFunction);
```

## 🎮 Использование в сценариях

### Использование кастомных действий

```json
{
  "action": "MyAction",
  "param1": "{{userContext.userId}}",
  "param2": "{{data.someValue}}"
}
```

### Использование кастомных функций

```json
{
  "message": "Результат: {{function: {MyCustom: {input: '{{userContext.data.value}}'}}}}"
}
```

## 🔍 Отладка

Для отладки кастомных компонентов используйте:

1. **Логирование в действиях:**
```javascript
console.log('Debug info:', { param1, context: context.userContext.userId });
```

2. **Обработка ошибок:**
```javascript
try {
  // Ваша логика
} catch (error) {
  console.error('Custom action error:', error.message);
  throw error; // Перебрасываем ошибку для обработки в Scenarium
}
```

3. **Проверка контекста интерполяции:**
```javascript
if (!interpolationContext) {
  throw new Error('Interpolation context is required');
}
```

## 📚 Дополнительные ресурсы

- [Документация Scenarium](../../docs/)
- [Примеры сценариев](../scenarium-demo/)
- [API Reference](../../docs/api/)

## 🤝 Вклад в проект

Если вы хотите добавить новые примеры действий или функций:

1. Создайте новый файл в соответствующей папке (`actions/` или `functions/`)
2. Следуйте существующим паттернам
3. Добавьте примеры использования в сценарий
4. Обновите документацию

## 📄 Лицензия

MIT License - см. файл [LICENSE](../../LICENSE) для деталей.
