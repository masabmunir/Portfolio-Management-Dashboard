import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

/**
 * Payload we put inside JWT tokens.
 */
export interface JwtPayload {
  sub: string;   // "subject" = user ID (JWT standard claim)
  email: string;
}

/**
 * Sign a short-lived access token.
 */
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessTtl,
  } as SignOptions);
}

/**
 * Sign a long-lived refresh token.
 */
export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshTtl,
  } as SignOptions);
}

/**
 * Verify an access token's signature and expiry.
 */
export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
  return decoded;
}

/**
 * Verify a refresh token's signature and expiry.
 */
export function verifyRefreshToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;
  return decoded;
}

/**
 * Hash a refresh token using SHA-256 before storing in DB.
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Calculate the expiry Date for a refresh token.
 */
export function getRefreshTokenExpiry(): Date {
  const ttl = env.jwt.refreshTtl; // e.g. "7d"
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid JWT_REFRESH_TTL format: ${ttl}`);

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + value * multipliers[unit]);
}