import { ScopeManager } from '../src/interpolation/ScopeManager';

describe('ScopeManager', () => {
  let scopeManager: ScopeManager;

  beforeEach(() => {
    scopeManager = new ScopeManager();
  });

  describe('Basic Scope Operations', () => {
    test('should create and clear scopes', () => {
      expect(scopeManager.getAllScopes()).toEqual([]);
      
      scopeManager.createScope();
      expect(scopeManager.getAllScopes()).toHaveLength(1);
      
      scopeManager.clearScope();
      expect(scopeManager.getAllScopes()).toEqual([]);
    });

    test('should create scope with initial data', () => {
      const initialData = { key1: 'value1', key2: 42 };
      scopeManager.createScope(initialData);
      
      expect(scopeManager.findVariable('key1')).toBe('value1');
      expect(scopeManager.findVariable('key2')).toBe(42);
    });

    test('should set and get variables in current scope', () => {
      scopeManager.createScope();
      
      scopeManager.setVariable('testVar', 'testValue');
      expect(scopeManager.findVariable('testVar')).toBe('testValue');
      
      scopeManager.setVariable('numberVar', 123);
      expect(scopeManager.findVariable('numberVar')).toBe(123);
    });

    test('should return undefined for non-existent variables', () => {
      scopeManager.createScope();
      expect(scopeManager.findVariable('nonExistent')).toBeUndefined();
    });
  });

  describe('Nested Scopes', () => {
    test('should support nested scopes', () => {
      // Create parent scope
      scopeManager.createScope({ parentVar: 'parentValue' });
      
      // Create child scope
      scopeManager.createScope({ childVar: 'childValue' });
      
      expect(scopeManager.getAllScopes()).toHaveLength(2);
      
      // Child should access both parent and child variables
      expect(scopeManager.findVariable('parentVar')).toBe('parentValue');
      expect(scopeManager.findVariable('childVar')).toBe('childValue');
    });

    test('should prioritize inner scopes over outer scopes', () => {
      // Create parent scope
      scopeManager.createScope({ sharedVar: 'parentValue' });
      
      // Create child scope with same variable name
      scopeManager.createScope({ sharedVar: 'childValue' });
      
      // Child value should take precedence
      expect(scopeManager.findVariable('sharedVar')).toBe('childValue');
    });

    test('should clear only the innermost scope', () => {
      scopeManager.createScope({ level1: 'value1' });
      scopeManager.createScope({ level2: 'value2' });
      scopeManager.createScope({ level3: 'value3' });
      
      expect(scopeManager.getAllScopes()).toHaveLength(3);
      
      // Clear innermost scope
      scopeManager.clearScope();
      expect(scopeManager.getAllScopes()).toHaveLength(2);
      
      // Should still have access to outer scopes
      expect(scopeManager.findVariable('level1')).toBe('value1');
      expect(scopeManager.findVariable('level2')).toBe('value2');
      expect(scopeManager.findVariable('level3')).toBeUndefined();
    });

    test('should handle multiple levels of nesting', () => {
      const levels = 5;
      
      // Create multiple nested scopes
      for (let i = 0; i < levels; i++) {
        scopeManager.createScope({ [`level${i}`]: `value${i}` });
      }
      
      expect(scopeManager.getAllScopes()).toHaveLength(levels);
      
      // Should access variables from all levels
      for (let i = 0; i < levels; i++) {
        expect(scopeManager.findVariable(`level${i}`)).toBe(`value${i}`);
      }
    });
  });

  describe('Variable Shadowing', () => {
    test('should handle variable shadowing correctly', () => {
      scopeManager.createScope({ var: 'level1' });
      scopeManager.createScope({ var: 'level2' });
      scopeManager.createScope({ var: 'level3' });
      
      expect(scopeManager.findVariable('var')).toBe('level3');
      
      scopeManager.clearScope();
      expect(scopeManager.findVariable('var')).toBe('level2');
      
      scopeManager.clearScope();
      expect(scopeManager.findVariable('var')).toBe('level1');
      
      scopeManager.clearScope();
      expect(scopeManager.findVariable('var')).toBeUndefined();
    });

    test('should allow updating variables in current scope', () => {
      scopeManager.createScope({ updateVar: 'initial' });
      expect(scopeManager.findVariable('updateVar')).toBe('initial');
      
      scopeManager.setVariable('updateVar', 'updated');
      expect(scopeManager.findVariable('updateVar')).toBe('updated');
    });

    test('should create new variable in current scope even if exists in parent', () => {
      scopeManager.createScope({ sharedVar: 'parent' });
      scopeManager.createScope();
      
      // Setting variable in child scope should not affect parent
      scopeManager.setVariable('sharedVar', 'child');
      expect(scopeManager.findVariable('sharedVar')).toBe('child');
      
      scopeManager.clearScope();
      expect(scopeManager.findVariable('sharedVar')).toBe('parent');
    });
  });

  describe('Complex Data Types', () => {
    test('should handle objects', () => {
      const objectValue = { nested: { key: 'value' }, array: [1, 2, 3] };
      scopeManager.createScope({ objectVar: objectValue });
      
      expect(scopeManager.findVariable('objectVar')).toEqual(objectValue);
    });

    test('should handle arrays', () => {
      const arrayValue = ['item1', 'item2', { nested: true }];
      scopeManager.createScope({ arrayVar: arrayValue });
      
      expect(scopeManager.findVariable('arrayVar')).toEqual(arrayValue);
    });

    test('should handle null and undefined', () => {
      scopeManager.createScope({ 
        nullVar: null, 
        undefinedVar: undefined 
      });
      
      expect(scopeManager.findVariable('nullVar')).toBeNull();
      expect(scopeManager.findVariable('undefinedVar')).toBeUndefined();
    });

    test('should handle different primitive types', () => {
      scopeManager.createScope({
        stringVar: 'string',
        numberVar: 42,
        booleanVar: true,
        zeroVar: 0,
        emptyStringVar: ''
      });
      
      expect(scopeManager.findVariable('stringVar')).toBe('string');
      expect(scopeManager.findVariable('numberVar')).toBe(42);
      expect(scopeManager.findVariable('booleanVar')).toBe(true);
      expect(scopeManager.findVariable('zeroVar')).toBe(0);
      expect(scopeManager.findVariable('emptyStringVar')).toBe('');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty scope creation', () => {
      scopeManager.createScope({});
      expect(scopeManager.getAllScopes()).toHaveLength(1);
      expect(scopeManager.findVariable('anything')).toBeUndefined();
    });

    test('should handle clearing scope when no scopes exist', () => {
      expect(() => scopeManager.clearScope()).not.toThrow();
      expect(scopeManager.getAllScopes()).toEqual([]);
    });

    test('should handle setting variables when no scope exists', () => {
      expect(() => scopeManager.setVariable('var', 'value')).not.toThrow();
      expect(scopeManager.findVariable('var')).toBe('value'); // ScopeManager auto-creates scope
    });

    test('should handle special characters in variable names', () => {
      scopeManager.createScope();
      
      scopeManager.setVariable('var-with-dash', 'value1');
      scopeManager.setVariable('var_with_underscore', 'value2');
      scopeManager.setVariable('varWithoutDots', 'value3'); // Dots are treated as nested objects
      
      expect(scopeManager.findVariable('var-with-dash')).toBe('value1');
      expect(scopeManager.findVariable('var_with_underscore')).toBe('value2');
      expect(scopeManager.findVariable('varWithoutDots')).toBe('value3');
    });

    test('should handle variable names that are JavaScript keywords', () => {
      scopeManager.createScope();
      
      scopeManager.setVariable('function', 'value1');
      scopeManager.setVariable('class', 'value2');
      scopeManager.setVariable('return', 'value3');
      
      expect(scopeManager.findVariable('function')).toBe('value1');
      expect(scopeManager.findVariable('class')).toBe('value2');
      expect(scopeManager.findVariable('return')).toBe('value3');
    });
  });

  describe('Performance and Memory', () => {
    test('should handle large number of variables', () => {
      scopeManager.createScope();
      
      const numVars = 1000;
      for (let i = 0; i < numVars; i++) {
        scopeManager.setVariable(`var${i}`, `value${i}`);
      }
      
      // Test random access
      expect(scopeManager.findVariable('var500')).toBe('value500');
      expect(scopeManager.findVariable('var999')).toBe('value999');
      expect(scopeManager.findVariable('var0')).toBe('value0');
    });

    test('should handle deep nesting without performance issues', () => {
      const depth = 100;
      
      for (let i = 0; i < depth; i++) {
        scopeManager.createScope({ [`level${i}`]: i });
      }
      
      // Should still be able to access variables from all levels
      expect(scopeManager.findVariable('level0')).toBe(0);
      expect(scopeManager.findVariable('level50')).toBe(50);
      expect(scopeManager.findVariable('level99')).toBe(99);
      
      expect(scopeManager.getAllScopes()).toHaveLength(depth);
    });
  });
});
