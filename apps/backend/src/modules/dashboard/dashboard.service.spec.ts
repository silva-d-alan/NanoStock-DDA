import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Repository } from 'typeorm';
import { DashboardService } from './dashboard.service';
import { Pastilha } from '../pastilhas/pastilha.entity';
import { Movimentacao } from '../movimentacoes/movimentacao.entity';

describe('DashboardService', () => {
  let service: DashboardService;
  let pastRepo: DeepMocked<Repository<Pastilha>>;
  let movRepo: DeepMocked<Repository<Movimentacao>>;

  beforeEach(async () => {
    pastRepo = createMock<Repository<Pastilha>>();
    movRepo = createMock<Repository<Movimentacao>>();
    movRepo.find.mockResolvedValue([]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Pastilha), useValue: pastRepo },
        { provide: getRepositoryToken(Movimentacao), useValue: movRepo },
      ],
    }).compile();
    service = moduleRef.get(DashboardService);
  });

  it('CT51 - RF10/RN04: resumo traz totais, itens críticos e itens zerados em destaque', async () => {
    pastRepo.find.mockResolvedValue([
      { id: 'p1', estoqueAtual: 0, estoqueMinimo: 5 },
      { id: 'p2', estoqueAtual: 3, estoqueMinimo: 5 },
      { id: 'p3', estoqueAtual: 50, estoqueMinimo: 5 },
    ] as Pastilha[]);

    const r = await service.resumo();

    expect(pastRepo.find).toHaveBeenCalledWith({ where: { ativo: true }, order: { descricao: 'ASC' } });
    expect(r.totalPastilhas).toBe(3);
    expect(r.totalUnidades).toBe(53);
    expect(r.totalCriticos).toBe(2);
    expect(r.itensCriticos.map((i) => i.id)).toEqual(['p1', 'p2']);
    expect(r.totalZerados).toBe(1);
    expect(r.itensZerados.map((i) => i.id)).toEqual(['p1']);
    expect(movRepo.find).toHaveBeenCalledWith({ order: { data: 'DESC' }, take: 5 });
  });
});
