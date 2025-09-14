# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2-alpha] - 2024-12-19

### Added
- **AnalyticsInterface** - новый класс для интеграции аналитики с callback'ами событий
- **AnalyticsCallbacks** - интерфейс для обработки событий аналитики:
  - `onMessageReceived` - входящие сообщения
  - `onMessageSent` - исходящие сообщения  
  - `onUserStarted` - начало работы пользователя
  - `onUserAction` - действия пользователя
  - `onError` - обработка ошибок
- **SimpleBotInterface** - упрощенный интерфейс для быстрого создания ботов
- Интеграция аналитики в `TelegramAdapter` с минимальными изменениями архитектуры
- Поддержка callback'ов в `BotFactory` и `TelegramBotConstructor`
- Примеры использования в `examples/analytics-example.js`
- Документация по `AnalyticsInterface` в `ANALYTICS_INTERFACE.md`

### Changed
- `TelegramAdapter` теперь поддерживает опциональные `analyticsCallbacks`
- `BotFactory.createBot()` принимает параметр `analyticsCallbacks`
- `TelegramBotConstructor` передает callback'и в `TelegramAdapter`

### Fixed
- Улучшена обработка ошибок в callback'ах аналитики
- Оптимизирована производительность при работе с аналитикой

### Security
- Callback'и аналитики выполняются в безопасном контексте без доступа к внутренним данным бота

## [0.1.1-alpha] - 2024-12-18

### Added
- Базовая функциональность библиотеки
- Поддержка JSON сценариев для Telegram ботов
- TypeScript типизация
- Система меню и навигации
- Обработка команд и сообщений
- Система сессий пользователей