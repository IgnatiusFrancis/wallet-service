import { WalletId } from './wallet-id.vo';

describe('WalletId Value Object', () => {
  describe('constructor', () => {
    it('should create wallet id with valid value', () => {
      const id = new WalletId('test-123');
      expect(id.value).toBe('test-123');
    });

    it('should reject empty value', () => {
      expect(() => new WalletId('')).toThrow('Wallet ID cannot be empty');
    });

    it('should reject whitespace only', () => {
      expect(() => new WalletId('   ')).toThrow('Wallet ID cannot be empty');
    });
  });

  describe('generate', () => {
    it('should generate valid UUID', () => {
      const id = WalletId.generate();

      expect(id.value).toBeDefined();
      expect(id.value.length).toBeGreaterThan(0);
      expect(id.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should generate unique IDs', () => {
      const id1 = WalletId.generate();
      const id2 = WalletId.generate();

      expect(id1.value).not.toBe(id2.value);
    });
  });

  describe('equals', () => {
    it('should return true for same values', () => {
      const id1 = new WalletId('test-123');
      const id2 = new WalletId('test-123');

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different values', () => {
      const id1 = new WalletId('test-123');
      const id2 = new WalletId('test-456');

      expect(id1.equals(id2)).toBe(false);
    });
  });
});
