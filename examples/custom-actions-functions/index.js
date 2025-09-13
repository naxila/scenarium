const { BotFactory, RegistryManager } = require('scenarium');
require('dotenv').config();

// Import only one custom action
const LogAction = require('./actions/LogAction').LogAction;

// Import custom functions
const { StringFunction } = require('./functions/StringFunction');
const { MathFunction } = require('./functions/MathFunction');

console.log('🎭 Custom Actions & Functions Demo');
console.log('==================================');
console.log('');

async function startBot() {
  try {
    // Check for bot token
    const token = process.env.BOT_TOKEN;
    if (!token || token === 'YOUR_BOT_TOKEN_HERE') {
      console.error('❌ Error: Bot token not found!');
      console.log('📝 Create .env file and add token:');
      console.log('   BOT_TOKEN=your_actual_bot_token_here');
      console.log('');
      console.log('💡 Get token from @BotFather in Telegram');
      process.exit(1);
    }

    // Register only one custom action
    console.log('🔧 Registering custom action...');
    RegistryManager.registerActions({
      'Log': new LogAction()
    }, {
      overwrite: true,
      verbose: true
    });
    console.log('✅ Custom action registered');

    // Register custom functions
    console.log('🔧 Registering custom functions...');
    RegistryManager.registerFunctions({
      'String': new StringFunction(),
      'Math': new MathFunction()
    }, {
      overwrite: true,
      verbose: true
    });
    console.log('✅ Custom functions registered');

    // Create bot from minimal scenario
    const bot = await BotFactory.createBotFromFile('./scenarios/minimal-demo.json', token);
    
    // Start the bot
    await bot.start();
    
    console.log('✅ Bot started! Send /start to the bot in Telegram');
    console.log('');
    console.log('📋 Available commands:');
    console.log('   /start - Start working with the bot');
    console.log('   /actions - Custom actions demonstration');
    console.log('   /functions - Custom functions demonstration');
    console.log('   /weather <city> - Get weather');
    console.log('   /calc <expression> - Calculate expression');
    console.log('   /string <operation> <text> - String operations');
    console.log('   /math <operation> <numbers> - Math operations');
    console.log('   /date <operation> - Date operations');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping bot...');
      await bot.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Bot startup error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Start the bot
if (require.main === module) {
  startBot();
}

module.exports = { startBot };
