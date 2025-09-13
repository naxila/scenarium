const { InterpolationSystem } = require('./dist/interpolation/InterpolationSystem');
const { InterpolationContextBuilder } = require('./dist/interpolation/InterpolationContext');
const { ScopeManager } = require('./dist/interpolation/ScopeManager');

// Создаем тестовый контекст
const scopeManager = new ScopeManager();
const context = new InterpolationContextBuilder()
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
  .build();

// Устанавливаем local scope
context.local = scopeManager;

// Тест 1: Прямая интерполяция массива (в строке - должно быть строкой)
console.log('=== Тест 1: Интерполяция массива в строке ===');
const test1 = {
  items: "{{someButtonsArray}}"
};

const result1 = InterpolationSystem.interpolate(test1, context);
console.log('Результат:', result1);
console.log('Тип items:', typeof result1.items);
console.log('Array.isArray(items):', Array.isArray(result1.items));

// Тест 1.1: Прямая интерполяция массива (в объекте - должно быть массивом)
console.log('\n=== Тест 1.1: Интерполяция массива в объекте ===');
const test1_1 = {
  items: "{{someButtonsArray}}"
};

const result1_1 = InterpolationSystem.interpolate(test1_1, context);
console.log('Результат:', result1_1);
console.log('Тип items:', typeof result1_1.items);
console.log('Array.isArray(items):', Array.isArray(result1_1.items));

// Тест 1.2: Массив без строковой интерполяции
console.log('\n=== Тест 1.2: Массив без строковой интерполяции ===');
const test1_2 = {
  items: "{{someButtonsArray}}"
};

const result1_2 = InterpolationSystem.interpolate(test1_2, context);
console.log('Результат:', result1_2);
console.log('Тип items:', typeof result1_2.items);
console.log('Array.isArray(items):', Array.isArray(result1_2.items));

// Тест 2: Массив в объекте
console.log('\n=== Тест 2: Массив в объекте ===');
const test2 = {
  action: "SendMessage",
  text: "Some text",
  inlineButtons: "{{someButtonsArray}}"
};

const result2 = InterpolationSystem.interpolate(test2, context);
console.log('Результат:', result2);
console.log('Тип inlineButtons:', typeof result2.inlineButtons);
console.log('Array.isArray(inlineButtons):', Array.isArray(result2.inlineButtons));

// Тест 3: Простой массив строк
console.log('\n=== Тест 3: Простой массив строк ===');
const test3 = {
  data: "{{simpleArray}}"
};

const result3 = InterpolationSystem.interpolate(test3, context);
console.log('Результат:', result3);
console.log('Тип:', typeof result3);
console.log('Array.isArray:', Array.isArray(result3));

// Тест 4: Массив в функции
console.log('\n=== Тест 4: Массив в функции ===');
const test4 = {
  function: "JoinToString",
  values: "{{simpleArray}}"
};

const result4 = InterpolationSystem.interpolate(test4, context);
console.log('Результат:', result4);
console.log('Тип values:', typeof result4.values);
console.log('Array.isArray(values):', Array.isArray(result4.values));

// Тест 5: Смешанный текст с массивом (должен быть строкой)
console.log('\n=== Тест 5: Смешанный текст с массивом ===');
const test5 = {
  message: "Array: {{simpleArray}} and more text"
};

const result5 = InterpolationSystem.interpolate(test5, context);
console.log('Результат:', result5);
console.log('Тип message:', typeof result5.message);
console.log('Array.isArray(message):', Array.isArray(result5.message));
console.log('Содержимое:', result5.message);
