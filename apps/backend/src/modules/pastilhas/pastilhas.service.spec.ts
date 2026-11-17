import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ILike, Repository } from 'typeorm';
import { PastilhasService } from './pastilhas.service';
import { Pastilha } from './pastilha.entity';

const pastilha = (over: Partial<Pastilha> = {}): Pastilha =>
  ({
    id: 'p1',
    codigo: 'PST-001',
    descricao: 'Pastilha metal duro CNMG 120408',
    aplicacao: 'Torneamento',
    unidade: 'UN',
    estoqueMinimo: 10,
    estoqueAtual: 50,
    fabricanteId: 'f1',
    ativo: true,
    ...over,
  }) as Pastilha;

describe('PastilhasService', () => {
  let service: PastilhasService;
  let repo: DeepMocked<Repository<Pastilha>>;

  const novo = {
    codigo: 'PST-001',
    descricao: 'Pastilha CNMG',
    aplicacao: 'Torneamento',
    unidade: 'UN',
    fabricanteId: 'f1',
    estoqueMinimo: 10,
  };

  beforeEach(async () => {
    repo = createMock<Repository<Pastilha>>();
    repo.create.mockImplementation((d: any) => d);
    repo.save.mockImplementation(async (d: any) => d);
    repo.findOne.mockResolvedValue(null);
    repo.find.mockResolvedValue([]);

    const moduleRef = await Test.createTestingModule({
      providers: [PastilhasService, { provide: getRepositoryToken(Pastilha), useValue: repo }],
    }).compile();
    service = moduleRef.get(PastilhasService);
  });

  it('CT01 - RF01: cadastra pastilha válida com saldo inicial zero', async () => {
    const r = await service.criar(novo);
    expect(r).toEqual({ ...novo, estoqueAtual: 0, ativo: true });
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('CT02 - RF01: rejeita cadastro sem código', async () => {
    await expect(service.criar({ ...novo, codigo: '  ' })).rejects.toThrow(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('CT03 - RF01: rejeita cadastro sem descrição', async () => {
    await expect(service.criar({ ...novo, descricao: '' })).rejects.toThrow('Descrição é obrigatória (RF01)');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('CT04 - RF02: rejeita cadastro sem fabricante vinculado', async () => {
    await expect(service.criar({ ...novo, fabricanteId: '' })).rejects.toThrow('Fabricante é obrigatório (RF02)');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('CT05 - RN06: rejeita código já utilizado, mesmo por item excluído', async () => {
    repo.findOne.mockResolvedValue(pastilha({ ativo: false }));
    await expect(service.criar(novo)).rejects.toThrow(ConflictException);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { codigo: 'PST-001' } });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('CT06 - RN06: exclusão é lógica e mantém o registro (código não é liberado)', async () => {
    repo.findOne.mockResolvedValue(pastilha());
    const r = await service.remover('p1');
    expect(r.ativo).toBe(false);
    expect(r.codigo).toBe('PST-001');
    expect(repo.remove).not.toHaveBeenCalled();
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('CT07 - RN06: não permite alterar o código de um item existente', async () => {
    repo.findOne.mockResolvedValue(pastilha());
    await expect(service.atualizar('p1', { codigo: 'PST-999' })).rejects.toThrow(/RN06/);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('CT08 - RF03: busca por código ou descrição', async () => {
    repo.find.mockResolvedValue([pastilha()]);
    const r = await service.buscar(' CNMG ');
    expect(repo.find).toHaveBeenCalledWith({
      where: [
        { codigo: ILike('%CNMG%'), ativo: true },
        { descricao: ILike('%CNMG%'), ativo: true },
      ],
      order: { descricao: 'ASC' },
    });
    expect(r).toHaveLength(1);
  });

  it('CT09 - RF03: busca sem termo devolve todos os itens ativos', async () => {
    await service.buscar('   ');
    expect(repo.find).toHaveBeenCalledWith({ where: { ativo: true }, order: { descricao: 'ASC' } });
  });

  it('CT10 - RF06: consulta o saldo disponível do item', async () => {
    repo.findOne.mockResolvedValue(pastilha({ estoqueAtual: 8, estoqueMinimo: 10 }));
    await expect(service.saldo('p1')).resolves.toEqual({
      id: 'p1',
      codigo: 'PST-001',
      descricao: 'Pastilha metal duro CNMG 120408',
      unidade: 'UN',
      estoqueAtual: 8,
      estoqueMinimo: 10,
      abaixoMinimo: true,
    });
  });

  it('CT11 - RF07/RN07: define o estoque mínimo de um item', async () => {
    repo.findOne.mockResolvedValue(pastilha({ estoqueMinimo: 10 }));
    const r = await service.definirEstoqueMinimo('p1', 25);
    expect(r.estoqueMinimo).toBe(25);
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1', estoqueMinimo: 25 }));
  });

  it('CT12 - RF07/RN07: rejeita estoque mínimo negativo ou fracionado', async () => {
    await expect(service.definirEstoqueMinimo('p1', -1)).rejects.toThrow(/RN07/);
    await expect(service.definirEstoqueMinimo('p1', 2.5)).rejects.toThrow(/RN07/);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('CT13 - Item inexistente: lança NotFoundException', async () => {
    await expect(service.findOne('nao-existe')).rejects.toThrow(NotFoundException);
    await expect(service.ajustarEstoque('nao-existe', 5)).rejects.toThrow('Pastilha não encontrada');
  });

  it('CT14 - RN01: bloqueia saída superior ao saldo disponível', async () => {
    repo.findOne.mockResolvedValue(pastilha({ estoqueAtual: 50 }));
    await expect(service.ajustarEstoque('p1', -51)).rejects.toThrow('Estoque insuficiente (RN01)');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('CT15 - RN01 (limite): permite saída igual ao saldo, zerando o estoque', async () => {
    repo.findOne.mockResolvedValue(pastilha({ estoqueAtual: 50 }));
    const r = await service.ajustarEstoque('p1', -50);
    expect(r.estoqueAtual).toBe(0);
  });

  it('CT16 - RN04: item com estoque zerado é bloqueado para saída', async () => {
    repo.findOne.mockResolvedValue(pastilha({ estoqueAtual: 0 }));
    await expect(service.ajustarEstoque('p1', -1)).rejects.toThrow(/RN04/);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('CT17 - RN10: entrada soma a quantidade ao saldo e persiste o novo valor', async () => {
    repo.findOne.mockResolvedValue(pastilha({ estoqueAtual: 50 }));
    const r = await service.ajustarEstoque('p1', 20);
    expect(r.estoqueAtual).toBe(70);
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1', estoqueAtual: 70 }));
  });
});
