// Lista cada caso de teste (✓/✕) com o nome da suíte. Usado porque, neste
// ambiente (Jest 30 + --experimental-vm-modules), o reporter padrão só imprime o resumo.
class CtReporter {
  onTestResult(_test, result) {
    const arquivo = result.testFilePath.replace(process.cwd() + '/', '');
    const ok = result.numFailingTests === 0 && !result.testExecError;
    console.log(`\n${ok ? 'PASS' : 'FAIL'} ${arquivo}`);
    if (result.testExecError) console.log(`  ✕ ${result.testExecError.message}`);
    for (const t of result.testResults) {
      const icone = t.status === 'passed' ? '✓' : t.status === 'failed' ? '✕' : '○';
      console.log(`  ${icone} ${[...t.ancestorTitles, t.title].join(' › ')} (${t.duration ?? 0} ms)`);
      for (const msg of t.failureMessages) console.log(msg.split('\n').map((l) => '      ' + l).join('\n'));
    }
  }
}
module.exports = CtReporter;
