const { BaseActionProcessor } = require('scenarium/dist/actions/BaseAction');
const axios = require('axios');

/**
 * Кастомное действие для получения погоды
 * Демонстрирует создание действия с внешним API
 */
class WeatherAction extends BaseActionProcessor {
  get actionType() { return 'Weather'; }

  async process(action, context) {
    // Create interpolation context for this action
    const interpolationContext = this.createInterpolationContext(context);
    
    // Create local scope for action-specific variables
    interpolationContext.local.createScope();
    
    try {
      // Interpolate the action with current context
      const interpolatedAction = this.interpolate(action, interpolationContext);
      const { city } = interpolatedAction;
      const apiKey = process.env.WEATHER_API_KEY;
      
      if (!apiKey) {
        console.warn('Weather API key not found. Using mock data.');
        const mockWeather = {
          city: city,
          temperature: Math.round(Math.random() * 30 - 10),
          description: 'Partly cloudy',
          humidity: Math.round(Math.random() * 100),
          windSpeed: Math.round(Math.random() * 20)
        };
        
        // Сохраняем данные о погоде в контекст пользователя
        context.userContext.data.weather = mockWeather;
        context.userContext.data.lastWeatherUpdate = new Date().toISOString();
        
        console.log(`🌤️ Mock weather for ${city}:`, mockWeather);
        this.updateUserActivity(context);
        return;
      }
      
      try {
        // Получаем реальные данные о погоде
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
          params: {
            q: city,
            appid: apiKey,
            units: 'metric',
            lang: 'ru'
          }
        });
        
        const weatherData = {
          city: response.data.name,
          temperature: Math.round(response.data.main.temp),
          description: response.data.weather[0].description,
          humidity: response.data.main.humidity,
          windSpeed: response.data.wind.speed,
          country: response.data.sys.country
        };
        
        // Сохраняем данные о погоде в контекст пользователя
        context.userContext.data.weather = weatherData;
        context.userContext.data.lastWeatherUpdate = new Date().toISOString();
        
        console.log(`🌤️ Weather for ${city}:`, weatherData);
        
      } catch (apiError) {
        console.error('Weather API error:', apiError.message);
        
        // Fallback на mock данные
        const mockWeather = {
          city: city,
          temperature: Math.round(Math.random() * 30 - 10),
          description: 'Service unavailable',
          humidity: Math.round(Math.random() * 100),
          windSpeed: Math.round(Math.random() * 20)
        };
        
        context.userContext.data.weather = mockWeather;
        context.userContext.data.lastWeatherUpdate = new Date().toISOString();
        console.log(`🌤️ Fallback weather for ${city}:`, mockWeather);
      }
      
      this.updateUserActivity(context);
    } finally {
      interpolationContext.local.clearScope();
    }
  }
}

module.exports = { WeatherAction };
