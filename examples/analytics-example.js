const { AnalyticsInterface } = require('../dist/index');

// Пример сценария
const exampleScenario = {
  onStartActions: [
    {
      action: 'SendMessage',
      text: 'Добро пожаловать! 👋'
    }
  ],
  menuItems: {
    Main: {
      text: 'Главное меню',
      actions: [
        {
          action: 'SendMessage',
          text: 'Вы находитесь в главном меню'
        }
      ]
    },
    Help: {
      text: 'Помощь',
      actions: [
        {
          action: 'SendMessage',
          text: 'Это справочная информация'
        }
      ]
    }
  }
};

// Создаем бота с аналитикой
const bot = new AnalyticsInterface({
  token: 'YOUR_BOT_TOKEN_HERE', // Замените на ваш токен
  scenario: exampleScenario,
  botName: 'AnalyticsBot',
  callbacks: {
    onMessageReceived: (userId, message, messageData) => {
      console.log(`📨 Получено сообщение от ${userId}: ${message}`);
      console.log('📊 Данные сообщения:', messageData);
      
      // Здесь можно отправлять данные в вашу систему аналитики
      // Например, через API:
      // analyticsAPI.track('message_received', { userId, message, timestamp: new Date() });
    },
    
    onMessageSent: (userId, message, messageData) => {
      console.log(`📤 Отправлено сообщение пользователю ${userId}: ${message}`);
      console.log('📊 Данные отправки:', messageData);
      
      // Здесь можно отправлять данные в вашу систему аналитики
      // Например, через API:
      // analyticsAPI.track('message_sent', { userId, message, timestamp: new Date() });
    },
    
    onUserStarted: (userId, userData) => {
      console.log(`🚀 Пользователь ${userId} начал работу с ботом`);
      console.log('📊 Данные пользователя:', userData);
      
      // Здесь можно отправлять данные в вашу систему аналитики
      // Например, через API:
      // analyticsAPI.track('user_started', { userId, userData, timestamp: new Date() });
    },
    
    onUserAction: (userId, action, actionData) => {
      console.log(`🎯 Пользователь ${userId} выполнил действие: ${action}`);
      console.log('📊 Данные действия:', actionData);
      
      // Здесь можно отправлять данные в вашу систему аналитики
      // Например, через API:
      // analyticsAPI.track('user_action', { userId, action, actionData, timestamp: new Date() });
    },
    
    onError: (error, context) => {
      console.error(`❌ Ошибка в боте:`, error);
      console.error('📊 Контекст ошибки:', context);
      
      // Здесь можно отправлять данные об ошибках в вашу систему аналитики
      // Например, через API:
      // analyticsAPI.track('bot_error', { error: error.message, context, timestamp: new Date() });
    }
  }
});

// Запуск бота
async function startBot() {
  try {
    await bot.start();
    console.log('✅ Бот с аналитикой запущен!');
  } catch (error) {
    console.error('❌ Ошибка запуска бота:', error);
  }
}

// Остановка бота
async function stopBot() {
  try {
    await bot.stop();
    console.log('✅ Бот остановлен!');
  } catch (error) {
    console.error('❌ Ошибка остановки бота:', error);
  }
}

// Обработка сигналов завершения
process.on('SIGINT', async () => {
  console.log('\n🛑 Получен сигнал завершения...');
  await stopBot();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Получен сигнал завершения...');
  await stopBot();
  process.exit(0);
});

// Запускаем бота
startBot();
