import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from './usuarios.service';
import { Usuario } from './usuario.entity';

jest.mock('bcrypt', () => ({ hash: jest.fn() }));

describe('UsuariosService', () => {
  let service: UsuariosService;
  let repo: DeepMocked<Repository<Usuario>>;

  beforeEach(async () => {
    repo = createMock<Repository<Usuario>>();
    repo.create.mockImplementation((d: any) => d);
    repo.save.mockImplementation(async (d: any) => ({ id: 'u9', ...d }));
    repo.findOne.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hash-gerado');

    const moduleRef = await Test.createTestingModule({
      providers: [UsuariosService, { provide: getRepositoryToken(Usuario), useValue: repo }],
    }).compile();
    service = moduleRef.get(UsuariosService);
  });

  it('CT46 - RNF03: a senha é armazenada somente como hash bcrypt e nunca é devolvida', async () => {
    const r = await service.criar({ nome: 'Bia', email: 'bia@dda.com', senha: 'segredo123', perfil: 'COMPRADOR' });

    expect(bcrypt.hash).toHaveBeenCalledWith('segredo123', 10);
    expect(repo.save).toHaveBeenCalledWith({
      nome: 'Bia',
      email: 'bia@dda.com',
      senhaHash: '$2b$10$hash-gerado',
      perfil: 'COMPRADOR',
    });
    expect(r).toEqual({ id: 'u9', nome: 'Bia', email: 'bia@dda.com', perfil: 'COMPRADOR' });
  });
});
