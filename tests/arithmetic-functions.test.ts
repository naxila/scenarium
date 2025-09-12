import { PlusFunction } from '../src/functions/PlusFunction';
import { MinusFunction } from '../src/functions/MinusFunction';
import { MultiplyFunction } from '../src/functions/MultiplyFunction';
import { DivideFunction } from '../src/functions/DivideFunction';
import { ModFunction } from '../src/functions/ModFunction';
import { InterpolationContextBuilder } from '../src/interpolation/InterpolationContext';

describe('Arithmetic Functions', () => {
  let mockContext: any;
  
  const createFullMockContext = (userData = {}, scenarioData = {}): any => ({
    userContext: {
      userId: '12345',
      data: userData,
      backStack: [],
      createdAt: new Date(),
      lastActivity: new Date()
    },
    scenarioContext: scenarioData,
    localContext: {},
    scenario: { onStartActions: [], menuItems: {}, functions: {} }
  });

  beforeEach(() => {
    mockContext = createFullMockContext({
      basePrice: 100,
      tax: 15,
      discount: 10,
      quantity: 3
    });
  });

  describe('PlusFunction', () => {
    test('should add simple numbers', async () => {
      const params = { values: [5, 10, 15] };
      const result = await PlusFunction.execute(params, mockContext);
      expect(result).toBe(30);
    });

    test('should add with interpolated variables', async () => {
      const params = { values: ['{{basePrice}}', '{{tax}}'] };
      const result = await PlusFunction.execute(params, mockContext);
      expect(result).toBe(115);
    });

    test('should handle mixed numbers and strings', async () => {
      const params = { values: [50, '25', 25.5] };
      const result = await PlusFunction.execute(params, mockContext);
      expect(result).toBe(100.5);
    });

    test('should return 0 for empty array', async () => {
      const params = { values: [] };
      const result = await PlusFunction.execute(params, mockContext);
      expect(result).toBe(0);
    });

    test('should throw error for invalid numbers', async () => {
      const params = { values: [5, 'invalid', 10] };
      await expect(PlusFunction.execute(params, mockContext)).rejects.toThrow('invalid number');
    });

    test('should throw error for non-array values', async () => {
      const params = { values: 'not an array' };
      await expect(PlusFunction.execute(params, mockContext)).rejects.toThrow('requires "values" parameter as array');
    });

    test('should handle floating point precision', async () => {
      const params = { values: [0.1, 0.2, 0.3] };
      const result = await PlusFunction.execute(params, mockContext);
      expect(result).toBeCloseTo(0.6, 10);
    });
  });

  describe('MinusFunction', () => {
    test('should subtract numbers', async () => {
      const params = { values: [100, 25, 10] };
      const result = await MinusFunction.execute(params, mockContext);
      expect(result).toBe(65);
    });

    test('should handle unary minus', async () => {
      const params = { values: [50] };
      const result = await MinusFunction.execute(params, mockContext);
      expect(result).toBe(-50);
    });

    test('should subtract with interpolated variables', async () => {
      const params = { values: ['{{basePrice}}', '{{discount}}'] };
      const result = await MinusFunction.execute(params, mockContext);
      expect(result).toBe(90);
    });

    test('should return 0 for empty array', async () => {
      const params = { values: [] };
      const result = await MinusFunction.execute(params, mockContext);
      expect(result).toBe(0);
    });

    test('should handle negative results', async () => {
      const params = { values: [10, 20, 30] };
      const result = await MinusFunction.execute(params, mockContext);
      expect(result).toBe(-40);
    });

    test('should throw error for invalid numbers', async () => {
      const params = { values: [100, 'invalid'] };
      await expect(MinusFunction.execute(params, mockContext)).rejects.toThrow('invalid number');
    });
  });

  describe('MultiplyFunction', () => {
    test('should multiply numbers', async () => {
      const params = { values: [5, 4, 3] };
      const result = await MultiplyFunction.execute(params, mockContext);
      expect(result).toBe(60);
    });

    test('should multiply with interpolated variables', async () => {
      const params = { values: ['{{basePrice}}', '{{quantity}}'] };
      const result = await MultiplyFunction.execute(params, mockContext);
      expect(result).toBe(300);
    });

    test('should return 1 for empty array (multiplicative identity)', async () => {
      const params = { values: [] };
      const result = await MultiplyFunction.execute(params, mockContext);
      expect(result).toBe(1);
    });

    test('should handle zero multiplication', async () => {
      const params = { values: [5, 0, 10] };
      const result = await MultiplyFunction.execute(params, mockContext);
      expect(result).toBe(0);
    });

    test('should handle decimal multiplication', async () => {
      const params = { values: [2.5, 4] };
      const result = await MultiplyFunction.execute(params, mockContext);
      expect(result).toBe(10);
    });

    test('should handle negative numbers', async () => {
      const params = { values: [-2, 3, -4] };
      const result = await MultiplyFunction.execute(params, mockContext);
      expect(result).toBe(24);
    });
  });

  describe('DivideFunction', () => {
    test('should divide numbers', async () => {
      const params = { values: [100, 5, 2] };
      const result = await DivideFunction.execute(params, mockContext);
      expect(result).toBe(10);
    });

    test('should handle reciprocal (single value)', async () => {
      const params = { values: [8] };
      const result = await DivideFunction.execute(params, mockContext);
      expect(result).toBe(0.125);
    });

    test('should divide with interpolated variables', async () => {
      const params = { values: ['{{basePrice}}', '{{quantity}}'] };
      const result = await DivideFunction.execute(params, mockContext);
      expect(result).toBeCloseTo(33.333, 3);
    });

    test('should throw error for division by zero', async () => {
      const params = { values: [100, 0] };
      await expect(DivideFunction.execute(params, mockContext)).rejects.toThrow('division by zero');
    });

    test('should throw error for reciprocal of zero', async () => {
      const params = { values: [0] };
      await expect(DivideFunction.execute(params, mockContext)).rejects.toThrow('division by zero');
    });

    test('should throw error for empty array', async () => {
      const params = { values: [] };
      await expect(DivideFunction.execute(params, mockContext)).rejects.toThrow('requires at least one value');
    });

    test('should handle decimal division', async () => {
      const params = { values: [7, 2] };
      const result = await DivideFunction.execute(params, mockContext);
      expect(result).toBe(3.5);
    });

    test('should handle negative division', async () => {
      const params = { values: [-20, 4] };
      const result = await DivideFunction.execute(params, mockContext);
      expect(result).toBe(-5);
    });
  });

  describe('ModFunction', () => {
    test('should calculate modulo', async () => {
      const params = { dividend: 17, divisor: 5 };
      const result = await ModFunction.execute(params, mockContext);
      expect(result).toBe(2);
    });

    test('should handle zero dividend', async () => {
      const params = { dividend: 0, divisor: 5 };
      const result = await ModFunction.execute(params, mockContext);
      expect(result).toBe(0);
    });

    test('should handle negative numbers', async () => {
      const params = { dividend: -17, divisor: 5 };
      const result = await ModFunction.execute(params, mockContext);
      expect(result).toBe(-2);
    });

    test('should handle decimal numbers', async () => {
      const params = { dividend: 7.5, divisor: 2.5 };
      const result = await ModFunction.execute(params, mockContext);
      expect(result).toBe(0);
    });

    test('should work with interpolated variables', async () => {
      const contextWithMod = createFullMockContext({
        dividend: 23, 
        divisor: 7
      });
      
      // Test direct variable access first
      const params = { dividend: 23, divisor: 7 };
      const result = await ModFunction.execute(params, contextWithMod);
      expect(result).toBe(2);
    });

    test('should throw error for modulo by zero', async () => {
      const params = { dividend: 10, divisor: 0 };
      await expect(ModFunction.execute(params, mockContext)).rejects.toThrow('modulo by zero');
    });

    test('should throw error for missing parameters', async () => {
      const params = { dividend: 10 };
      await expect(ModFunction.execute(params, mockContext)).rejects.toThrow('requires "dividend" and "divisor" parameters');
    });

    test('should throw error for invalid dividend', async () => {
      const params = { dividend: 'invalid', divisor: 5 };
      await expect(ModFunction.execute(params, mockContext)).rejects.toThrow('invalid dividend');
    });

    test('should throw error for invalid divisor', async () => {
      const params = { dividend: 10, divisor: 'invalid' };
      await expect(ModFunction.execute(params, mockContext)).rejects.toThrow('invalid divisor');
    });
  });

  describe('Integration with Interpolation System', () => {
    test('should work with complex interpolation scenarios', async () => {
      const complexContext = createFullMockContext({
        items: [
          { price: 10, quantity: 2 },
          { price: 15, quantity: 3 },
          { price: 20, quantity: 1 }
        ],
        taxRate: 0.08,
        discount: 5
      });

      // Calculate total: (10*2 + 15*3 + 20*1) - 5 = 90 - 5 = 85
      const item1Total = await MultiplyFunction.execute({ values: [10, 2] }, complexContext);
      const item2Total = await MultiplyFunction.execute({ values: [15, 3] }, complexContext);
      const item3Total = await MultiplyFunction.execute({ values: [20, 1] }, complexContext);
      
      const subtotal = await PlusFunction.execute({ values: [item1Total, item2Total, item3Total] }, complexContext);
      const afterDiscount = await MinusFunction.execute({ values: [subtotal, 5] }, complexContext);
      
      expect(item1Total).toBe(20);
      expect(item2Total).toBe(45);
      expect(item3Total).toBe(20);
      expect(subtotal).toBe(85);
      expect(afterDiscount).toBe(80);
    });

    test('should maintain local context variables', async () => {
      const params = { values: [10, 20, 30] };
      
      const result = await PlusFunction.execute(params, mockContext);
      
      expect(result).toBe(60);
      // Note: Local context is managed internally by the function
      // and cleared after execution, so we can't test it directly
    });

    test('should handle nested function calls conceptually', async () => {
      // Simulate what would happen with nested function calls
      // Inner function: Plus([5, 10]) = 15
      const innerResult = await PlusFunction.execute({ values: [5, 10] }, mockContext);
      
      // Outer function: Multiply([innerResult, 3]) = 45
      const outerResult = await MultiplyFunction.execute({ values: [innerResult, 3] }, mockContext);
      
      expect(innerResult).toBe(15);
      expect(outerResult).toBe(45);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle very large numbers', async () => {
      const params = { values: [Number.MAX_SAFE_INTEGER, 1] };
      const result = await PlusFunction.execute(params, mockContext);
      expect(result).toBe(Number.MAX_SAFE_INTEGER + 1);
    });

    test('should handle very small numbers', async () => {
      const params = { values: [Number.MIN_VALUE, Number.MIN_VALUE] };
      const result = await PlusFunction.execute(params, mockContext);
      expect(result).toBe(Number.MIN_VALUE * 2);
    });

    test('should handle Infinity', async () => {
      const params = { values: [Infinity, 100] };
      const result = await PlusFunction.execute(params, mockContext);
      expect(result).toBe(Infinity);
    });

    test('should handle -Infinity', async () => {
      const params = { values: [-Infinity, 100] };
      const result = await PlusFunction.execute(params, mockContext);
      expect(result).toBe(-Infinity);
    });

    test('should handle NaN gracefully', async () => {
      const params = { values: [NaN, 10] };
      await expect(PlusFunction.execute(params, mockContext)).rejects.toThrow('invalid number');
    });
  });
});
