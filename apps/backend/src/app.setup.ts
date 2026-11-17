import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';

export const API_VERSION = '1';

/**
 * Configuração HTTP global da aplicação.
 * RNF08 – API REST versionada: todas as rotas ficam sob /v1 (ex.: /v1/pastilhas),
 * o que permite publicar uma /v2 no futuro sem quebrar integrações com ERP.
 */
export function configurarApp(app: INestApplication) {
  app.enableCors({ origin: '*' });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: API_VERSION });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
