import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Repository } from 'typeorm';
import { AlertasService } from './alertas.service';
import { Alerta } from './alerta.entity';
import { Pastilha } from '../pastilhas/pastilha.entity';

describe('AlertasService', () => {
  let service: AlertasService;
  let repo: DeepMocked<Repository<Alerta>>;
  const p = { id: 'p1', descricao: 'Pastilha CNMG', estoqueAtual: 5, estoqueMinimo: 10 } as Pastilha;

  beforeEach(async () => {
    repo = createMock<Repository<Alerta>>();
    repo.create.mockImplementation((d: any) => d);
    repo.save.mockImplementation(async (d: any) => d);
    repo.findOne.mockResolvedValue(null);

    const moduleRef = await Test.createTestingModule({
      providers: [AlertasService, { provide: getRepositoryToken(Alerta), useValue: repo }],
    }).compile();
    service = moduleRef.get(AlertasService);
  });

  it('CT38 - RF08/RN03: alerta é gerado para o Almoxarife e o Comprador', async () => {
    const a = await service.gerar(p);
    expect(a).toEqual({
      pastilhaId: 'p1',
      destinatarios: ['ALMOXARIFE', 'COMPRADOR'],
      mensagem: 'Estoque de "Pastilha CNMG" abaixo do mínimo (5/10).',
    });
  });

  it('CT39 - RF08: não duplica alerta ativo para o mesmo item', async () => {
    const existente = { id: 'a1', pastilhaId: 'p1', status: 'ATIVO' } as Alerta;
    repo.findOne.mockResolvedValue(existente);
    await expect(service.gerar(p)).resolves.toBe(existente);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('CT40 - RN03: cada perfil enxerga apenas os alertas destinados a ele', async () => {
    const paraAmbos = { id: 'a1', destinatarios: ['ALMOXARIFE', 'COMPRADOR'] } as Alerta;
    const soComprador = { id: 'a2', destinatarios: ['COMPRADOR'] } as Alerta;
    repo.find.mockResolvedValue([paraAmbos, soComprador]);

    await expect(service.findAll('ALMOXARIFE')).resolves.toEqual([paraAmbos]);
    await expect(service.findAll('COMPRADOR')).resolves.toEqual([paraAmbos, soComprador]);
    // ADMIN e GESTOR supervisionam todos os alertas
    await expect(service.findAll('GESTOR')).resolves.toHaveLength(2);
    await expect(service.findAll('ADMIN')).resolves.toHaveLength(2);
  });

  it('CT41 - RN04: alerta de item zerado informa a situação "zerado"', async () => {
    const a = await service.gerar({ ...p, estoqueAtual: 0 } as Pastilha);
    expect(a.mensagem).toBe('Estoque de "Pastilha CNMG" zerado (0/10).');
  });
});
