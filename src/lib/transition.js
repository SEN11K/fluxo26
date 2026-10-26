import { clamp, round, seededRandom, sum } from './utils.js';

export const DESTINATIONS = ['lula', 'flavio', 'blank', 'null', 'abstention'];

export function buildGroups(first, finalists = ['lula', 'flavio']) {
  const [a, b] = finalists;
  return {
    [a]: first.candidates[a],
    [b]: first.candidates[b],
    eliminated: Object.entries(first.candidates).filter(([k]) => !finalists.includes(k)).reduce((s, [, v]) => s + v, 0),
    blankNull: first.blankVotes + first.nullVotes,
    abstention: first.abstention
  };
}

export function buildTargets(second, finalists = ['lula', 'flavio']) {
  return {
    [finalists[0]]: second.candidates[finalists[0]],
    [finalists[1]]: second.candidates[finalists[1]],
    blank: second.blankVotes,
    null: second.nullVotes,
    abstention: second.abstention
  };
}

function balanceUniverse(groups, targets) {
  const rows = { ...groups };
  const cols = { ...targets };
  const rowTotal = sum(Object.values(rows));
  const colTotal = sum(Object.values(cols));
  if (rowTotal < colTotal) rows.newElectorate = colTotal - rowTotal;
  if (rowTotal > colTotal) cols.outOfUniverse = rowTotal - colTotal;
  return { rows, cols, adjustment: colTotal - rowTotal };
}

export function ipf(groups, targets, prior, { iterations = 3000, tolerance = 1e-7 } = {}) {
  const { rows, cols, adjustment } = balanceUniverse(groups, targets);
  const rowNames = Object.keys(rows);
  const colNames = Object.keys(cols);
  const epsilon = 1e-12;
  const matrix = Object.fromEntries(rowNames.map(r => [r, Object.fromEntries(colNames.map(c => [c, Math.max(epsilon, prior?.[r]?.[c] ?? 1)]))]));
  let residual = Infinity;
  for (let it = 0; it < iterations; it++) {
    for (const r of rowNames) {
      const current = sum(colNames.map(c => matrix[r][c]));
      for (const c of colNames) matrix[r][c] *= rows[r] / current;
    }
    for (const c of colNames) {
      const current = sum(rowNames.map(r => matrix[r][c]));
      for (const r of rowNames) matrix[r][c] *= cols[c] / current;
    }
    residual = Math.max(
      ...rowNames.map(r => Math.abs(sum(colNames.map(c => matrix[r][c])) - rows[r])),
      ...colNames.map(c => Math.abs(sum(rowNames.map(r => matrix[r][c])) - cols[c]))
    );
    if (residual <= tolerance) break;
  }
  const probabilities = Object.fromEntries(rowNames.map(r => [r, Object.fromEntries(colNames.map(c => [c, matrix[r][c] / rows[r]]))]));
  return { matrix, probabilities, rowTotals: rows, columnTotals: cols, residual, universeAdjustment: adjustment };
}

export const SCENARIO_PRIORS = {
  highEliminatedAbstention: {
    label: 'Alta abstenção entre eliminados',
    eliminated: { lula: .18, flavio: .17, blank: .08, null: .07, abstention: .50 }
  },
  similarTurnout: {
    label: 'Comparecimento semelhante entre grupos',
    lula: { lula: .92, flavio: .02, blank: .01, null: .01, abstention: .04 },
    flavio: { lula: .02, flavio: .92, blank: .01, null: .01, abstention: .04 },
    eliminated: { lula: .43, flavio: .42, blank: .03, null: .03, abstention: .09 },
    blankNull: { lula: .25, flavio: .23, blank: .17, null: .20, abstention: .15 },
    abstention: { lula: .05, flavio: .05, blank: .005, null: .005, abstention: .89 }
  },
  moreLula: { label: 'Maior transferência para Lula', eliminated: { lula: .64, flavio: .20, blank: .04, null: .03, abstention: .09 } },
  moreFlavio: { label: 'Maior transferência para Flávio', eliminated: { lula: .20, flavio: .64, blank: .04, null: .03, abstention: .09 } },
  blankNullMovement: { label: 'Mudanças relevantes em brancos e nulos', blankNull: { lula: .38, flavio: .32, blank: .08, null: .10, abstention: .12 } }
};

function mergedPrior(specific = {}) {
  const base = SCENARIO_PRIORS.similarTurnout;
  const rows = new Set([...Object.keys(base), ...Object.keys(specific)]);
  return Object.fromEntries([...rows].map(r => [r, { ...(base[r] ?? {}), ...(specific[r] ?? {}) }]));
}

export function generateScenarios(groups, targets, { randomCount = 24, seed = 2026 } = {}) {
  const scenarios = Object.entries(SCENARIO_PRIORS).map(([id, def]) => ({ id, label: def.label, type: 'named', ...ipf(groups, targets, mergedPrior(def)) }));
  const rand = seededRandom(seed);
  const rows = Object.keys(groups);
  for (let i = 0; i < randomCount; i++) {
    const prior = {};
    for (const r of rows) {
      const weights = DESTINATIONS.map(() => -Math.log(Math.max(1e-12, 1 - rand())));
      const total = sum(weights);
      prior[r] = Object.fromEntries(DESTINATIONS.map((c, j) => [c, weights[j] / total]));
    }
    scenarios.push({ id: `compatible-${i + 1}`, label: `Solução compatível ${i + 1}`, type: 'sampled', ...ipf(groups, targets, prior) });
  }
  return scenarios;
}

export function validateProbabilityMatrix(probabilities, tolerance = 1e-8) {
  const rows = Object.entries(probabilities).map(([group, row]) => ({ group, sum: sum(Object.values(row)), validCells: Object.values(row).every(v => v >= 0 && v <= 1) }));
  return { valid: rows.every(r => Math.abs(r.sum - 1) <= tolerance && r.validCells), rows };
}

export function sensitivity(scenario, delta = .01) {
  return Object.entries(scenario.probabilities).map(([group, probs]) => {
    const largest = Object.entries(probs).sort((a, b) => b[1] - a[1])[0];
    return { group, dominantDestination: largest[0], probability: round(largest[1]), onePointVoters: Math.round((scenario.rowTotals[group] ?? 0) * delta) };
  });
}

export function parameterRanges(scenarios) {
  const ranges = {};
  for (const scenario of scenarios) for (const [g, row] of Object.entries(scenario.probabilities)) for (const [d, value] of Object.entries(row)) {
    const key = `${g}->${d}`;
    ranges[key] ??= { min: 1, max: 0 };
    ranges[key].min = Math.min(ranges[key].min, value);
    ranges[key].max = Math.max(ranges[key].max, value);
  }
  return Object.fromEntries(Object.entries(ranges).map(([k, v]) => [k, { min: round(v.min), max: round(v.max), width: round(v.max - v.min), identifiable: v.max - v.min < .02 }]));
}
