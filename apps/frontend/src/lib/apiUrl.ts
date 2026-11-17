/** RNF08 – a API REST é versionada na URI; o backend expõe as rotas sob /v1. */
export const API_VERSION = 'v1';

export function montarBaseUrl(url?: string): string {
  const base = (url?.trim() || 'http://localhost:3000').replace(/\/+$/, '');
  return `${base}/${API_VERSION}`;
}
