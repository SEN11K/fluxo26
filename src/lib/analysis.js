import { accounting, municipalityDifferences } from './accounting.js';
import { compareCoverage, validateRows } from './quality.js';
import { buildGroups, buildTargets, generateScenarios, parameterRanges, sensitivity } from './transition.js';
import { fraudAssessment } from './evidence.js';
import { nationalFromMunicipal } from './tse.js';
import { municipalStatistics } from './statistics.js';

export function analyzeElection({ firstRows, secondRows, finalists = ['lula', 'flavio'] }) {
  if(!firstRows.length||!secondRows.length)throw new Error('Análise bloqueada: os dois turnos precisam estar presentes.');
  const qualityFirst = validateRows(firstRows);
  const qualitySecond = validateRows(secondRows);
  const coverage = compareCoverage(firstRows, secondRows);
  if(!coverage.comparable.length)throw new Error('Análise bloqueada: nenhuma unidade comparável entre os turnos.');
  const firstComparable = firstRows.filter(r => coverage.comparable.includes(r.unitKey));
  const secondComparable = secondRows.filter(r => coverage.comparable.includes(r.unitKey));
  const nationalFirst = nationalFromMunicipal(firstComparable);
  const nationalSecond = nationalFromMunicipal(secondComparable);
  const ledger = accounting(nationalFirst, nationalSecond, finalists);
  const groups = buildGroups(nationalFirst, finalists);
  const targets = buildTargets(nationalSecond, finalists);
  const scenarios = generateScenarios(groups, targets).map(s => ({ ...s, sensitivity: sensitivity(s) }));
  const municipalityRows = municipalityDifferences(firstComparable, secondComparable, finalists);
  return {
    generatedAt: new Date().toISOString(),
    finalists,
    coverage: { ...coverage, comparableCount: coverage.comparable.length, comparable: undefined, automatedConclusionsBlocked:!coverage.compatible },
    quality: { first: qualityFirst, second: qualitySecond },
    national: { first: nationalFirst, second: nationalSecond, accounting: ledger },
    municipalityDifferences: municipalityRows,
    municipalStatistics: municipalStatistics(municipalityRows),
    model: { groups, targets, scenarios, parameterRanges: parameterRanges(scenarios), ecologicalWarning: 'Múltiplas matrizes reproduzem os mesmos totais. Resultados agregados não identificam como cada pessoa votou.' },
    fraud: fraudAssessment({ accountingIdentity: ledger.identity, dataQuality: { errors: qualityFirst.errors + qualitySecond.errors } })
  };
}
