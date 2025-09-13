const dotenv = require('dotenv');
const { BotFactory, FunctionRegistry, ActionRegistry } = require('scenarium');

// Импортируем кастомные функции и действия
const { FormatUserListFunction } = require('./custom/FormatUserListFunction');
const { CalculateStatsFunction } = require('./custom/CalculateStatsFunction');
const { ShowUserStatsAction } = require('./custom/ShowUserStatsAction');

// Загружаем переменные окружения
dotenv.config();

async function main() {
  try {
    console.log('🚀 Запуск демо проекта с кастомными функциями и действиями...');
    
    // Получаем токен бота
    const token = process.env.BOT_TOKEN;
    if (!token) {
      console.error('❌ Ошибка: BOT_TOKEN не найден в переменных окружения');
      console.log('📝 Создайте файл .env с содержимым: BOT_TOKEN=your_bot_token_here');
      process.exit(1);
    }
    
    // Регистрируем кастомные функции
    console.log('📝 Регистрация кастомных функций...');
    
    // Функция с интерфейсом ICustomFunction
    FunctionRegistry.registerFunction('FormatUserList', new FormatUserListFunction());
    
    // Функция со статическим методом execute
    FunctionRegistry.registerFunction('CalculateStats', CalculateStatsFunction);
    
    console.log('✅ Кастомные функции зарегистрированы');
    
    // Регистрируем кастомные действия
    console.log('📝 Регистрация кастомных действий...');
    
    ActionRegistry.registerAction('ShowUserStats', new ShowUserStatsAction());
    
    console.log('✅ Кастомные действия зарегистрированы');
    
    // Создаем бота из сценария
    console.log('🤖 Создание бота из сценария...');
    const bot = await BotFactory.createBotFromFile('./scenarios/custom-demo.json', token);
    
    console.log('✅ Бот успешно создан и запущен!');
    console.log('📱 Отправьте /start боту для начала демонстрации');
    console.log('🛑 Нажмите Ctrl+C для остановки');
    
  } catch (error) {
    console.error('❌ Ошибка при запуске:', error);
    process.exit(1);
  }
}

// Обработка сигналов завершения
process.on('SIGINT', () => {
  console.log('\n👋 Завершение работы демо проекта...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Завершение работы демо проекта...');
  process.exit(0);
});

// Запускаем приложение
main();
