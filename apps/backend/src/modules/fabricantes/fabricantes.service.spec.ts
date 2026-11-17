import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Repository } from 'typeorm';
import { FabricantesService } from './fabricantes.service';
import { Fabricante } from './fabricante.entity';

describe('FabricantesService', () => {
  let service: FabricantesService;
  let repo: DeepMocked<Repository<Fabricante>>;

  beforeEach(async () => {
    repo = createMock<Repository<Fabricante>>();
    repo.create.mockImplementation((d: any) => d);
    repo.save.mockImplementation(async (d: any) => ({ id: 'f1', ...d }));
    repo.findOne.mockResolvedValue(null);

    const moduleRef = await Test.createTestingModule({
      providers: [FabricantesService, { provide: getRepositoryToken(Fabricante), useValue: repo }],
    }).compile();
    service = moduleRef.get(FabricantesService);
  });

  it('CT18 - RF02: cadastra fabricante/fornecedor válido', async () => {
    const r = await service.criar({ nome: ' Sandvik Coromant ', cnpj: '12.345.678/0001-90' });
    expect(r).toEqual({ id: 'f1', nome: 'Sandvik Coromant', cnpj: '12.345.678/0001-90' });
  });

  it('CT19 - RF02: rejeita fabricante sem nome', async () => {
    expect(() => service.criar({ nome: '   ' })).toThrow(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('CT20 - RF02: não exclui fabricante vinculado a itens de estoque', async () => {
    repo.findOne.mockResolvedValue({ id: 'f1', nome: 'Sandvik', pastilhas: [{ id: 'p1' }] } as Fabricante);
    await expect(service.remover('f1')).rejects.toThrow(ConflictException);
    expect(repo.remove).not.toHaveBeenCalled();
  });
});
