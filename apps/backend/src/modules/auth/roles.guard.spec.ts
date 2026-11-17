import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { RolesGuard } from './roles.guard';

const contexto = (perfil?: string) =>
  createMock<ExecutionContext>({
    switchToHttp: () => ({ getRequest: () => ({ user: perfil ? { id: 'u1', perfil } : undefined }) }),
  });

describe('RolesGuard', () => {
  let reflector: DeepMocked<Reflector>;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = createMock<Reflector>();
    guard = new RolesGuard(reflector);
  });

  it('CT47 - RF12: permite o acesso de um perfil autorizado', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'ALMOXARIFE']);
    expect(guard.canActivate(contexto('ALMOXARIFE'))).toBe(true);
  });

  it('CT48 - RF12: nega o acesso de um perfil não autorizado', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'ALMOXARIFE']);
    expect(() => guard.canActivate(contexto('COMPRADOR'))).toThrow(ForbiddenException);
  });

  it('CT49 - RF12: rota restrita exige usuário autenticado; rota sem @Roles é livre', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    expect(() => guard.canActivate(contexto(undefined))).toThrow(UnauthorizedException);

    reflector.getAllAndOverride.mockReturnValue(undefined as never);
    expect(guard.canActivate(contexto('GESTOR'))).toBe(true);
  });
});
