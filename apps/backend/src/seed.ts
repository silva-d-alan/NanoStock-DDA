import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import type { DestinoSaida, PerfilUsuario } from '@dda/shared-types';
import { AppModule } from './app.module';
import { Usuario } from './modules/usuarios/usuario.entity';
import { Fabricante } from './modules/fabricantes/fabricante.entity';
import { Pastilha } from './modules/pastilhas/pastilha.entity';
import { Movimentacao } from './modules/movimentacoes/movimentacao.entity';
import { Auditoria } from './modules/auditoria/auditoria.entity';
import { PastilhasService } from './modules/pastilhas/pastilhas.service';
import { MovimentacoesService } from './modules/movimentacoes/movimentacoes.service';

/**
 * Popula o banco com dados iniciais.
 *
 * - Usuários: um por perfil. Sempre roda e só cria os que ainda não existem.
 * - Dados de demonstração: fornecedores, pastilhas e 60 dias de movimentações.
 *   Só roda se não houver nenhuma pastilha cadastrada, para nunca misturar com dados reais.
 *   Desligado por padrão em produção (NODE_ENV=production); force com SEED_DEMO=true ou desligue com SEED_DEMO=false.
 *
 * As movimentações passam pelo MovimentacoesService, então saldos (RN10), auditoria (RF15)
 * e alertas de estoque mínimo (RF08/RN03) ficam coerentes com as regras do sistema.
 *
 * Variáveis opcionais: SEED_SENHA_ADMIN (padrão admin123), SEED_SENHA_PADRAO (padrão dda12345), SEED_DEMO.
 */

const DIA_MS = 86_400_000;

const USUARIOS: { nome: string; email: string; perfil: PerfilUsuario }[] = [
  { nome: 'Administrador', email: 'admin@dda.com', perfil: 'ADMIN' },
  { nome: 'Ana Souza (Almoxarife)', email: 'almoxarife@dda.com', perfil: 'ALMOXARIFE' },
  { nome: 'Bruno Lima (Comprador)', email: 'comprador@dda.com', perfil: 'COMPRADOR' },
  { nome: 'Carla Mendes (Gestora)', email: 'gestor@dda.com', perfil: 'GESTOR' },
];

const FABRICANTES = [
  { nome: 'Sandvik Coromant', cnpj: '11.111.111/0001-11', contato: 'vendas.sul@sandvik.exemplo.com' },
  { nome: 'Iscar do Brasil', cnpj: '22.222.222/0001-22', contato: '(47) 3000-1000' },
  { nome: 'Kennametal', cnpj: '33.333.333/0001-33', contato: 'atendimento@kennametal.exemplo.com' },
  { nome: 'Mitsubishi Materials', cnpj: '44.444.444/0001-44', contato: '(11) 4000-2000' },
  { nome: 'Walter Tools', cnpj: '55.555.555/0001-55', contato: 'comercial@walter.exemplo.com' },
];

/** fabricante = índice em FABRICANTES */
const PASTILHAS = [
  { codigo: 'CNMG-120408-PM', descricao: 'Pastilha CNMG 120408 PM – metal duro', aplicacao: 'Torneamento externo – desbaste médio em aço', unidade: 'UN', estoqueMinimo: 20, fabricante: 0 },
  { codigo: 'WNMG-080408-MF', descricao: 'Pastilha WNMG 080408 MF – metal duro', aplicacao: 'Torneamento – acabamento em inox', unidade: 'UN', estoqueMinimo: 15, fabricante: 0 },
  { codigo: 'DNMG-150608-SM', descricao: 'Pastilha DNMG 150608 SM – metal duro', aplicacao: 'Perfilamento em aço inox e ligas resistentes ao calor', unidade: 'UN', estoqueMinimo: 10, fabricante: 1 },
  { codigo: 'TNMG-160408-TF', descricao: 'Pastilha TNMG 160408 TF – metal duro', aplicacao: 'Torneamento geral em aço carbono', unidade: 'UN', estoqueMinimo: 12, fabricante: 1 },
  { codigo: 'VCMT-160404-F', descricao: 'Pastilha VCMT 160404 F – cermet', aplicacao: 'Acabamento fino de perfis', unidade: 'UN', estoqueMinimo: 8, fabricante: 2 },
  { codigo: 'CCMT-09T304-HQ', descricao: 'Pastilha CCMT 09T304 HQ – metal duro', aplicacao: 'Torneamento interno de pequenos diâmetros', unidade: 'UN', estoqueMinimo: 10, fabricante: 3 },
  { codigo: 'SNMG-120408-MA', descricao: 'Pastilha SNMG 120408 MA – metal duro', aplicacao: 'Desbaste em ferro fundido', unidade: 'UN', estoqueMinimo: 10, fabricante: 3 },
  { codigo: 'APKT-1604PDR', descricao: 'Pastilha APKT 1604 PDR – fresamento', aplicacao: 'Fresamento de topo e de faceamento', unidade: 'UN', estoqueMinimo: 20, fabricante: 4 },
  { codigo: 'RCMT-1204MO', descricao: 'Pastilha RCMT 1204 MO – redonda', aplicacao: 'Fresamento de cópia e moldes', unidade: 'UN', estoqueMinimo: 6, fabricante: 4 },
  { codigo: 'LNMX-150608-ML', descricao: 'Pastilha LNMX 150608 ML – caixa com 10', aplicacao: 'Fresamento de alto avanço', unidade: 'CX', estoqueMinimo: 2, fabricante: 2 },
];

