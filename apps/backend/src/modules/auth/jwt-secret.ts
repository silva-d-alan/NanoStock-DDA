import { ConfigService } from '@nestjs/config';

export function jwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');
  if (!secret || !secret.trim()) {
    throw new Error('JWT_SECRET deve ser definido e não pode estar vazio');
  }
  return secret;
}