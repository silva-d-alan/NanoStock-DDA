import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { AuthModule } from './auth.module';
import { JwtStrategy } from './jwt.strategy';
import { jwtSecret } from './jwt-secret';

describe('JWT configuration', () => {
  it.each([undefined, '', '   '])('rejects a missing or blank JWT secret', (secret) => {
    const config = { get: () => secret } as unknown as ConfigService;
    expect(() => jwtSecret(config)).toThrow('JWT_SECRET deve ser definido e não pode estar vazio');
  });
  it('signs and validates with the secret loaded by ConfigModule', async () => {
    const previousSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    try {
      const module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            load: [() => ({ JWT_SECRET: 'test-secret' })],
          }),
          AuthModule,
        ],
      })
        .overrideProvider(getRepositoryToken(Usuario))
        .useValue({})
        .compile();

      const jwt = module.get(JwtService);
      const strategy = module.get(JwtStrategy);
      const token = jwt.sign({ sub: 1 });
      const validationSecret = await new Promise<string>((resolve, reject) => {
        (strategy as any)._secretOrKeyProvider({}, token, (error: Error | null, secret: string) => {
          if (error) reject(error);
          else resolve(secret);
        });
      });

      expect(validationSecret).toBe('test-secret');
      expect(jwt.verify(token, { secret: validationSecret }).sub).toBe(1);
      await module.close();
    } finally {
      if (previousSecret === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = previousSecret;
    }
  });
});