type Evento =
  | { dias: number; codigo: string; tipo: 'ENTRADA'; qtd: number; nf: string; obs?: string }
  | { dias: number; codigo: string; tipo: 'SAIDA'; qtd: number; destino: DestinoSaida; obs?: string }
  | { dias: number; codigo: string; tipo: 'AJUSTE'; contada: number; justificativa: string };

/**
 * Histórico dos últimos 60 dias (dias = há quantos dias aconteceu). Situação final planejada:
 * - normais: CNMG, WNMG, TNMG, CCMT, APKT, LNMX
 * - abaixo do mínimo (alerta): DNMG (6/10), SNMG (10/10), RCMT (4/6)
 * - zerado (saída bloqueada): VCMT (0/8)
 */
const EVENTOS: Evento[] = [
  // compras iniciais
  { dias: 60, codigo: 'CNMG-120408-PM', tipo: 'ENTRADA', qtd: 100, nf: 'NF-104520' },
  { dias: 60, codigo: 'WNMG-080408-MF', tipo: 'ENTRADA', qtd: 60, nf: 'NF-104520' },
  { dias: 59, codigo: 'DNMG-150608-SM', tipo: 'ENTRADA', qtd: 40, nf: 'NF-77812' },
  { dias: 59, codigo: 'TNMG-160408-TF', tipo: 'ENTRADA', qtd: 50, nf: 'NF-77812' },
  { dias: 58, codigo: 'VCMT-160404-F', tipo: 'ENTRADA', qtd: 30, nf: 'NF-30177' },
  { dias: 58, codigo: 'LNMX-150608-ML', tipo: 'ENTRADA', qtd: 8, nf: 'NF-30177' },
  { dias: 57, codigo: 'CCMT-09T304-HQ', tipo: 'ENTRADA', qtd: 40, nf: 'NF-55031' },
  { dias: 57, codigo: 'SNMG-120408-MA', tipo: 'ENTRADA', qtd: 30, nf: 'NF-55031' },
  { dias: 56, codigo: 'APKT-1604PDR', tipo: 'ENTRADA', qtd: 80, nf: 'NF-90214' },
  { dias: 56, codigo: 'RCMT-1204MO', tipo: 'ENTRADA', qtd: 20, nf: 'NF-90214' },

  // consumo do mês anterior
  { dias: 52, codigo: 'CNMG-120408-PM', tipo: 'SAIDA', qtd: 20, destino: 'PRODUCAO', obs: 'Linha de tornos CNC – célula 2' },
  { dias: 50, codigo: 'APKT-1604PDR', tipo: 'SAIDA', qtd: 15, destino: 'PRODUCAO' },
  { dias: 48, codigo: 'DNMG-150608-SM', tipo: 'SAIDA', qtd: 12, destino: 'PRODUCAO' },
  { dias: 46, codigo: 'VCMT-160404-F', tipo: 'SAIDA', qtd: 10, destino: 'PRODUCAO' },
  { dias: 45, codigo: 'TNMG-160408-TF', tipo: 'SAIDA', qtd: 10, destino: 'MANUTENCAO', obs: 'Recuperação de eixos' },
  { dias: 43, codigo: 'SNMG-120408-MA', tipo: 'SAIDA', qtd: 8, destino: 'PRODUCAO' },
  { dias: 41, codigo: 'WNMG-080408-MF', tipo: 'SAIDA', qtd: 12, destino: 'PRODUCAO' },
  { dias: 40, codigo: 'RCMT-1204MO', tipo: 'SAIDA', qtd: 6, destino: 'TERCEIROS', obs: 'Ferramentaria terceirizada – molde 118' },
  { dias: 38, codigo: 'CCMT-09T304-HQ', tipo: 'SAIDA', qtd: 8, destino: 'MANUTENCAO' },
  { dias: 36, codigo: 'LNMX-150608-ML', tipo: 'SAIDA', qtd: 2, destino: 'PRODUCAO' },
  { dias: 35, codigo: 'CNMG-120408-PM', tipo: 'SAIDA', qtd: 25, destino: 'PRODUCAO' },

  // inventário mensal
  { dias: 31, codigo: 'APKT-1604PDR', tipo: 'AJUSTE', contada: 62, justificativa: 'Inventário mensal: 3 pastilhas com aresta lascada descartadas' },
  { dias: 31, codigo: 'CCMT-09T304-HQ', tipo: 'AJUSTE', contada: 33, justificativa: 'Inventário mensal: caixa com 1 unidade a mais que o registrado' },

  // últimos 30 dias (aparecem no relatório de consumo padrão)
  { dias: 28, codigo: 'CNMG-120408-PM', tipo: 'ENTRADA', qtd: 40, nf: 'NF-105877' },
  { dias: 27, codigo: 'DNMG-150608-SM', tipo: 'SAIDA', qtd: 14, destino: 'PRODUCAO' },
  { dias: 25, codigo: 'VCMT-160404-F', tipo: 'SAIDA', qtd: 12, destino: 'PRODUCAO' },
  { dias: 24, codigo: 'SNMG-120408-MA', tipo: 'SAIDA', qtd: 6, destino: 'MANUTENCAO' },
  { dias: 22, codigo: 'APKT-1604PDR', tipo: 'SAIDA', qtd: 18, destino: 'PRODUCAO' },
  { dias: 20, codigo: 'TNMG-160408-TF', tipo: 'SAIDA', qtd: 12, destino: 'PRODUCAO' },
  { dias: 19, codigo: 'WNMG-080408-MF', tipo: 'SAIDA', qtd: 10, destino: 'TERCEIROS', obs: 'Usinagem externa – lote 2231' },
  { dias: 17, codigo: 'RCMT-1204MO', tipo: 'SAIDA', qtd: 6, destino: 'PRODUCAO' },
  { dias: 15, codigo: 'CNMG-120408-PM', tipo: 'SAIDA', qtd: 30, destino: 'PRODUCAO' },
  { dias: 14, codigo: 'VCMT-160404-F', tipo: 'SAIDA', qtd: 8, destino: 'MANUTENCAO' },
  { dias: 12, codigo: 'DNMG-150608-SM', tipo: 'SAIDA', qtd: 8, destino: 'MANUTENCAO' },
  { dias: 11, codigo: 'APKT-1604PDR', tipo: 'ENTRADA', qtd: 30, nf: 'NF-91002' },
  { dias: 10, codigo: 'SNMG-120408-MA', tipo: 'SAIDA', qtd: 6, destino: 'PRODUCAO' },
  { dias: 8, codigo: 'CCMT-09T304-HQ', tipo: 'SAIDA', qtd: 9, destino: 'PRODUCAO' },
  { dias: 7, codigo: 'TNMG-160408-TF', tipo: 'SAIDA', qtd: 6, destino: 'TERCEIROS' },
  { dias: 6, codigo: 'LNMX-150608-ML', tipo: 'SAIDA', qtd: 2, destino: 'PRODUCAO' },
  { dias: 5, codigo: 'RCMT-1204MO', tipo: 'AJUSTE', contada: 4, justificativa: 'Contagem física: 4 pastilhas não localizadas no almoxarifado' },
  { dias: 4, codigo: 'APKT-1604PDR', tipo: 'SAIDA', qtd: 20, destino: 'PRODUCAO' },
  { dias: 3, codigo: 'WNMG-080408-MF', tipo: 'SAIDA', qtd: 8, destino: 'PRODUCAO' },
  { dias: 2, codigo: 'CNMG-120408-PM', tipo: 'SAIDA', qtd: 15, destino: 'MANUTENCAO' },
];

