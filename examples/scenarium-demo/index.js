const { BotFactory } = require('scenarium');
require('dotenv').config();

console.log('🎭 Scenarium Demo - Быстрый старт');
console.log('==================================');
console.log('');

async function startBot() {
  try {
    // Проверяем наличие токена
    const token = process.env.BOT_TOKEN;
    if (!token || token === 'YOUR_BOT_TOKEN_HERE') {
      console.error('❌ Ошибка: Токен бота не найден!');
      console.log('📝 Создайте файл .env и добавьте токен:');
      console.log('   BOT_TOKEN=your_actual_bot_token_here');
      console.log('');
      console.log('💡 Получите токен у @BotFather в Telegram');
      process.exit(1);
    }

    // Создаем бота из сценария
    const bot = await BotFactory.createBotFromFile('./scenarios/hello-world.json', token);
    
    // Запускаем бота
    await bot.start();
    
    console.log('✅ Бот запущен! Отправьте /start боту в Telegram');
    
    // Обработка graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Остановка бота...');
      await bot.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Ошибка запуска бота:', error.message);
    process.exit(1);
  }
}

// Запускаем бота
if (require.main === module) {
  startBot();
}

module.exports = { startBot };
