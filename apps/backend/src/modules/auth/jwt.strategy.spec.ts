import { ConfigService } from '@nestjs/config';
import { createMock } from '@golevelup/ts-jest';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('CT45 - RNF03/RN02: o payload do JWT vira o usuário autenticado da requisição', async () => {
    const config = createMock<ConfigService>();
    config.get.mockReturnValue('segredo-de-teste');
    const strategy = new JwtStrategy(config);

    await expect(
      strategy.validate({ sub: 'u1', email: 'ana@dda.com', perfil: 'ALMOXARIFE', iat: 1, exp: 2 }),
    ).resolves.toEqual({ id: 'u1', email: 'ana@dda.com', perfil: 'ALMOXARIFE' });
  });
});
