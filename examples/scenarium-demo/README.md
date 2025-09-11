# Scenarium Demo - Interpolation System

Demonstration project showcasing the new interpolation system in [Scenarium](https://www.npmjs.com/package/scenarium) library.

## 🚀 Launch in 3 commands

```bash
npm install
cp env.template .env
# Edit .env and add bot token: BOT_TOKEN=your_token_here
npm start
```

**Done!** Send `/start` to the bot in Telegram.

## ⚠️ Important: Token Setup

1. **Get token** from [@BotFather](https://t.me/BotFather) in Telegram
2. **Create .env file** from template: `cp env.template .env`
3. **Add token** to .env file: `BOT_TOKEN=your_actual_token_here`
4. **Start** the bot: `npm start`

## 📁 Project Structure

```
scenarium-demo/
├── index.js                    # Main file (bot startup)
├── scenarios/
│   ├── hello-world.json        # Simple scenario
│   └── interpolation-demo.json # Interpolation system demo
├── env.template                # .env template
└── package.json               # Dependencies
```

## 🎯 Interpolation Demo Features

The demo showcases the new interpolation system with:

- **Basic Variables**: Access to scenario data, user data, and environment variables
- **Local Scopes**: Action and function-specific variables with proper scoping
- **Functions**: JoinToString and Equals functions with interpolation
- **Complex Objects**: Nested data structures and API requests
- **Priority System**: Local → Params → Data → Environment

### Example Usage

```json
{
  "data": {
    "botName": "Demo Bot",
    "user": { "name": "John" }
  },
  "action": "SendMessage",
  "text": "Hello {{user.name}}! Welcome to {{botName}} at {{timestamp}}"
}
```

## 🎯 Code

```javascript
const { BotFactory } = require('scenarium');
require('dotenv').config();

async function startBot() {
  const token = process.env.BOT_TOKEN;
  const bot = await BotFactory.createBotFromFile('./scenarios/hello-world.json', token);
  await bot.start();
  console.log('✅ Bot started!');
}

startBot().catch(console.error);
```

## 🚀 Commands

- `npm start` - Start the bot
- `node index.js` - Start the bot

## 🔧 Setup

1. Get token from [@BotFather](https://t.me/BotFather)
2. Copy `env.template` to `.env`
3. Add token to `.env`
4. Run `npm start`

---

**Done!** Now you have a working Telegram bot! 🎉
