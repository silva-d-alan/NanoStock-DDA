import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Forçando a chave secreta a ser exatamente a mesma
      secretOrKey: process.env.JWT_SECRET || 'chave-super-secreta-troque-em-producao',
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, email: payload.email, perfil: payload.perfil };
  }
}