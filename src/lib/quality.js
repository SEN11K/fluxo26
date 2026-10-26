import { sum } from './utils.js';

const TOLERANCE = 0;

export function validateRows(rows, { key = row => `${row.round}:${row.unitKey}`, coverageFields = ['eligible', 'attendance', 'abstention'] } = {}) {
  const seen = new Map();
  const issues = [];
  let missing = 0;
  for (const row of rows) {
    const k = key(row);
    if (seen.has(k)) issues.push({ severity: 'error', code: 'DUPLICATE', key: k, message: 'Chave duplicada no mesmo universo.' });
    seen.set(k, row);
    const absent = coverageFields.filter(f => row[f] == null || !Number.isFinite(row[f]));
    if (absent.length) { missing++; issues.push({ severity: 'error', code: 'MISSING', key: k, fields: absent, message: `Campos ausentes: ${absent.join(', ')}` }); }
    if (row.eligible != null && row.attendance != null && row.abstention != null) {
      const delta = row.eligible - row.attendance - row.abstention - (row.unavailableEligible ?? 0);
      if (Math.abs(delta) > TOLERANCE) issues.push({ severity: 'error', code: 'ELECTORATE_BALANCE', key: k, delta, message: 'Aptos ≠ comparecimento + abstenção + eleitores de seções não instaladas.' });
    }
    if ([row.validVotes, row.blankVotes, row.nullVotes].every(Number.isFinite) && row.attendance != null) {
      const delta = row.attendance - row.validVotes - row.blankVotes - row.nullVotes - (row.pendingVotes ?? 0);
      if (Math.abs(delta) > TOLERANCE) issues.push({ severity: 'error', code: 'BALLOT_BALANCE', key: k, delta, message: 'Comparecimento ≠ válidos + brancos + nulos + pendentes.' });
    }
  }
  return {
    rowCount: rows.length,
    uniqueKeys: seen.size,
    duplicates: issues.filter(x => x.code === 'DUPLICATE').length,
    rowsWithMissing: missing,
    errors: issues.filter(x => x.severity === 'error').length,
    issues
  };
}

export function compareCoverage(first, second, key = row => row.unitKey) {
  const a = new Map(first.map(r => [key(r), r]));
  const b = new Map(second.map(r => [key(r), r]));
  const onlyFirst = [...a.keys()].filter(k => !b.has(k));
  const onlySecond = [...b.keys()].filter(k => !a.has(k));
  const comparable = [...a.keys()].filter(k => b.has(k));
  return { firstCount: a.size, secondCount: b.size, comparable, onlyFirst, onlySecond, compatible: onlyFirst.length === 0 && onlySecond.length === 0 };
}

export function compareNationalToMunicipal(national, municipalities, fields) {
  return fields.map(field => {
    const municipalSum = sum(municipalities.map(x => x[field]));
    const official = national[field];
    return { field, official, municipalSum, delta: official - municipalSum, matches: official === municipalSum };
  });
}
