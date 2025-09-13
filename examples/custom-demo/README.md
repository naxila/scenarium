# Scenarium Custom Demo

Демонстрационный проект, показывающий создание и использование кастомных функций и действий в [Scenarium](https://www.npmjs.com/package/scenarium).

## 🎯 Что демонстрируется

- **Кастомные функции** (два способа создания):
  - `FormatUserListFunction` - через интерфейс `ICustomFunction`
  - `CalculateStatsFunction` - через статический метод `execute`
- **Кастомные действия**:
  - `ShowUserStatsAction` - через `BaseActionProcessor`
- **Пользовательские функции** в JSON сценариях
- **Интеграция** кастомных и встроенных функций

## 📁 Структура проекта

```
custom-demo/
├── index.js                    # Главный файл (запуск бота)
├── custom/
│   ├── FormatUserListFunction.js    # Кастомная функция (ICustomFunction)
│   ├── CalculateStatsFunction.js    # Кастомная функция (статический execute)
│   └── ShowUserStatsAction.js       # Кастомное действие (BaseActionProcessor)
├── scenarios/
│   └── custom-demo.json        # JSON сценарий с примерами
├── package.json               # Зависимости
└── README.md                  # Документация
```

## 🚀 Быстрый старт

1. **Установите зависимости:**
   ```bash
   npm install
   ```

2. **Настройте бота:**
   - Создайте бота через [@BotFather](https://t.me/BotFather)
   - Скопируйте `.env.template` в `.env`
   - Вставьте токен бота в `.env`

3. **Запустите демо:**
   ```bash
   npm start
   ```

4. **Протестируйте:**
   - Отправьте `/start` боту
   - Попробуйте разные кнопки для демонстрации функций

## 🔧 Кастомные функции

### FormatUserListFunction (ICustomFunction)

Форматирует список пользователей с настраиваемым шаблоном:

```javascript
export class FormatUserListFunction {
  readonly functionName = 'FormatUserList';
  
  async execute(params, context) {
    // Реализация функции
  }
}
```

**Использование в сценарии:**
```json
{
  "function": "FormatUserList",
  "users": "{{users}}",
  "template": "👤 {{user.name}} - {{user.email}}",
  "separator": "\n"
}
```

### CalculateStatsFunction (статический execute)

Вычисляет статистику для массива чисел:

```javascript
export class CalculateStatsFunction {
  static async execute(params, context) {
    // Реализация функции
  }
}
```

**Использование в сценарии:**
```json
{
  "function": "CalculateStats",
  "numbers": [10, 25, 30, 15, 20, 35, 40]
}
```

## 🎬 Кастомные действия

### ShowUserStatsAction (BaseActionProcessor)

Показывает статистику пользователей:

```javascript
export class ShowUserStatsAction extends BaseActionProcessor {
  get actionType() {
    return 'ShowUserStats';
  }
  
  async process(action, context) {
    // Реализация действия
  }
}
```

**Использование в сценарии:**
```json
{
  "action": "ShowUserStats"
}
```

## 📝 Пользовательские функции

В JSON сценарии определены пользовательские функции:

```json
{
  "functions": {
    "FormatUserInfo": {
      "params": { "user": {} },
      "result": "👤 **{{user.name}}**\n📧 {{user.email}}\n🎂 {{user.age}} лет"
    },
    "GetUserGreeting": {
      "params": { "user": {} },
      "result": {
        "function": "JoinToString",
        "values": ["Привет, ", {"function": "FormatBold", "text": "{{user.name}}"}, "! 👋"],
        "separator": ""
      }
    }
  }
}
```

## 🎮 Демонстрация

Бот предоставляет следующие возможности:

1. **📊 Показать статистику** - использует кастомное действие `ShowUserStats`
2. **👥 Форматировать список** - использует кастомную функцию `FormatUserList`
3. **🔢 Рассчитать числа** - использует кастомную функцию `CalculateStats`
4. **🔄 Обновить данные** - обновляет данные пользователей

## 🔍 Ключевые особенности

- **Два способа создания функций** - через интерфейс и статический метод
- **Наследование от BaseActionProcessor** для действий
- **Локальные скоупы** для изоляции переменных
- **Интерполяция контекста** для работы с данными
- **Цепочки функций** - функции могут вызывать другие функции
- **Интеграция** кастомных и встроенных функций

## 📚 Дополнительные ресурсы

- [Документация Scenarium](https://github.com/naxila/scenarium)
- [Примеры сценариев](../scenarium-demo/)
- [API Reference](https://github.com/naxila/scenarium#api-reference)
