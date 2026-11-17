import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DataSource, Repository } from 'typeorm';
import { MovimentacoesService } from './movimentacoes.service';
import { Movimentacao } from './movimentacao.entity';
import { PastilhasService } from '../pastilhas/pastilhas.service';
import { AlertasService } from '../alertas/alertas.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { Pastilha } from '../pastilhas/pastilha.entity';
import type { CriarMovimentacaoDTO } from '@dda/shared-types';

const pastilha = (over: Partial<Pastilha> = {}) =>
  ({
    id: 'p1',
    codigo: 'PST-001',
    descricao: 'Pastilha CNMG',
    estoqueAtual: 50,
    estoqueMinimo: 10,
    ativo: true,
    ...over,
  }) as Pastilha;

describe('MovimentacoesService', () => {
  let service: MovimentacoesService;
  let repo: DeepMocked<Repository<Movimentacao>>;
  let pastilhas: DeepMocked<PastilhasService>;
  let alertas: DeepMocked<AlertasService>;
  let auditoria: DeepMocked<AuditoriaService>;

  const USER = 'u-almoxarife';
  const entrada: CriarMovimentacaoDTO = { tipo: 'ENTRADA', pastilhaId: 'p1', quantidade: 20, notaFiscal: 'NF-12345' };
  const saida: CriarMovimentacaoDTO = { tipo: 'SAIDA', pastilhaId: 'p1', quantidade: 15, destino: 'MANUTENCAO' };

  beforeEach(async () => {
    repo = createMock<Repository<Movimentacao>>();
    repo.create.mockImplementation((d: any) => d);
    repo.save.mockImplementation(async (d: any) => ({ id: 'm1', ...d }));
    repo.find.mockResolvedValue([]);
    pastilhas = createMock<PastilhasService>();
    alertas = createMock<AlertasService>();
    auditoria = createMock<AuditoriaService>();
    const dataSource = createMock<DataSource>();
    // a transação é simulada: apenas executa o callback
    (dataSource.transaction as jest.Mock).mockImplementation(async (cb: () => unknown) => cb());

    const moduleRef = await Test.createTestingModule({
      providers: [
        MovimentacoesService,
        { provide: getRepositoryToken(Movimentacao), useValue: repo },
        { provide: PastilhasService, useValue: pastilhas },
        { provide: AlertasService, useValue: alertas },
        { provide: AuditoriaService, useValue: auditoria },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = moduleRef.get(MovimentacoesService);
  });

  it('CT21 - RF04: registra entrada com item, quantidade, nota fiscal e responsável', async () => {
    pastilhas.ajustarEstoque.mockResolvedValue(pastilha({ estoqueAtual: 70 }));
    const r = await service.registrar(entrada, USER);
    expect(pastilhas.ajustarEstoque).toHaveBeenCalledWith('p1', 20);
    expect(r).toMatchObject({
      id: 'm1',
      tipo: 'ENTRADA',
      pastilhaId: 'p1',
      quantidade: 20,
      notaFiscal: 'NF-12345',
      usuarioId: USER,
      saldoApos: 70,
    });
  });

  it('CT22 - RF04: rejeita entrada sem nota fiscal', async () => {
    await expect(service.registrar({ ...entrada, notaFiscal: '  ' }, USER)).rejects.toThrow(/RF04/);
    expect(pastilhas.ajustarEstoque).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('CT23 - RF05/RN09: registra saída com destino e responsável', async () => {
    pastilhas.ajustarEstoque.mockResolvedValue(pastilha({ estoqueAtual: 35 }));
    const r = await service.registrar(saida, USER);
    expect(pastilhas.ajustarEstoque).toHaveBeenCalledWith('p1', -15);
    expect(r).toMatchObject({ tipo: 'SAIDA', quantidade: 15, destino: 'MANUTENCAO', usuarioId: USER });
  });

  it('CT24 - RN09: rejeita saída sem setor de destino válido', async () => {
    await expect(service.registrar({ ...saida, destino: 'ESTOQUE' as never }, USER)).rejects.toThrow(/RN09/);
    await expect(service.registrar({ ...saida, destino: undefined }, USER)).rejects.toThrow(/RN09/);
    expect(pastilhas.ajustarEstoque).not.toHaveBeenCalled();
  });

  it('CT25 - RN02: rejeita movimentação sem usuário autenticado', async () => {
    await expect(service.registrar(entrada, undefined)).rejects.toThrow(UnauthorizedException);
    expect(pastilhas.ajustarEstoque).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('CT26 - Dado inválido: rejeita quantidade zero, negativa ou fracionada', async () => {
    for (const quantidade of [0, -5, 1.5]) {
      await expect(service.registrar({ ...entrada, quantidade }, USER)).rejects.toThrow(BadRequestException);
    }
    expect(pastilhas.ajustarEstoque).not.toHaveBeenCalled();
  });

  it('CT27 - RN01: saída sem saldo suficiente não grava movimentação nem auditoria', async () => {
    pastilhas.ajustarEstoque.mockRejectedValue(new BadRequestException('Estoque insuficiente (RN01)'));
    await expect(service.registrar({ ...saida, quantidade: 999 }, USER)).rejects.toThrow('Estoque insuficiente (RN01)');
    expect(repo.save).not.toHaveBeenCalled();
    expect(auditoria.registrar).not.toHaveBeenCalled();
    expect(alertas.gerar).not.toHaveBeenCalled();
  });

  it('CT28 - RF08: gera alerta quando o saldo atinge o estoque mínimo', async () => {
    const p = pastilha({ estoqueAtual: 10, estoqueMinimo: 10 });
    pastilhas.ajustarEstoque.mockResolvedValue(p);
    await service.registrar({ ...saida, quantidade: 40 }, USER);
    expect(alertas.gerar).toHaveBeenCalledWith(p);
  });

  it('CT29 - RF08: não gera alerta quando o saldo fica acima do mínimo', async () => {
    pastilhas.ajustarEstoque.mockResolvedValue(pastilha({ estoqueAtual: 11, estoqueMinimo: 10 }));
    await service.registrar(saida, USER);
    expect(alertas.gerar).not.toHaveBeenCalled();
  });

  it('CT30 - RN10: grava o saldo anterior e o saldo após a movimentação', async () => {
    pastilhas.ajustarEstoque.mockResolvedValue(pastilha({ estoqueAtual: 35 }));
    const r = await service.registrar(saida, USER);
    expect(r).toMatchObject({ saldoAnterior: 50, saldoApos: 35 });
  });

  it('CT31 - RF14/RN05: rejeita ajuste manual sem justificativa', async () => {
    await expect(
      service.ajustarInventario({ pastilhaId: 'p1', quantidadeContada: 47, justificativa: '  ' }, USER),
    ).rejects.toThrow(/RN05/);
    expect(pastilhas.ajustarEstoque).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('CT32 - RF14/RN05: ajuste com justificativa gera movimentação AJUSTE e log de auditoria', async () => {
    pastilhas.findOne.mockResolvedValue(pastilha({ estoqueAtual: 50 }));
    pastilhas.ajustarEstoque.mockResolvedValue(pastilha({ estoqueAtual: 47 }));
    const justificativa = 'Inventário mensal: 3 pastilhas quebradas';
    const r = await service.ajustarInventario({ pastilhaId: 'p1', quantidadeContada: 47, justificativa }, USER);

    expect(pastilhas.ajustarEstoque).toHaveBeenCalledWith('p1', -3);
    expect(r).toMatchObject({
      tipo: 'AJUSTE',
      quantidade: 3,
      justificativa,
      usuarioId: USER,
      saldoAnterior: 50,
      saldoApos: 47,
    });
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        acao: 'AJUSTE',
        usuarioId: USER,
        detalhes: expect.objectContaining({ justificativa, saldoAnterior: 50, saldoApos: 47 }),
      }),
    );
  });

  it('CT33 - RF14: rejeita ajuste quando a contagem é igual ao saldo do sistema', async () => {
    pastilhas.findOne.mockResolvedValue(pastilha({ estoqueAtual: 50 }));
    await expect(
      service.ajustarInventario(
        { pastilhaId: 'p1', quantidadeContada: 50, justificativa: 'Conferência de rotina do inventário' },
        USER,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(pastilhas.ajustarEstoque).not.toHaveBeenCalled();
  });

  it('CT34 - RF15/RNF09: toda movimentação gera registro no log de auditoria', async () => {
    pastilhas.ajustarEstoque.mockResolvedValue(pastilha({ estoqueAtual: 70 }));
    await service.registrar(entrada, USER);
    expect(auditoria.registrar).toHaveBeenCalledTimes(1);
    expect(auditoria.registrar).toHaveBeenCalledWith({
      acao: 'ENTRADA',
      entidade: 'movimentacao',
      entidadeId: 'm1',
      usuarioId: USER,
      detalhes: { pastilhaId: 'p1', quantidade: 20, saldoAnterior: 50, saldoApos: 70 },
    });
  });

  it('CT35 - RF09: histórico completo, da movimentação mais recente para a mais antiga', async () => {
    await service.findAll();
    expect(repo.find).toHaveBeenCalledWith({ where: {}, order: { data: 'DESC' } });

    await service.findAll({ pastilhaId: 'p1', tipo: 'SAIDA' });
    expect(repo.find).toHaveBeenLastCalledWith({ where: { pastilhaId: 'p1', tipo: 'SAIDA' }, order: { data: 'DESC' } });
  });
});
