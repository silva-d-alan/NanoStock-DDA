import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Repository } from 'typeorm';
import { AuditoriaService } from './auditoria.service';
import { Auditoria } from './auditoria.entity';

describe('AuditoriaService', () => {
  let service: AuditoriaService;
  let repo: DeepMocked<Repository<Auditoria>>;

  beforeEach(async () => {
    repo = createMock<Repository<Auditoria>>();
    repo.create.mockImplementation((d: any) => d);
    repo.save.mockImplementation(async (d: any) => ({ id: 'log1', ...d }));
    repo.find.mockResolvedValue([]);

    const moduleRef = await Test.createTestingModule({
      providers: [AuditoriaService, { provide: getRepositoryToken(Auditoria), useValue: repo }],
    }).compile();
    service = moduleRef.get(AuditoriaService);
  });

  it('CT50 - RF15/RNF09: persiste o registro de auditoria e lista do mais recente ao mais antigo', async () => {
    const registro = { acao: 'SAIDA' as const, entidade: 'movimentacao', entidadeId: 'm1', usuarioId: 'u1' };
    await expect(service.registrar(registro)).resolves.toEqual({ id: 'log1', ...registro });
    expect(repo.save).toHaveBeenCalledWith(registro);

    await service.findAll();
    expect(repo.find).toHaveBeenCalledWith({ order: { data: 'DESC' }, take: 500 });
  });
});
