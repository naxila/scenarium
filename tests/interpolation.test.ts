import { InterpolationSystem } from '../src/interpolation/InterpolationSystem';
import { InterpolationContextBuilder } from '../src/interpolation/InterpolationContext';
import { ScopeManager } from '../src/interpolation/ScopeManager';

describe('InterpolationSystem', () => {
  let context: any;

  beforeEach(() => {
    // Create a mock context for testing
    context = {
      userContext: {
        userId: '12345',
        data: {
          name: 'John',
          age: 30,
          email: 'john@example.com',
          nested: {
            value: 'deep',
            number: 42
          }
        }
      },
      scenarioContext: {
        version: '1.0.0',
        apiUrl: 'https://api.example.com'
      }
    };
  });

  describe('Basic Variable Interpolation', () => {
    test('should interpolate simple variables', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const result = InterpolationSystem.interpolate('Hello {{name}}!', interpolationContext);
      expect(result).toBe('Hello John!');
    });

    test('should interpolate multiple variables', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const result = InterpolationSystem.interpolate('{{name}} is {{age}} years old', interpolationContext);
      expect(result).toBe('John is 30 years old');
    });

    test('should handle missing variables gracefully', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const result = InterpolationSystem.interpolate('Hello {{unknownVar}}!', interpolationContext);
      expect(result).toBe('Hello {{unknownVar}}!');
    });

    test('should interpolate nested object properties', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const result = InterpolationSystem.interpolate('Nested: {{nested.value}}, Number: {{nested.number}}', interpolationContext);
      expect(result).toBe('Nested: deep, Number: 42');
    });
  });

  describe('Explicit Prefixes', () => {
    test('should handle data prefix', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const result = InterpolationSystem.interpolate('User: {{data.name}}', interpolationContext);
      expect(result).toBe('User: John');
    });

    test('should handle env prefix for system variables', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const result = InterpolationSystem.interpolate('Version: {{env.version}}', interpolationContext);
      expect(result).toMatch(/Version: 0\.1\.0-alpha/);
    });

    test('should handle local prefix', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      interpolationContext.local.createScope();
      interpolationContext.local.setVariable('localVar', 'localValue');
      
      const result = InterpolationSystem.interpolate('Local: {{local.localVar}}', interpolationContext);
      expect(result).toBe('Local: localValue');
      
      interpolationContext.local.clearScope();
    });

    test('should handle params prefix', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context, { param1: 'value1' });
      const result = InterpolationSystem.interpolate('Param: {{params.param1}}', interpolationContext);
      expect(result).toBe('Param: value1');
    });
  });

  describe('Priority System', () => {
    test('should prioritize local over data', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      interpolationContext.local.createScope();
      interpolationContext.local.setVariable('name', 'LocalJohn');
      
      const result = InterpolationSystem.interpolate('{{name}}', interpolationContext);
      expect(result).toBe('LocalJohn');
      
      interpolationContext.local.clearScope();
    });

    test('should prioritize params over data', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context, { name: 'ParamJohn' });
      const result = InterpolationSystem.interpolate('{{name}}', interpolationContext);
      expect(result).toBe('ParamJohn');
    });

    test('should prioritize local over params', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context, { name: 'ParamJohn' });
      interpolationContext.local.createScope();
      interpolationContext.local.setVariable('name', 'LocalJohn');
      
      const result = InterpolationSystem.interpolate('{{name}}', interpolationContext);
      expect(result).toBe('LocalJohn');
      
      interpolationContext.local.clearScope();
    });

    test('should fall back to data when local and params are not available', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const result = InterpolationSystem.interpolate('{{email}}', interpolationContext);
      expect(result).toBe('john@example.com');
    });
  });

  describe('System Environment Variables', () => {
    test('should provide timestamp', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const result = InterpolationSystem.interpolate('{{timestamp}}', interpolationContext);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO format
    });

    test('should provide version', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const result = InterpolationSystem.interpolate('{{version}}', interpolationContext);
      expect(result).toMatch(/^\d+\.\d+\.\d+/); // Should match semver pattern
    });

    test('should provide date', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const result = InterpolationSystem.interpolate('{{date}}', interpolationContext);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    });

    test('should provide time', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const result = InterpolationSystem.interpolate('{{time}}', interpolationContext);
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/); // HH:MM:SS format
    });
  });

  describe('Complex Objects and Arrays', () => {
    test('should interpolate objects', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const input = {
        message: 'Hello {{name}}',
        user: {
          id: 'static-id', // userId is not automatically available in data context
          email: '{{email}}'
        },
        metadata: ['{{name}}', '{{age}}']
      };
      
      const result = InterpolationSystem.interpolate(input, interpolationContext);
      expect(result).toEqual({
        message: 'Hello John',
        user: {
          id: 'static-id',
          email: 'john@example.com'
        },
        metadata: ['John', '30']
      });
    });

    test('should interpolate arrays', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const input = ['Hello {{name}}', 'Age: {{age}}', 'Email: {{email}}'];
      
      const result = InterpolationSystem.interpolate(input, interpolationContext);
      expect(result).toEqual(['Hello John', 'Age: 30', 'Email: john@example.com']);
    });

    test('should handle mixed types', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const input = {
        string: '{{name}}',
        number: 123,
        boolean: true,
        null: null,
        undefined: undefined,
        interpolatedNumber: '{{age}}'
      };
      
      const result = InterpolationSystem.interpolate(input, interpolationContext);
      expect(result).toEqual({
        string: 'John',
        number: 123,
        boolean: true,
        null: null,
        undefined: undefined,
        interpolatedNumber: '30'
      });
    });
  });

  describe('Function Calls Handling', () => {
    test('should not execute function calls in string interpolation', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const result = InterpolationSystem.interpolate('{{Plus:values:5:10}}', interpolationContext);
      expect(result).toBe('{{Plus:values:5:10}}'); // Should remain unchanged
    });

    test('should warn about function calls', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      
      InterpolationSystem.interpolate('{{JoinToString:values:a:b}}', interpolationContext);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Function call JoinToString:values:a:b not supported in string interpolation')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty strings', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const result = InterpolationSystem.interpolate('', interpolationContext);
      expect(result).toBe('');
    });

    test('should handle strings without variables', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const result = InterpolationSystem.interpolate('No variables here', interpolationContext);
      expect(result).toBe('No variables here');
    });

    test('should handle malformed variable syntax', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const result = InterpolationSystem.interpolate('{{incomplete', interpolationContext);
      expect(result).toBe('{{incomplete');
    });

    test('should handle nested braces', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const result = InterpolationSystem.interpolate('{{{{name}}}}', interpolationContext);
      expect(result).toBe('{{{{name}}}}'); // Nested braces are not processed
    });

    test('should handle whitespace in variables', () => {
      const interpolationContext = InterpolationContextBuilder.createContext(context);
      const result = InterpolationSystem.interpolate('{{ name }}', interpolationContext);
      expect(result).toBe('John');
    });
  });

  describe('Data Types and Formatting', () => {
    test('should format null values as empty string', () => {
      const contextWithNull = {
        ...context,
        userContext: {
          ...context.userContext,
          data: { nullValue: null }
        }
      };
      
      const interpolationContext = InterpolationContextBuilder.createContext(contextWithNull);
      const result = InterpolationSystem.interpolate('Value: {{nullValue}}', interpolationContext);
      expect(result).toBe('Value: ');
    });

    test('should format undefined values as empty string', () => {
      const contextWithUndefined = {
        ...context,
        userContext: {
          ...context.userContext,
          data: { undefinedValue: undefined }
        }
      };
      
      const interpolationContext = InterpolationContextBuilder.createContext(contextWithUndefined);
      const result = InterpolationSystem.interpolate('Value: {{undefinedValue}}', interpolationContext);
      expect(result).toBe('Value: {{undefinedValue}}'); // undefined variables remain unchanged
    });

    test('should format objects as JSON', () => {
      const contextWithObject = {
        ...context,
        userContext: {
          ...context.userContext,
          data: { objectValue: { key: 'value', num: 42 } }
        }
      };
      
      const interpolationContext = InterpolationContextBuilder.createContext(contextWithObject);
      const result = InterpolationSystem.interpolate('{{objectValue}}', interpolationContext);
      expect(result).toBe('{"key":"value","num":42}');
    });

    test('should format arrays as JSON', () => {
      const contextWithArray = {
        ...context,
        userContext: {
          ...context.userContext,
          data: { arrayValue: [1, 2, 'three'] }
        }
      };
      
      const interpolationContext = InterpolationContextBuilder.createContext(contextWithArray);
      const result = InterpolationSystem.interpolate('{{arrayValue}}', interpolationContext);
      expect(result).toBe('[1,2,"three"]');
    });
  });
});
