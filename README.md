# Scenarium

TypeScript library for creating Telegram bots from JSON scenarios.

## Installation

```bash
npm install scenarium
```

## Quick Start

```typescript
import { BotFactory } from 'scenarium';

// Create a bot from a JSON scenario
const bot = BotFactory.createFromScenario({
  token: 'YOUR_BOT_TOKEN',
  scenario: {
    // Your JSON scenario here
  }
});

// Start the bot
await bot.start();
```

## 📚 Examples

Check out the [examples directory](./examples/) for complete working examples:

- **[scenarium-demo](./examples/scenarium-demo/)** - Simple demo bot with basic functionality
- **[Full Documentation](./examples/README.md)** - Detailed examples and tutorials

## Features

- 🎭 **JSON-based scenarios** - Define bot behavior using simple JSON
- 🔧 **Extensible actions** - Create custom actions for your bot
- 📝 **Built-in functions** - Use pre-built functions for common tasks
- 🎯 **TypeScript support** - Full type safety and IntelliSense
- 🚀 **Easy to use** - Simple API for complex bot logic

## Basic Usage

### Creating a Bot

```typescript
import { BotFactory } from 'scenarium';

const bot = BotFactory.createFromScenario({
  token: 'YOUR_BOT_TOKEN',
  scenario: {
    name: 'My Bot',
    startMessage: 'Hello! Welcome to my bot.',
    actions: {
      // Define your actions here
    }
  }
});

await bot.start();
```

### Using Multiple Bots

```typescript
import { MultiBotManager } from 'scenarium';

const manager = new MultiBotManager({
  bots: [
    {
      name: 'bot1',
      token: 'TOKEN1',
      scenarioPath: './scenarios/bot1.json'
    },
    {
      name: 'bot2', 
      token: 'TOKEN2',
      scenarioPath: './scenarios/bot2.json'
    }
  ]
});

await manager.initialize();
await manager.startAll();
```

## API Reference

### BotFactory

Main factory class for creating bots.

#### Methods

- `createFromScenario(config)` - Create a bot from a scenario object
- `createFromFile(config)` - Create a bot from a scenario file

### MultiBotManager

Manages multiple bots simultaneously.

#### Methods

- `initialize()` - Initialize all bots
- `startAll()` - Start all bots
- `stopAll()` - Stop all bots
- `startBot(name)` - Start a specific bot
- `stopBot(name)` - Stop a specific bot

## License

MIT
