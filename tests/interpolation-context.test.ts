import { InterpolationContextBuilder } from '../src/interpolation/InterpolationContext';

describe('InterpolationContextBuilder', () => {
  let baseContext: any;

  beforeEach(() => {
    baseContext = {
      userContext: {
        userId: '12345',
        data: {
          userName: 'TestUser',
          userEmail: 'test@example.com',
          preferences: {
            theme: 'dark',
            language: 'ru'
          }
        }
      },
      scenarioContext: {
        botName: 'TestBot',
        version: '1.0.0',
        apiEndpoint: 'https://api.test.com'
      }
    };
  });

  describe('Context Creation', () => {
    test('should create context with default values', () => {
      const context = InterpolationContextBuilder.createContext(baseContext);
      
      expect(context.env).toBeDefined();
      expect(context.data).toBeDefined();
      expect(context.local).toBeDefined();
      expect(context.params).toBeDefined();
    });

    test('should include system environment variables', () => {
      const context = InterpolationContextBuilder.createContext(baseContext);
      
      expect(context.env.version).toBe('0.1.0-alpha');
      expect(context.env.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(context.env.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(context.env.time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    test('should merge scenario and user data', () => {
      const context = InterpolationContextBuilder.createContext(baseContext);
      
      // Should include user data
      expect(context.data.userName).toBe('TestUser');
      expect(context.data.userEmail).toBe('test@example.com');
      
      // Should include scenario data
      expect(context.data.botName).toBe('TestBot');
      expect(context.data.apiEndpoint).toBe('https://api.test.com');
    });

    test('should handle nested data flattening', () => {
      const contextWithNestedData = {
        ...baseContext,
        userContext: {
          ...baseContext.userContext,
          data: {
            ...baseContext.userContext.data,
            data: {
              nestedValue: 'should be flattened'
            }
          }
        }
      };
      
      const context = InterpolationContextBuilder.createContext(contextWithNestedData);
      
      expect(context.data.nestedValue).toBe('should be flattened');
    });

    test('should include function parameters', () => {
      const params = { param1: 'value1', param2: 42 };
      const context = InterpolationContextBuilder.createContext(baseContext, params);
      
      expect(context.params.param1).toBe('value1');
      expect(context.params.param2).toBe(42);
    });

    test('should initialize local scope with provided data', () => {
      const localScope = { localVar: 'localValue' };
      const context = InterpolationContextBuilder.createContext(baseContext, {}, localScope);
      
      expect(context.local.findVariable('localVar')).toBe('localValue');
    });
  });

  describe('Data Priority and Merging', () => {
    test('should prioritize user data over scenario data', () => {
      const contextWithConflict = {
        userContext: {
          data: { sharedKey: 'userValue' }
        },
        scenarioContext: {
          sharedKey: 'scenarioValue'
        }
      };
      
      const context = InterpolationContextBuilder.createContext(contextWithConflict);
      
      expect(context.data.sharedKey).toBe('userValue');
    });

    test('should handle missing userContext', () => {
      const contextWithoutUser = {
        scenarioContext: {
          botName: 'TestBot'
        }
      };
      
      const context = InterpolationContextBuilder.createContext(contextWithoutUser);
      
      expect(context.data.botName).toBe('TestBot');
      expect(context.data).not.toHaveProperty('userName');
    });

    test('should handle missing scenarioContext', () => {
      const contextWithoutScenario = {
        userContext: {
          data: { userName: 'TestUser' }
        }
      };
      
      const context = InterpolationContextBuilder.createContext(contextWithoutScenario);
      
      expect(context.data.userName).toBe('TestUser');
      expect(context.data).not.toHaveProperty('botName');
    });

    test('should handle completely empty context', () => {
      const emptyContext = {};
      
      const context = InterpolationContextBuilder.createContext(emptyContext);
      
      expect(context.env).toBeDefined();
      expect(context.data).toEqual({});
      expect(context.local).toBeDefined();
      expect(context.params).toEqual({});
    });
  });

  describe('Builder Pattern', () => {
    test('should work with builder pattern', () => {
      const builder = new InterpolationContextBuilder();
      
      const context = builder
        .setEnv({ customEnv: 'value' })
        .setData({ customData: 'data' })
        .setParams({ customParam: 'param' })
        .build();
      
      expect(context.env.customEnv).toBe('value');
      expect(context.data.customData).toBe('data');
      expect(context.params.customParam).toBe('param');
    });

    test('should use default values when not set', () => {
      const builder = new InterpolationContextBuilder();
      const context = builder.build();
      
      expect(context.env).toEqual({});
      expect(context.data).toEqual({});
      expect(context.params).toEqual({});
      expect(context.local).toBeDefined();
    });

    test('should allow partial setting', () => {
      const builder = new InterpolationContextBuilder();
      
      const context = builder
        .setData({ onlyData: true })
        .build();
      
      expect(context.data.onlyData).toBe(true);
      expect(context.env).toEqual({});
      expect(context.params).toEqual({});
    });
  });

  describe('Complex Data Structures', () => {
    test('should handle deeply nested objects', () => {
      const complexContext = {
        userContext: {
          data: {
            level1: {
              level2: {
                level3: {
                  value: 'deep value'
                }
              }
            }
          }
        }
      };
      
      const context = InterpolationContextBuilder.createContext(complexContext);
      
      expect(context.data.level1.level2.level3.value).toBe('deep value');
    });

    test('should handle arrays in data', () => {
      const contextWithArrays = {
        userContext: {
          data: {
            items: ['item1', 'item2', 'item3'],
            complexItems: [
              { id: 1, name: 'first' },
              { id: 2, name: 'second' }
            ]
          }
        }
      };
      
      const context = InterpolationContextBuilder.createContext(contextWithArrays);
      
      expect(context.data.items).toEqual(['item1', 'item2', 'item3']);
      expect(context.data.complexItems[0].name).toBe('first');
    });

    test('should handle mixed data types', () => {
      const mixedContext = {
        userContext: {
          data: {
            stringValue: 'string',
            numberValue: 42,
            booleanValue: true,
            nullValue: null,
            undefinedValue: undefined,
            objectValue: { key: 'value' },
            arrayValue: [1, 2, 3]
          }
        }
      };
      
      const context = InterpolationContextBuilder.createContext(mixedContext);
      
      expect(context.data.stringValue).toBe('string');
      expect(context.data.numberValue).toBe(42);
      expect(context.data.booleanValue).toBe(true);
      expect(context.data.nullValue).toBeNull();
      expect(context.data.undefinedValue).toBeUndefined();
      expect(context.data.objectValue).toEqual({ key: 'value' });
      expect(context.data.arrayValue).toEqual([1, 2, 3]);
    });
  });

  describe('System Variables Consistency', () => {
    test('should generate consistent timestamps within same call', () => {
      const context1 = InterpolationContextBuilder.createContext(baseContext);
      const context2 = InterpolationContextBuilder.createContext(baseContext);
      
      // Timestamps should be very close (within same second)
      const time1 = new Date(context1.env.timestamp).getTime();
      const time2 = new Date(context2.env.timestamp).getTime();
      
      expect(Math.abs(time1 - time2)).toBeLessThan(1000); // Within 1 second
    });

    test('should generate same date for contexts created on same day', () => {
      const context1 = InterpolationContextBuilder.createContext(baseContext);
      const context2 = InterpolationContextBuilder.createContext(baseContext);
      
      expect(context1.env.date).toBe(context2.env.date);
    });

    test('should have consistent version across contexts', () => {
      const context1 = InterpolationContextBuilder.createContext(baseContext);
      const context2 = InterpolationContextBuilder.createContext(baseContext);
      
      expect(context1.env.version).toBe('0.1.0-alpha');
      expect(context2.env.version).toBe('0.1.0-alpha');
      expect(context1.env.version).toBe(context2.env.version);
    });
  });

  describe('Memory and Performance', () => {
    test('should handle large data structures efficiently', () => {
      const largeData: any = {};
      for (let i = 0; i < 1000; i++) {
        largeData[`key${i}`] = `value${i}`;
      }
      
      const largeContext = {
        userContext: { data: largeData }
      };
      
      const context = InterpolationContextBuilder.createContext(largeContext);
      
      expect(context.data.key500).toBe('value500');
      expect(context.data.key999).toBe('value999');
    });

    test('should not modify original context data', () => {
      const originalData = { mutableValue: 'original' };
      const testContext = {
        userContext: { data: originalData }
      };
      
      const context = InterpolationContextBuilder.createContext(testContext);
      context.data.mutableValue = 'modified';
      
      // Original should not be affected
      expect(originalData.mutableValue).toBe('original');
    });
  });
});
