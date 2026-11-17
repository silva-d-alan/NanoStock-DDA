import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

/** RF12 – controle de acesso por perfil. Deve vir depois do JwtAuthGuard. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const perfis = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!perfis || perfis.length === 0) return true;

    const user = ctx.switchToHttp().getRequest().user;
    if (!user) throw new UnauthorizedException('Usuário não autenticado');
    if (!perfis.includes(user.perfil)) {
      throw new ForbiddenException('Perfil sem permissão para este recurso');
    }
    return true;
  }
}
