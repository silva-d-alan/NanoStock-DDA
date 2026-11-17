/** RF13 – gera CSV com ";" (abre direto no Excel pt-BR) */
export function gerarCSV(linhas: Record<string, unknown>[], sep = ';'): string {
  if (linhas.length === 0) return '';
  const colunas = Object.keys(linhas[0]);
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return s.includes(sep) || /["\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [colunas.join(sep), ...linhas.map((l) => colunas.map((c) => esc(l[c])).join(sep))].join('\n');
}

export function baixarArquivo(nomeArquivo: string, conteudo: Blob) {
  const url = URL.createObjectURL(conteudo);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

export function baixarCSV(nomeArquivo: string, linhas: Record<string, unknown>[]) {
  // BOM para o Excel reconhecer UTF-8
  baixarArquivo(nomeArquivo, new Blob(['\uFEFF' + gerarCSV(linhas)], { type: 'text/csv;charset=utf-8' }));
}
