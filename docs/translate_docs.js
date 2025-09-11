const fs = require('fs');
const path = require('path');

// Переводы для основных элементов
const translations = {
    // Заголовки разделов
    'Overview': 'Обзор',
    'Installation': 'Установка',
    'Quick Start': 'Быстрый старт',
    'Scenarios': 'Сценарии',
    'Custom Actions': 'Кастомные действия',
    'Custom Functions': 'Кастомные функции',
    'Interpolation': 'Интерполяция',
    'Examples': 'Примеры',
    'Built-in Actions': 'Встроенные действия',
    'Built-in Functions': 'Встроенные функции',
    
    // Описания
    'TypeScript library for creating Telegram bots from JSON scenarios with support for extensible actions and functions.': 
        'TypeScript библиотека для создания Telegram ботов из JSON-сценариев с поддержкой расширяемых действий и функций.',
    
    'Install Scenarium using npm:': 'Установите Scenarium с помощью npm:',
    'Requirements': 'Требования',
    'for TypeScript projects': 'для TypeScript проектов',
    
    'Get started with Scenarium in just a few steps:': 'Начните работу с Scenarium всего за несколько шагов:',
    'Create a Bot': 'Создайте бота',
    'First, create a bot using': 'Сначала создайте бота используя',
    'and get your bot token.': 'и получите токен вашего бота.',
    'Install Dependencies': 'Установите зависимости',
    'Create a Simple Scenario': 'Создайте простой сценарий',
    'Create a file called': 'Создайте файл с именем',
    'Create Your Bot Instance': 'Создайте экземпляр бота',
    'Create a file called': 'Создайте файл с именем',
    'Set Environment Variables': 'Настройте переменные окружения',
    'Create a': 'Создайте файл',
    'file:': 'файл:',
    'Run Your Bot': 'Запустите бота',
    'That\'s it! Your bot is now running. Send': 'Готово! Ваш бот теперь работает. Отправьте',
    'to your bot in Telegram to test it.': 'вашему боту в Telegram для тестирования.',
    
    // Ключевые особенности
    'Key Features': 'Ключевые особенности',
    'Modular Architecture': 'Модульная архитектура',
    'break down complex bots into logical modules': 'разбивайте сложные боты на логические модули',
    'Navigation System': 'Система навигации',
    'full navigation with back stack support': 'полноценная навигация с поддержкой стека возврата',
    'Input Handling': 'Обработка ввода',
    'request and validate user input': 'запрос и валидация пользовательского ввода',
    'Message Management': 'Управление сообщениями',
    'send, update and delete messages': 'отправка, обновление и удаление сообщений',
    'Multi-user Support': 'Многопользовательская поддержка',
    'isolated sessions for each user': 'изолированные сессии для каждого пользователя',
    'TypeScript': 'TypeScript',
    'full type safety for reliable development': 'полная типизация для надежной разработки',
    'Custom Actions & Functions': 'Кастомные действия и функции',
    'extend functionality with custom code': 'расширяйте функциональность собственным кодом',
    'NPM Package': 'NPM пакет',
    'easy installation and integration': 'простая установка и интеграция',
    
    // Действия
    'Actions are the basic building blocks for creating bot logic. Each action performs a specific function.': 
        'Действия - это основные строительные блоки для создания логики бота. Каждое действие выполняет определенную функцию.',
    'Core Actions': 'Основные действия',
    'Send messages with inline buttons': 'Отправка сообщений с inline-кнопками',
    'Universal action for custom logic': 'Универсальное действие для кастомной логики',
    'Navigation': 'Навигация',
    'Navigate to menu item': 'Переход к элементу меню',
    'Return to previous menu': 'Возврат к предыдущему меню',
    'Message Management': 'Управление сообщениями',
    'Update message': 'Обновление сообщения',
    'Delete message': 'Удаление сообщения',
    'Input Handling': 'Обработка ввода',
    'Request input from user': 'Запрос ввода от пользователя',
    'Cancel input waiting': 'Отмена ожидания ввода',
    'Storage': 'Хранилище',
    'Store data': 'Сохранение данных',
    'API Integration': 'API интеграция',
    'HTTP requests to external APIs': 'HTTP запросы к внешним API',
    'Scenario Management': 'Управление сценариями',
    'Update scenario': 'Обновление сценария',
    'Set personal scenario': 'Установка персонального сценария',
    'Remove personal scenario': 'Удаление персонального сценария',
    'Upload personal scenario': 'Загрузка персонального сценария',
    
    // Функции
    'Functions allow you to create complex data processing and calculation logic.': 
        'Функции позволяют создавать сложную логику обработки данных и вычислений.',
    'String Functions': 'Строковые функции',
    'Join array of values into string': 'Объединение массива значений в строку',
    'Logical Functions': 'Логические функции',
    'Compare values with conditional result': 'Сравнение значений с условным результатом',
    'Storage Functions': 'Функции хранилища',
    'Read data from storage': 'Чтение данных из хранилища',
    
    // Интерполяция
    'The interpolation system allows you to dynamically substitute variables in texts and parameters.': 
        'Система интерполяции позволяет динамически подставлять переменные в тексты и параметры.',
    'Available Contexts': 'Доступные контексты',
    'User data': 'Данные пользователя',
    'User ID': 'ID пользователя',
    'User name': 'Имя пользователя',
    'User email': 'Email пользователя',
    'Current menu': 'Текущее меню',
    'Scenario data': 'Данные сценария',
    'API URL': 'URL API',
    'Scenario version': 'Версия сценария',
    'Local variables': 'Локальные переменные',
    'Message ID': 'ID сообщения',
    'API response': 'Ответ API',
    'Error': 'Ошибка',
    'User input': 'Пользовательский ввод',
    'Entered name': 'Введенное имя',
    'Entered email': 'Введенный email',
    'Usage Examples': 'Примеры использования',
    
    // Примеры
    'Scenario Examples': 'Примеры сценариев',
    'Practical examples of creating bots with various functionality.': 
        'Практические примеры создания ботов с различной функциональностью.',
    'Survey Bot': 'Бот-опросник',
    'Simple bot for collecting information from users': 'Простой бот для сбора информации от пользователей',
    'Bot with API Integration': 'Бот с API интеграцией',
    'Bot for getting data from external APIs': 'Бот для получения данных из внешних API',
    'User Profile Bot': 'Бот с профилем пользователя',
    'Bot with registration system and profile management': 'Бот с системой регистрации и управления профилем',
    'Shopping Bot': 'Бот-магазин',
    'Simple bot for demonstrating shopping cart functionality': 'Простой бот для демонстрации корзины покупок'
};

function translateText(text) {
    let translated = text;
    
    // Заменяем переводы
    for (const [en, ru] of Object.entries(translations)) {
        const regex = new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        translated = translated.replace(regex, ru);
    }
    
    return translated;
}

function translateHtmlFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Переводим содержимое
        content = translateText(content);
        
        // Записываем обратно
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Translated: ${filePath}`);
    } catch (error) {
        console.error(`Error translating ${filePath}:`, error.message);
    }
}

// Переводим русскую версию
const ruDir = path.join(__dirname, 'ru');
const files = fs.readdirSync(ruDir, { recursive: true });

files.forEach(file => {
    if (file.endsWith('.html')) {
        translateHtmlFile(path.join(ruDir, file));
    }
});

console.log('Translation completed!');
