# Scenarium Demo - Быстрый старт

Демонстрационный проект для быстрого запуска Telegram бота с помощью библиотеки [Scenarium](https://www.npmjs.com/package/scenarium).

## 🚀 Запуск за 3 команды

```bash
npm install
cp env.template .env
# Отредактируйте .env и добавьте токен бота: BOT_TOKEN=your_token_here
npm start
```

**Готово!** Отправьте `/start` боту в Telegram.

## ⚠️ Важно: Настройка токена

1. **Получите токен** у [@BotFather](https://t.me/BotFather) в Telegram
2. **Создайте файл .env** из шаблона: `cp env.template .env`
3. **Добавьте токен** в .env файл: `BOT_TOKEN=your_actual_token_here`
4. **Запустите** бота: `npm start`

## 📁 Структура проекта

```
scenarium-demo/
├── index.js               # Главный файл (запуск бота)
├── scenarios/
│   └── hello-world.json   # Простой сценарий
├── env.template           # Шаблон .env
└── package.json          # Зависимости
```

## 🎯 Код

```javascript
const { BotFactory } = require('scenarium');
require('dotenv').config();

async function startBot() {
  const token = process.env.BOT_TOKEN;
  const bot = await BotFactory.createBotFromFile('./scenarios/hello-world.json', token);
  await bot.start();
  console.log('✅ Бот запущен!');
}

startBot().catch(console.error);
```

## 🚀 Команды

- `npm start` - Запуск бота
- `node index.js` - Запуск бота

## 🔧 Настройка

1. Получите токен у [@BotFather](https://t.me/BotFather)
2. Скопируйте `env.template` в `.env`
3. Добавьте токен в `.env`
4. Запустите `npm start`

---

**Готово!** Теперь у вас есть работающий Telegram бот! 🎉
