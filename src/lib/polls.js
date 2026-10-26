const REQUIRED = ['institute', 'fieldStart', 'fieldEnd', 'sampleSize', 'targetPopulation', 'method'];

export function validatePoll(poll) {
  const missing = REQUIRED.filter(k => poll[k] == null || poll[k] === '');
  const warnings = [];
  if (poll.turnoutProbability == null) warnings.push('Comparecimento por grupo não medido: variável desconhecida.');
  if (poll.marginOfError == null) warnings.push('Margem de erro não informada.');
  return { valid: missing.length === 0, missing, warnings };
}

export function comparePollToScenario(poll, scenario) {
  const target = poll.voteIntention ?? {};
  const modeled = scenario.columnTotals;
  const valid = (modeled.lula ?? 0) + (modeled.flavio ?? 0);
  return {
    institute: poll.institute,
    field: `${poll.fieldStart} a ${poll.fieldEnd}`,
    methodologicalWarning: 'Intenção declarada não é voto observado; populações-alvo e denominadores devem coincidir.',
    differencesPp: Object.fromEntries(['lula', 'flavio'].filter(k => target[k] != null).map(k => [k, ((modeled[k] / valid) * 100) - target[k]]))
  };
}
