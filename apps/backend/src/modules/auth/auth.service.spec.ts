import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { Usuario } from '../usuarios/usuario.entity';
import { AuditoriaService } from '../auditoria/auditoria.service';

jest.mock('bcrypt', () => ({ compare: jest.fn() }));

describe('AuthService', () => {
  let service: AuthService;
  let repo: DeepMocked<Repository<Usuario>>;
  let jwt: DeepMocked<JwtService>;
  let auditoria: DeepMocked<AuditoriaService>;
  const compare = bcrypt.compare as jest.Mock;

  const usuario = {
    id: 'u1',
    nome: 'Ana',
    email: 'ana@dda.com',
    perfil: 'ALMOXARIFE',
    ativo: true,
    senhaHash: '$2b$10$hash',
  } as Usuario;

  beforeEach(async () => {
    compare.mockReset();
    repo = createMock<Repository<Usuario>>();
    jwt = createMock<JwtService>();
    auditoria = createMock<AuditoriaService>();
    jwt.sign.mockReturnValue('token.jwt');

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Usuario), useValue: repo },
        { provide: JwtService, useValue: jwt },
        { provide: AuditoriaService, useValue: auditoria },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('CT42 - RF12/RNF03: login válido confere o hash bcrypt e emite JWT com o perfil', async () => {
    repo.findOne.mockResolvedValue(usuario);
    compare.mockResolvedValue(true);

    const r = await service.login({ email: 'ana@dda.com', senha: '123456' });

    expect(compare).toHaveBeenCalledWith('123456', '$2b$10$hash');
    expect(jwt.sign).toHaveBeenCalledWith({ sub: 'u1', email: 'ana@dda.com', perfil: 'ALMOXARIFE' });
    expect(r).toEqual({
      token: 'token.jwt',
      usuario: { id: 'u1', nome: 'Ana', email: 'ana@dda.com', perfil: 'ALMOXARIFE', ativo: true },
    });
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ acao: 'LOGIN', entidade: 'usuario', usuarioId: 'u1' }),
    );
  });

  it('CT43 - RNF03/RF15: senha incorreta é recusada e o acesso negado vai para a auditoria', async () => {
    repo.findOne.mockResolvedValue(usuario);
    compare.mockResolvedValue(false);

    await expect(service.login({ email: 'ana@dda.com', senha: 'errada' })).rejects.toThrow(UnauthorizedException);
    expect(jwt.sign).not.toHaveBeenCalled();
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ acao: 'LOGIN_FALHA', detalhes: { email: 'ana@dda.com' } }),
    );
  });

  it('CT44 - RF12: usuário inexistente ou inativo não consegue autenticar', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.login({ email: 'ninguem@dda.com', senha: 'x' })).rejects.toThrow('Credenciais inválidas');

    repo.findOne.mockResolvedValue({ ...usuario, ativo: false } as Usuario);
    await expect(service.login({ email: 'ana@dda.com', senha: '123456' })).rejects.toThrow('Credenciais inválidas');

    expect(compare).not.toHaveBeenCalled();
    expect(jwt.sign).not.toHaveBeenCalled();
  });
});
