const { BotFactory } = require('scenarium');
require('dotenv').config();

console.log('🎭 Scenarium Demo - Quick Start');
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

    // Create bot from scenario
    const bot = await BotFactory.createBotFromFile('./scenarios/hello-world.json', token);
    
    // Start the bot
    await bot.start();
    
    console.log('✅ Bot started! Send /start to the bot in Telegram');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping bot...');
      await bot.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Bot startup error:', error.message);
    process.exit(1);
  }
}

// Start the bot
if (require.main === module) {
  startBot();
}

module.exports = { startBot };
