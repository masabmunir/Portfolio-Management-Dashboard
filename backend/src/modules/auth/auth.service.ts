import { AppDataSource } from '../../config/data-source';
import { User } from '../../entities/User';
import { RefreshToken } from '../../entities/RefreshToken';
import { hashPassword, verifyPassword } from '../../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
} from '../../utils/jwt';
import { CredentialsDto } from './auth.dto';

/**
 * Error classes — let us signal specific failure modes
 */
export class EmailAlreadyExistsError extends Error {
  constructor() {
    super('Email already registered');
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Invalid or revoked refresh token');
  }
}

/**
 * Shape of the auth response. The frontend will use this.
 */
export interface AuthResponse {
  user: { id: string; email: string };
  accessToken: string;
  refreshToken: string;
}

const userRepo = () => AppDataSource.getRepository(User);
const refreshTokenRepo = () => AppDataSource.getRepository(RefreshToken);

/**
 * Register a new user.
 */
export async function register(dto: CredentialsDto): Promise<AuthResponse> {
  const existing = await userRepo().findOne({ where: { email: dto.email } });
  if (existing) throw new EmailAlreadyExistsError();

  const user = userRepo().create({
    email: dto.email,
    passwordHash: await hashPassword(dto.password),
  });
  await userRepo().save(user);

  return issueTokens(user);
}

/**
 * Verify credentials and issue tokens.
 */
export async function login(dto: CredentialsDto): Promise<AuthResponse> {
  const user = await userRepo().findOne({ where: { email: dto.email } });
  if (!user) throw new InvalidCredentialsError();

  const valid = await verifyPassword(dto.password, user.passwordHash);
  if (!valid) throw new InvalidCredentialsError();

  return issueTokens(user);
}

/**
 * Exchange a valid refresh token for a new access token.
 */
export async function refresh(refreshToken: string): Promise<{ accessToken: string }> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new InvalidRefreshTokenError();
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const record = await refreshTokenRepo().findOne({ where: { tokenHash } });

  if (!record || record.revoked || record.expiresAt < new Date()) {
    throw new InvalidRefreshTokenError();
  }

  const accessToken = signAccessToken({ sub: payload.sub, email: payload.email });
  return { accessToken };
}

/**
 * Revoke a refresh token. Subsequent refresh calls with this token will fail.
 */
export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(refreshToken);
  await refreshTokenRepo().update({ tokenHash }, { revoked: true });
}

/**
 * Internal helper: generate tokens and persist refresh token hash.
 */
async function issueTokens(user: User): Promise<AuthResponse> {
  const payload = { sub: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Store the HASH, not the raw token. If DB leaks, attackers get nothing useful.
  const tokenRecord = refreshTokenRepo().create({
    userId: user.id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: getRefreshTokenExpiry(),
    revoked: false,
  });
  await refreshTokenRepo().save(tokenRecord);

  return {
    user: { id: user.id, email: user.email },
    accessToken,
    refreshToken,
  };
}