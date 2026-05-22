import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { CredentialsDto, RefreshTokenDto } from './auth.dto';

/**
 * Thin HTTP layer — just translates between HTTP and service calls.
 */

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as CredentialsDto;
    const result = await authService.register(dto);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof authService.EmailAlreadyExistsError) {
      res.status(409).json({ error: err.message });
      return;
    }
    next(err); // unknown errors → global handler → 500
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as CredentialsDto;
    const result = await authService.login(dto);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof authService.InvalidCredentialsError) {
      res.status(401).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as RefreshTokenDto;
    const result = await authService.refresh(dto.refreshToken);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof authService.InvalidRefreshTokenError) {
      res.status(401).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as RefreshTokenDto;
    await authService.logout(dto.refreshToken);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}