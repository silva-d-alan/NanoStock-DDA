import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AjusteInventarioDto, CriarMovimentacaoDto } from './movimentacao.dto';

const ID = '3f2b8c1e-5d4a-4e7b-9a6c-1f0e2d3c4b5a';
const camposComErro = async (classe: new () => object, dados: object) =>
  (await validate(plainToInstance(classe, dados))).map((e) => e.property);

describe('DTOs de movimentação (validação da requisição)', () => {
  it('CT36 - RF04/RF05/RN09: valida os campos obrigatórios conforme o tipo', async () => {
    await expect(
      camposComErro(CriarMovimentacaoDto, { tipo: 'ENTRADA', pastilhaId: ID, quantidade: 5, notaFiscal: 'NF-1' }),
    ).resolves.toEqual([]);
    await expect(
      camposComErro(CriarMovimentacaoDto, { tipo: 'ENTRADA', pastilhaId: ID, quantidade: 5 }),
    ).resolves.toEqual(['notaFiscal']);
    await expect(
      camposComErro(CriarMovimentacaoDto, { tipo: 'SAIDA', pastilhaId: ID, quantidade: 5, destino: 'ALMOXARIFADO' }),
    ).resolves.toEqual(['destino']);
    await expect(
      camposComErro(CriarMovimentacaoDto, { tipo: 'DEVOLUCAO', pastilhaId: 'abc', quantidade: 0 }),
    ).resolves.toEqual(['tipo', 'pastilhaId', 'quantidade']);
  });

  it('CT37 - RF14/RN05: ajuste exige justificativa com pelo menos 10 caracteres', async () => {
    await expect(
      camposComErro(AjusteInventarioDto, { pastilhaId: ID, quantidadeContada: 47, justificativa: 'quebra' }),
    ).resolves.toEqual(['justificativa']);
    await expect(
      camposComErro(AjusteInventarioDto, { pastilhaId: ID, quantidadeContada: 47, justificativa: 'Contagem física mensal' }),
    ).resolves.toEqual([]);
  });
});
