import { Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuarios/usuario.entity';
import { AuditoriaService } from '../auditoria/auditoria.service';
import type { LoginDTO, LoginResponseDTO } from '@dda/shared-types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private readonly usuariosRepo: Repository<Usuario>,
    private readonly jwtService: JwtService,
    // Opcional apenas para o AuthModule poder ser montado isoladamente em teste;
    // na aplicação o AuditoriaModule é global e sempre está presente.
    @Optional() private readonly auditoria?: AuditoriaService,
  ) {}

  async login(dto: LoginDTO): Promise<LoginResponseDTO> {
    const usuario = await this.usuariosRepo.findOne({ where: { email: dto.email } });
    const senhaOk =
      !!usuario && usuario.ativo && (await bcrypt.compare(dto.senha, usuario.senhaHash));

    if (!usuario || !senhaOk) {
      // RF15 – tentativas de acesso recusadas também ficam no log
      await this.auditoria?.registrar({
        acao: 'LOGIN_FALHA',
        entidade: 'usuario',
        entidadeId: usuario?.id,
        detalhes: { email: dto.email },
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const token = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
    });

    await this.auditoria?.registrar({
      acao: 'LOGIN',
      entidade: 'usuario',
      entidadeId: usuario.id,
      usuarioId: usuario.id,
    });

    return {
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        ativo: usuario.ativo,
      },
    };
  }
}
