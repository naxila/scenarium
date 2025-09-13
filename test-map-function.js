const { MapFunction } = require('./dist/functions/MapFunction');
const { InterpolationSystem } = require('./dist/interpolation/InterpolationSystem');
const { InterpolationContextBuilder } = require('./dist/interpolation/InterpolationContext');
const { ScopeManager } = require('./dist/interpolation/ScopeManager');

// Создаем тестовый контекст
const scopeManager = new ScopeManager();
const context = {
  interpolationContext: new InterpolationContextBuilder()
    .setEnv({})
    .setData({
      someButtonsArray: [
        {
          title: "Title 1",
          description: "Description 1"
        },
        {
          title: "Title 2", 
          description: "Description 2"
        }
      ],
      simpleArray: ["1", "2", "3"]
    })
    .setParams({})
    .build()
};

context.interpolationContext.local = scopeManager;

const mapFunction = new MapFunction();

async function runTests() {
  // Тест 1: Map с кнопками
  console.log('=== Тест 1: Map с кнопками ===');
  const test1 = {
    items: "{{someButtonsArray}}",
    forEach: {
      title: "{{it.title}}",
      onClick: {
        action: "SendMessage",
        text: "{{it.description}}"
      }
    }
  };

  try {
    const result1 = await mapFunction.execute(test1, context);
    console.log('Результат:', JSON.stringify(result1, null, 2));
    console.log('Тип:', typeof result1);
    console.log('Array.isArray:', Array.isArray(result1));
    console.log('Длина:', result1.length);
  } catch (error) {
    console.error('Ошибка:', error.message);
  }

  // Тест 2: Map с простыми строками
  console.log('\n=== Тест 2: Map с простыми строками ===');
  const test2 = {
    items: "{{simpleArray}}",
    forEach: {
      function: "JoinToString",
      values: ["Its ", "{{it}}"]
    }
  };

  try {
    const result2 = await mapFunction.execute(test2, context);
    console.log('Результат:', JSON.stringify(result2, null, 2));
    console.log('Тип:', typeof result2);
    console.log('Array.isArray:', Array.isArray(result2));
    console.log('Длина:', result2.length);
  } catch (error) {
    console.error('Ошибка:', error.message);
  }

  // Тест 3: Map с доступом к индексу
  console.log('\n=== Тест 3: Map с доступом к индексу ===');
  const test3 = {
    items: "{{simpleArray}}",
    forEach: {
      function: "JoinToString",
      values: ["Item ", "{{index}}", ": ", "{{it}}"]
    }
  };

  try {
    const result3 = await mapFunction.execute(test3, context);
    console.log('Результат:', JSON.stringify(result3, null, 2));
    console.log('Тип:', typeof result3);
    console.log('Array.isArray:', Array.isArray(result3));
    console.log('Длина:', result3.length);
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

runTests().catch(console.error);
