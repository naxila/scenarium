import { parseStartParams, startParamsExamples } from '../src/utils/startParamsParser';

describe('StartParamsParser', () => {
  describe('parseStartParams', () => {
    it('should parse URL-style parameters', () => {
      const result = parseStartParams('param1=value1&param2=value2');
      expect(result).toEqual({
        param1: 'value1',
        param2: 'value2'
      });
    });

    it('should parse space-separated parameters', () => {
      const result = parseStartParams('param1 value1 param2 value2');
      expect(result).toEqual({
        param1: 'value1',
        param2: 'value2'
      });
    });

    it('should parse mixed format parameters (URL-style takes precedence)', () => {
      const result = parseStartParams('param1=value1 param2 value2');
      expect(result).toEqual({
        param1: 'value1 param2 value2'
      });
    });

    it('should parse numeric values', () => {
      const result = parseStartParams('age=25&count=100');
      expect(result).toEqual({
        age: 25,
        count: 100
      });
    });

    it('should parse boolean values', () => {
      const result = parseStartParams('active=true&enabled=false');
      expect(result).toEqual({
        active: true,
        enabled: false
      });
    });

    it('should handle single parameter without value as start', () => {
      const result = parseStartParams('param1');
      expect(result).toEqual({
        start: 'param1'
      });
    });

    it('should handle single parameter with value', () => {
      const result = parseStartParams('param1 value1');
      expect(result).toEqual({
        param1: 'value1'
      });
    });

    it('should handle empty payload', () => {
      expect(parseStartParams('')).toEqual({});
      expect(parseStartParams(undefined)).toEqual({});
      expect(parseStartParams(null as any)).toEqual({});
    });

    it('should handle URL encoding', () => {
      const result = parseStartParams('name=John%20Doe&email=test%40example.com');
      expect(result).toEqual({
        name: 'John Doe',
        email: 'test@example.com'
      });
    });

    it('should handle complex mixed format (URL-style only)', () => {
      const result = parseStartParams('ref=partner123 name John age 25 active true');
      expect(result).toEqual({
        ref: 'partner123 name John age 25 active true'
      });
    });

    it('should handle parameters with special characters', () => {
      const result = parseStartParams('promo=SUMMER-2024&code=ABC123');
      expect(result).toEqual({
        promo: 'SUMMER-2024',
        code: 'ABC123'
      });
    });

    it('should handle empty values', () => {
      const result = parseStartParams('param1=&param2=value2');
      expect(result).toEqual({
        param1: '',
        param2: 'value2'
      });
    });

    it('should handle whitespace around parameters', () => {
      const result = parseStartParams('  param1=value1  &  param2=value2  ');
      expect(result).toEqual({
        param1: 'value1',
        param2: 'value2'
      });
    });

    it('should handle multiple spaces between parameters', () => {
      const result = parseStartParams('param1   value1   param2   value2');
      expect(result).toEqual({
        param1: 'value1',
        param2: 'value2'
      });
    });

    it('should handle Telegram start parameter format', () => {
      const result = parseStartParams('?start=123');
      expect(result).toEqual({
        start: '123'
      });
    });

    it('should handle Telegram start parameter with string', () => {
      const result = parseStartParams('?start=promo');
      expect(result).toEqual({
        start: 'promo'
      });
    });

    it('should handle Telegram start parameter with encoded value', () => {
      const result = parseStartParams('?start=user%20123');
      expect(result).toEqual({
        start: 'user 123'
      });
    });

    it('should handle simple start parameter', () => {
      const result = parseStartParams('123');
      expect(result).toEqual({
        start: '123'
      });
    });

    it('should handle simple start parameter as string', () => {
      const result = parseStartParams('promo');
      expect(result).toEqual({
        start: 'promo'
      });
    });
  });

  describe('startParamsExamples', () => {
    it('should contain valid examples', () => {
      expect(startParamsExamples).toBeDefined();
      expect(typeof startParamsExamples).toBe('object');
      
      // Test a few examples
      expect(startParamsExamples['param1=value1&param2=value2']).toEqual({
        param1: 'value1',
        param2: 'value2'
      });
      
      expect(startParamsExamples['name=John&age=25&active=true']).toEqual({
        name: 'John',
        age: 25,
        active: true
      });
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle referral links', () => {
      const result = parseStartParams('ref=partner123&source=telegram&utm_campaign=summer');
      expect(result).toEqual({
        ref: 'partner123',
        source: 'telegram',
        utm_campaign: 'summer'
      });
    });

    it('should handle user registration', () => {
      const result = parseStartParams('userId=12345&email=user@example.com&verified=true');
      expect(result).toEqual({
        userId: 12345,
        email: 'user@example.com',
        verified: true
      });
    });

    it('should handle promo codes', () => {
      const result = parseStartParams('promo=SUMMER2024&discount=20&category=electronics');
      expect(result).toEqual({
        promo: 'SUMMER2024',
        discount: 20,
        category: 'electronics'
      });
    });

    it('should handle analytics parameters', () => {
      const result = parseStartParams('utm_source=email&utm_medium=newsletter&utm_campaign=launch');
      expect(result).toEqual({
        utm_source: 'email',
        utm_medium: 'newsletter',
        utm_campaign: 'launch'
      });
    });

    it('should handle Telegram bot links', () => {
      const result = parseStartParams('?start=referral123');
      expect(result).toEqual({
        start: 'referral123'
      });
    });

    it('should handle Telegram bot links with numeric codes', () => {
      const result = parseStartParams('?start=456');
      expect(result).toEqual({
        start: '456'
      });
    });

    it('should handle Telegram bot links with complex values', () => {
      const result = parseStartParams('?start=promo%2Dcode%2D2024');
      expect(result).toEqual({
        start: 'promo-code-2024'
      });
    });

    it('should handle simple bot links without ?start=', () => {
      const result = parseStartParams('456');
      expect(result).toEqual({
        start: '456'
      });
    });
  });
});
