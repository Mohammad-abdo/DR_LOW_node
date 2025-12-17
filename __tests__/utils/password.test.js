import { describe, it, expect } from '@jest/globals';
import { hashPassword, comparePassword } from '../../src/utils/password.js';

describe('Password Utils', () => {
  const plainPassword = 'testPassword123';

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const hashed = await hashPassword(plainPassword);
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(plainPassword);
      expect(hashed.length).toBeGreaterThan(20); // bcrypt hashes are long
    });

    it('should produce different hashes for same password', async () => {
      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);
      // Different salts should produce different hashes
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const hashed = await hashPassword(plainPassword);
      const isValid = await comparePassword(plainPassword, hashed);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const hashed = await hashPassword(plainPassword);
      const isValid = await comparePassword('wrongPassword', hashed);
      expect(isValid).toBe(false);
    });

    it('should handle empty passwords', async () => {
      const hashed = await hashPassword('');
      const isValid = await comparePassword('', hashed);
      expect(isValid).toBe(true);
    });
  });
});


