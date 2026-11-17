import { describe, expect, it } from 'vitest';
import { montarBaseUrl } from './apiUrl';

describe('URL base da API', () => {
  it('CT68 - RNF08: as chamadas usam a API versionada (/v1)', () => {
    expect(montarBaseUrl(undefined)).toBe('http://localhost:3000/v1');
    expect(montarBaseUrl('https://api.nanostock.com.br/')).toBe('https://api.nanostock.com.br/v1');
  });
});
