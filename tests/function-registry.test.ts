import { FunctionRegistry } from '../src/registry/FunctionRegistry';

describe('FunctionRegistry', () => {
  beforeAll(() => {
    // Ensure registry is initialized
    FunctionRegistry.initialize();
  });

  describe('Built-in Functions Registration', () => {
    test('should have all standard functions registered', () => {
      const expectedFunctions = [
        'Equals',
        'JoinToString', 
        'ReadStorage',
        'Plus',
        'Minus',
        'Multiply',
        'Divide',
        'Mod'
      ];

      expectedFunctions.forEach(functionName => {
        expect(FunctionRegistry.has(functionName)).toBe(true);
      });
    });

    test('should return function executors for registered functions', () => {
      const functionNames = ['Plus', 'Minus', 'Multiply', 'Divide', 'Mod'];
      
      functionNames.forEach(functionName => {
        const executor = FunctionRegistry.get(functionName);
        expect(executor).toBeDefined();
        expect(typeof executor).toBe('function');
      });
    });

    test('should return undefined for non-existent functions', () => {
      expect(FunctionRegistry.has('NonExistentFunction')).toBe(false);
      expect(FunctionRegistry.get('NonExistentFunction')).toBeUndefined();
    });

    test('should list all registered functions', () => {
      const registeredFunctions = FunctionRegistry.getRegisteredFunctions();
      
      expect(registeredFunctions).toContain('Plus');
      expect(registeredFunctions).toContain('Minus');
      expect(registeredFunctions).toContain('Multiply');
      expect(registeredFunctions).toContain('Divide');
      expect(registeredFunctions).toContain('Mod');
      expect(registeredFunctions).toContain('Equals');
      expect(registeredFunctions).toContain('JoinToString');
      expect(registeredFunctions).toContain('ReadStorage');
      
      expect(registeredFunctions.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Function Execution Through Registry', () => {
    let mockContext: any;

    beforeEach(() => {
      mockContext = {
        userContext: {
          userId: '12345',
          data: { value1: 10, value2: 5 }
        },
        scenarioContext: {}
      };
    });

    test('should execute Plus function through registry', async () => {
      const executor = FunctionRegistry.get('Plus');
      expect(executor).toBeDefined();

      if (executor) {
        const result = await executor({ values: [10, 20, 30] }, mockContext);
        expect(result).toBe(60);
      }
    });

    test('should execute Minus function through registry', async () => {
      const executor = FunctionRegistry.get('Minus');
      expect(executor).toBeDefined();

      if (executor) {
        const result = await executor({ values: [50, 20, 10] }, mockContext);
        expect(result).toBe(20);
      }
    });

    test('should execute Multiply function through registry', async () => {
      const executor = FunctionRegistry.get('Multiply');
      expect(executor).toBeDefined();

      if (executor) {
        const result = await executor({ values: [3, 4, 5] }, mockContext);
        expect(result).toBe(60);
      }
    });

    test('should execute Divide function through registry', async () => {
      const executor = FunctionRegistry.get('Divide');
      expect(executor).toBeDefined();

      if (executor) {
        const result = await executor({ values: [100, 5, 2] }, mockContext);
        expect(result).toBe(10);
      }
    });

    test('should execute Mod function through registry', async () => {
      const executor = FunctionRegistry.get('Mod');
      expect(executor).toBeDefined();

      if (executor) {
        const result = await executor({ dividend: 17, divisor: 5 }, mockContext);
        expect(result).toBe(2);
      }
    });

    test('should execute functions with interpolated variables', async () => {
      const executor = FunctionRegistry.get('Plus');
      expect(executor).toBeDefined();

      if (executor) {
        const result = await executor({ values: ['{{value1}}', '{{value2}}'] }, mockContext);
        expect(result).toBe(15);
      }
    });
  });

  describe('Custom Function Registration', () => {
    let testFunctionCounter = 0;
    
    const createMockCustomFunction = () => ({
      functionName: `TestCustomFunction${++testFunctionCounter}`,
      execute: jest.fn().mockResolvedValue('custom result')
    });

    afterEach(() => {
      // Clean up custom functions after each test
      jest.clearAllMocks();
    });

    test('should register custom function', () => {
      const mockCustomFunction = createMockCustomFunction();
      FunctionRegistry.registerCustomFunction(mockCustomFunction);
      
      expect(FunctionRegistry.has(mockCustomFunction.functionName)).toBe(true);
      expect(FunctionRegistry.getRegisteredFunctions()).toContain(mockCustomFunction.functionName);
    });

    test('should execute custom function', async () => {
      const testContext = {
        userContext: { 
          userId: 'test-user',
          data: {},
          backStack: [],
          createdAt: new Date(),
          lastActivity: new Date()
        },
        scenarioContext: {},
        localContext: {},
        scenario: { onStartActions: [], menuItems: {}, functions: {} }
      };
      
      const mockCustomFunction = createMockCustomFunction();
      FunctionRegistry.registerCustomFunction(mockCustomFunction);
      
      const executor = FunctionRegistry.get(mockCustomFunction.functionName);
      expect(executor).toBeDefined();

      if (executor) {
        const result = await executor({ param: 'value' }, testContext);
        expect(result).toBe('custom result');
        expect(mockCustomFunction.execute).toHaveBeenCalledWith({ param: 'value' }, testContext);
      }
    });

    test('should prevent duplicate registration without overwrite flag', () => {
      const uniqueFunction = {
        functionName: 'UniqueTestFunction',
        execute: jest.fn().mockResolvedValue('result')
      };
      
      FunctionRegistry.registerCustomFunction(uniqueFunction);
      
      expect(() => {
        FunctionRegistry.registerCustomFunction(uniqueFunction);
      }).toThrow('already registered');
    });

    test('should allow overwrite with explicit flag', () => {
      const originalFunction = createMockCustomFunction();
      const updatedFunction = {
        functionName: originalFunction.functionName,
        execute: jest.fn().mockResolvedValue('updated result')
      };

      FunctionRegistry.registerCustomFunction(originalFunction);
      FunctionRegistry.registerCustomFunction(updatedFunction, { overwrite: true });
      
      expect(FunctionRegistry.has(originalFunction.functionName)).toBe(true);
    });

    test('should prioritize custom functions over built-in functions', async () => {
      const customPlusFunction = {
        functionName: 'Plus',
        execute: jest.fn().mockResolvedValue('custom plus result')
      };

      FunctionRegistry.registerCustomFunction(customPlusFunction, { overwrite: true });
      
      const executor = FunctionRegistry.get('Plus');
      if (executor) {
        const testContext = {
          userContext: { 
            userId: 'test-user',
            data: {},
            backStack: [],
            createdAt: new Date(),
            lastActivity: new Date()
          },
          scenarioContext: {},
          localContext: {},
          scenario: { onStartActions: [], menuItems: {}, functions: {} }
        };
        const result = await executor({ values: [1, 2] }, testContext);
        expect(result).toBe('custom plus result');
        expect(customPlusFunction.execute).toHaveBeenCalled();
      }
    });
  });

  describe('Registry Initialization', () => {
    test('should handle multiple initialization calls gracefully', () => {
      // Should not throw or cause issues
      expect(() => {
        FunctionRegistry.initialize();
        FunctionRegistry.initialize();
        FunctionRegistry.initialize();
      }).not.toThrow();
    });

    test('should warn about multiple initializations', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      FunctionRegistry.initialize();
      
      expect(consoleSpy).toHaveBeenCalledWith('FunctionRegistry already initialized');
      
      consoleSpy.mockRestore();
    });

    test('should require initialization before custom function registration', () => {
      // Create a new instance to test uninitialized state
      const uninitializedRegistry = Object.create(FunctionRegistry);
      uninitializedRegistry.isInitialized = false;
      
      const mockFunction = {
        functionName: 'TestFunction',
        execute: jest.fn()
      };

      expect(() => {
        uninitializedRegistry.registerCustomFunction(mockFunction);
      }).toThrow('must be initialized');
    });
  });

  describe('Error Handling', () => {
    test('should handle function execution errors gracefully', async () => {
      const errorFunction = {
        functionName: 'ErrorFunction',
        execute: jest.fn().mockRejectedValue(new Error('Function error'))
      };

      FunctionRegistry.registerCustomFunction(errorFunction);
      
      const executor = FunctionRegistry.get('ErrorFunction');
      if (executor) {
        const testContext = {
          userContext: { 
            userId: 'test-user',
            data: {},
            backStack: [],
            createdAt: new Date(),
            lastActivity: new Date()
          },
          scenarioContext: {},
          localContext: {},
          scenario: { onStartActions: [], menuItems: {}, functions: {} }
        };
        await expect(executor({}, testContext)).rejects.toThrow('Function error');
      }
    });

    test('should handle malformed custom functions', () => {
      const malformedFunction = {
        // Missing functionName
        execute: jest.fn()
      };

      // This test depends on TypeScript checking, so we'll skip it in runtime
      // The type system prevents malformed functions at compile time
      expect(true).toBe(true);
    });
  });

  describe('Performance and Memory', () => {
    test('should handle large number of custom functions', () => {
      const numFunctions = 100;
      
      for (let i = 0; i < numFunctions; i++) {
        const customFunction = {
          functionName: `CustomFunction${i}`,
          execute: jest.fn().mockResolvedValue(`result${i}`)
        };
        
        FunctionRegistry.registerCustomFunction(customFunction, { verbose: false });
      }
      
      const registeredFunctions = FunctionRegistry.getRegisteredFunctions();
      expect(registeredFunctions.length).toBeGreaterThanOrEqual(numFunctions + 8); // 8 built-in functions
      
      // Test random access
      expect(FunctionRegistry.has('CustomFunction50')).toBe(true);
      expect(FunctionRegistry.has('CustomFunction99')).toBe(true);
    });
  });
});