function demoHabilitado() {
  const flag = process.env.SEED_DEMO?.toLowerCase();
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

async function seedUsuarios(app: INestApplicationContext) {
  const repo = app.get<Repository<Usuario>>(getRepositoryToken(Usuario));
  const senhaAdmin = process.env.SEED_SENHA_ADMIN || 'admin123';
  const senhaPadrao = process.env.SEED_SENHA_PADRAO || 'dda12345';
  const porPerfil = new Map<PerfilUsuario, Usuario>();

  for (const u of USUARIOS) {
    let usuario = await repo.findOne({ where: { email: u.email } });
    if (!usuario) {
      const senha = u.perfil === 'ADMIN' ? senhaAdmin : senhaPadrao;
      usuario = await repo.save(repo.create({ ...u, senhaHash: await bcrypt.hash(senha, 10) }));
      console.log(`✅ Usuário criado: ${u.email} (${u.perfil}) / ${senha}`);
    }
    porPerfil.set(u.perfil, usuario);
  }
  return porPerfil;
}

async function seedDemo(app: INestApplicationContext, usuarios: Map<PerfilUsuario, Usuario>) {
  const pastilhasRepo = app.get<Repository<Pastilha>>(getRepositoryToken(Pastilha));
  if ((await pastilhasRepo.count()) > 0) {
    console.log('ℹ️ Já existem pastilhas cadastradas; dados de demonstração não foram gerados.');
    return;
  }

  const fabricantesRepo = app.get<Repository<Fabricante>>(getRepositoryToken(Fabricante));
  const movRepo = app.get<Repository<Movimentacao>>(getRepositoryToken(Movimentacao));
  const auditoriaRepo = app.get<Repository<Auditoria>>(getRepositoryToken(Auditoria));
  const pastilhasService = app.get(PastilhasService);
  const movimentacoesService = app.get(MovimentacoesService);

  // 1. fornecedores (reaproveita os que já existirem com o mesmo nome)
  const fabricantes: Fabricante[] = [];
  for (const f of FABRICANTES) {
    fabricantes.push((await fabricantesRepo.findOne({ where: { nome: f.nome } })) ?? (await fabricantesRepo.save(fabricantesRepo.create(f))));
  }

  // 2. pastilhas – pelo service, para aplicar as mesmas validações do cadastro (RF01/RN06/RN07)
  const idPorCodigo = new Map<string, string>();
  for (const { fabricante, ...p } of PASTILHAS) {
    const criada = await pastilhasService.criar({ ...p, fabricanteId: fabricantes[fabricante].id });
    idPorCodigo.set(p.codigo, criada.id);
  }

  // 3. movimentações em ordem cronológica, pelo service (saldo, auditoria e alertas)
  const almoxarife = usuarios.get('ALMOXARIFE') ?? usuarios.get('ADMIN')!;
  const agora = Date.now();
  let total = 0;
  for (const ev of [...EVENTOS].sort((a, b) => b.dias - a.dias)) {
    const pastilhaId = idPorCodigo.get(ev.codigo)!;
    let mov: Movimentacao;
    if (ev.tipo === 'AJUSTE') {
      mov = await movimentacoesService.ajustarInventario(
        { pastilhaId, quantidadeContada: ev.contada, justificativa: ev.justificativa },
        almoxarife.id,
      );
    } else {
      mov = await movimentacoesService.registrar(
        ev.tipo === 'ENTRADA'
          ? { tipo: 'ENTRADA', pastilhaId, quantidade: ev.qtd, notaFiscal: ev.nf, observacao: ev.obs }
          : { tipo: 'SAIDA', pastilhaId, quantidade: ev.qtd, destino: ev.destino, observacao: ev.obs },
        almoxarife.id,
      );
    }
    // retroage a data (09h00 + alguns minutos por evento) para o histórico e os relatórios
    const data = new Date(agora - ev.dias * DIA_MS);
    data.setHours(9, total % 60, 0, 0);
    await movRepo.update(mov.id, { data });
    await auditoriaRepo.update({ entidade: 'movimentacao', entidadeId: mov.id }, { data });
    total++;
  }

  const finais = await pastilhasRepo.find({ where: { id: In([...idPorCodigo.values()]) } });
  const criticos = finais.filter((p) => p.estoqueAtual <= p.estoqueMinimo);
  console.log(
    `✅ Dados de demonstração: ${fabricantes.length} fornecedores, ${finais.length} pastilhas, ${total} movimentações; ` +
      `${criticos.length} itens no mínimo ou abaixo dele (${criticos.filter((p) => p.estoqueAtual === 0).length} zerado).`,
  );
}

export async function seed(app: INestApplicationContext) {
  const usuarios = await seedUsuarios(app);
  if (demoHabilitado()) await seedDemo(app, usuarios);
}

// Execução avulsa: `npm run seed`
if (require.main === module) {
  (async () => {
    const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
    try {
      await seed(app);
    } finally {
      await app.close();
    }
  })().catch((e) => {
    console.error('❌ Falha no seed:', e);
    process.exit(1);
  });
}
