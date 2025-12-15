import { Money } from './money.vo';

describe('Money Value Object', () => {
  describe('constructor', () => {
    it('should create valid money', () => {
      const money = new Money(100, 'USD');

      expect(money.amount).toBe(100);
      expect(money.currency).toBe('USD');
    });

    it('should reject negative amount', () => {
      expect(() => new Money(-10, 'USD')).toThrow('Amount cannot be negative');
    });

    it('should reject empty currency', () => {
      expect(() => new Money(100, '')).toThrow('Currency is required');
    });

    it('should accept zero amount', () => {
      const money = new Money(0, 'USD');
      expect(money.amount).toBe(0);
    });
  });

  describe('add', () => {
    it('should add money with same currency', () => {
      const m1 = new Money(100, 'USD');
      const m2 = new Money(50, 'USD');

      const result = m1.add(m2);

      expect(result.amount).toBe(150);
      expect(result.currency).toBe('USD');
    });

    it('should throw error for currency mismatch', () => {
      const m1 = new Money(100, 'USD');
      const m2 = new Money(50, 'EUR');

      expect(() => m1.add(m2)).toThrow('Currency mismatch');
    });

    it('should handle adding zero', () => {
      const m1 = new Money(100, 'USD');
      const m2 = new Money(0, 'USD');

      const result = m1.add(m2);
      expect(result.amount).toBe(100);
    });

    it('should not mutate original money objects', () => {
      const m1 = new Money(100, 'USD');
      const m2 = new Money(50, 'USD');

      m1.add(m2);

      expect(m1.amount).toBe(100);
      expect(m2.amount).toBe(50);
    });
  });

  describe('subtract', () => {
    it('should subtract money with same currency', () => {
      const m1 = new Money(100, 'USD');
      const m2 = new Money(30, 'USD');

      const result = m1.subtract(m2);

      expect(result.amount).toBe(70);
    });

    it('should throw error when result is negative', () => {
      const m1 = new Money(30, 'USD');
      const m2 = new Money(100, 'USD');

      expect(() => m1.subtract(m2)).toThrow('Insufficient funds');
    });

    it('should allow subtracting to zero', () => {
      const m1 = new Money(100, 'USD');
      const m2 = new Money(100, 'USD');

      const result = m1.subtract(m2);
      expect(result.amount).toBe(0);
    });

    it('should throw error for currency mismatch', () => {
      const m1 = new Money(100, 'USD');
      const m2 = new Money(30, 'EUR');

      expect(() => m1.subtract(m2)).toThrow('Currency mismatch');
    });
  });

  describe('isGreaterThanOrEqual', () => {
    it('should return true when amount is greater', () => {
      const m1 = new Money(100, 'USD');
      const m2 = new Money(50, 'USD');

      expect(m1.isGreaterThanOrEqual(m2)).toBe(true);
    });

    it('should return true when amounts are equal', () => {
      const m1 = new Money(100, 'USD');
      const m2 = new Money(100, 'USD');

      expect(m1.isGreaterThanOrEqual(m2)).toBe(true);
    });

    it('should return false when amount is less', () => {
      const m1 = new Money(50, 'USD');
      const m2 = new Money(100, 'USD');

      expect(m1.isGreaterThanOrEqual(m2)).toBe(false);
    });

    it('should throw error for currency mismatch', () => {
      const m1 = new Money(100, 'USD');
      const m2 = new Money(50, 'EUR');

      expect(() => m1.isGreaterThanOrEqual(m2)).toThrow('Currency mismatch');
    });
  });
});
