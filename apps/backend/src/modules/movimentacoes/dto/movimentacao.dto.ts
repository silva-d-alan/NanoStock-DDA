import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min, MinLength, ValidateIf } from 'class-validator';
import type { AjusteInventarioDTO, CriarMovimentacaoDTO, DestinoSaida } from '@dda/shared-types';

/** RN09 – setores de destino aceitos em uma saída */
export const DESTINOS: readonly DestinoSaida[] = ['PRODUCAO', 'MANUTENCAO', 'TERCEIROS'];

/** RN05 – tamanho mínimo para a justificativa não ser um texto vazio de sentido */
export const JUSTIFICATIVA_MIN = 10;

export class CriarMovimentacaoDto implements CriarMovimentacaoDTO {
  @IsIn(['ENTRADA', 'SAIDA'])
  tipo: 'ENTRADA' | 'SAIDA';

  @IsUUID()
  pastilhaId: string;

  @IsInt()
  @Min(1)
  quantidade: number;

  @ValidateIf((o: CriarMovimentacaoDto) => o.tipo === 'ENTRADA')
  @IsString()
  @IsNotEmpty()
  notaFiscal?: string;

  @ValidateIf((o: CriarMovimentacaoDto) => o.tipo === 'SAIDA')
  @IsIn(DESTINOS)
  destino?: DestinoSaida;

  @IsOptional()
  @IsString()
  observacao?: string;
}

export class AjusteInventarioDto implements AjusteInventarioDTO {
  @IsUUID()
  pastilhaId: string;

  @IsInt()
  @Min(0)
  quantidadeContada: number;

  @IsString()
  @MinLength(JUSTIFICATIVA_MIN)
  justificativa: string;
}
