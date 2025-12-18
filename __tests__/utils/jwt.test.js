import { describe, it, expect } from '@jest/globals';
import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../src/utils/jwt.js';

describe('JWT Utils', () => {
  const testPayload = { userId: 'test-user-id', role: 'STUDENT' };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(testPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include payload data in token', () => {
      const token = generateAccessToken(testPayload);
      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.role).toBe(testPayload.role);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(testPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid token', () => {
      const token = generateAccessToken(testPayload);
      const decoded = verifyAccessToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testPayload.userId);
    });

    it('should return null for invalid token', () => {
      const decoded = verifyAccessToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for expired token', async () => {
      // Create a token with very short expiration (1 second)
      const secret = process.env.JWT_SECRET || 'test-secret';
      const expiredToken = jwt.sign(
        testPayload,
        secret,
        { expiresIn: '1ms' } // Token expires in 1 millisecond
      );
      
      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const decoded = verifyAccessToken(expiredToken);
      expect(decoded).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(testPayload);
      const decoded = verifyRefreshToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testPayload.userId);
    });

    it('should return null for invalid refresh token', () => {
      const decoded = verifyRefreshToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for expired refresh token', async () => {
      // Create a refresh token with very short expiration
      const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'test-secret';
      const expiredToken = jwt.sign(
        testPayload,
        secret,
        { expiresIn: '1ms' }
      );
      
      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const decoded = verifyRefreshToken(expiredToken);
      expect(decoded).toBeNull();
    });
  });

  describe('Token expiration times', () => {
    it('access token should have shorter expiration than refresh token', () => {
      const accessToken = generateAccessToken(testPayload);
      const refreshToken = generateRefreshToken(testPayload);
      
      const secret = process.env.JWT_SECRET || 'test-secret';
      const refreshSecret = process.env.JWT_REFRESH_SECRET || secret;
      
      const decodedAccess = jwt.decode(accessToken);
      const decodedRefresh = jwt.decode(refreshToken);
      
      // Refresh token should expire later than access token
      expect(decodedRefresh.exp).toBeGreaterThan(decodedAccess.exp);
    });
  });

  describe('Token payload structure', () => {
    it('should include standard JWT claims', () => {
      const token = generateAccessToken(testPayload);
      const decoded = jwt.decode(token);
      
      expect(decoded.iat).toBeDefined(); // issued at
      expect(decoded.exp).toBeDefined(); // expiration
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.role).toBe(testPayload.role);
    });
  });
});