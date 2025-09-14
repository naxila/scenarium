# AnalyticsInterface

`AnalyticsInterface` - это простой интерфейс для библиотеки scenarium, который предоставляет коллбеки для отслеживания событий Telegram бота.

## Возможности

- 📨 Отслеживание входящих сообщений
- 📤 Отслеживание исходящих сообщений  
- 🚀 Отслеживание запуска пользователей
- 🎯 Отслеживание действий пользователей
- ❌ Обработка ошибок
- 🔄 Простая интеграция с системами аналитики

## Установка

```bash
# Установка локального пакета
npm install ../scenarium-0.1.1-alpha.tgz

# Или если пакет опубликован
npm install scenarium
```

## Использование

```javascript
const { AnalyticsInterface } = require('scenarium');

const bot = new AnalyticsInterface({
  token: 'YOUR_BOT_TOKEN',
  scenario: yourScenario,
  botName: 'MyBot',
  callbacks: {
    onMessageReceived: (userId, message, messageData) => {
      console.log(`Получено сообщение от ${userId}: ${message}`);
      // Отправка в систему аналитики
    },
    
    onMessageSent: (userId, message, messageData) => {
      console.log(`Отправлено сообщение пользователю ${userId}: ${message}`);
      // Отправка в систему аналитики
    },
    
    onUserStarted: (userId, userData) => {
      console.log(`Пользователь ${userId} начал работу`);
      // Отправка в систему аналитики
    },
    
    onUserAction: (userId, action, actionData) => {
      console.log(`Пользователь ${userId} выполнил действие: ${action}`);
      // Отправка в систему аналитики
    },
    
    onError: (error, context) => {
      console.error('Ошибка в боте:', error);
      // Отправка в систему аналитики
    }
  }
});

// Запуск бота
await bot.start();

// Остановка бота
await bot.stop();
```

## API

### Конструктор

```typescript
new AnalyticsInterface(config: AnalyticsBotConfig)
```

#### AnalyticsBotConfig

```typescript
interface AnalyticsBotConfig {
  token: string;                    // Токен Telegram бота
  scenario: Scenario;               // Сценарий бота
  botName?: string;                 // Имя бота (опционально)
  callbacks?: AnalyticsEventCallbacks; // Коллбеки событий
}
```

### Коллбеки событий

#### onMessageReceived
Вызывается при получении сообщения от пользователя.

```typescript
onMessageReceived?: (userId: string, message: string, messageData: any) => void;
```

#### onMessageSent
Вызывается при отправке сообщения пользователю.

```typescript
onMessageSent?: (userId: string, message: string, messageData: any) => void;
```

#### onUserStarted
Вызывается когда пользователь начинает работу с ботом.

```typescript
onUserStarted?: (userId: string, userData: any) => void;
```

#### onUserAction
Вызывается при выполнении пользователем действия (нажатие кнопки, callback query).

```typescript
onUserAction?: (userId: string, action: string, actionData: any) => void;
```

#### onError
Вызывается при возникновении ошибки.

```typescript
onError?: (error: Error, context?: any) => void;
```

### Методы

#### start()
Запускает бота.

```typescript
async start(): Promise<void>
```

#### stop()
Останавливает бота.

```typescript
async stop(): Promise<void>
```

#### isBotRunning()
Проверяет, запущен ли бот.

```typescript
isBotRunning(): boolean
```

#### sendMessage()
Отправляет сообщение пользователю.

```typescript
async sendMessage(userId: string, text: string, options?: any): Promise<any>
```

#### getUserContext()
Получает контекст пользователя.

```typescript
getUserContext(userId: string): any
```

#### updateUserContext()
Обновляет контекст пользователя.

```typescript
updateUserContext(userId: string, updates: Record<string, any>): void
```

#### getScenario()
Получает сценарий бота.

```typescript
getScenario(): Scenario
```

#### processUserAction()
Обрабатывает действие пользователя.

```typescript
async processUserAction(userId: string, action: any): Promise<void>
```

## Пример интеграции с системой аналитики

```javascript
const { AnalyticsInterface } = require('scenarium');

// Функция для отправки данных в систему аналитики
async function trackEvent(eventType, data) {
  try {
    await fetch('http://your-analytics-api.com/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventType,
        data: data,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Ошибка отправки аналитики:', error);
  }
}

const bot = new AnalyticsInterface({
  token: 'YOUR_BOT_TOKEN',
  scenario: yourScenario,
  callbacks: {
    onMessageReceived: (userId, message, messageData) => {
      trackEvent('message_received', {
        userId,
        message,
        chatId: messageData.chat?.id,
        messageId: messageData.message_id
      });
    },
    
    onMessageSent: (userId, message, messageData) => {
      trackEvent('message_sent', {
        userId,
        message,
        result: messageData.result
      });
    },
    
    onUserStarted: (userId, userData) => {
      trackEvent('user_started', {
        userId,
        userData
      });
    },
    
    onUserAction: (userId, action, actionData) => {
      trackEvent('user_action', {
        userId,
        action,
        actionData
      });
    },
    
    onError: (error, context) => {
      trackEvent('bot_error', {
        error: error.message,
        stack: error.stack,
        context
      });
    }
  }
});

await bot.start();
```

## Преимущества

1. **Простота использования** - минимальный код для интеграции аналитики
2. **Гибкость** - можно интегрировать с любой системой аналитики
3. **Надежность** - обработка ошибок и fallback механизмы
4. **Производительность** - асинхронная обработка событий
5. **Расширяемость** - легко добавлять новые типы событий

## Совместимость

- Node.js >= 16.0.0
- TypeScript >= 5.0.0
- Telegram Bot API
