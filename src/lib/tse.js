import fs from 'node:fs/promises';
import path from 'node:path';
import { streamCsv } from './csv.js';
import { normalizeRecord } from './normalize.js';

const compact = text => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
const isPresident = row => compact(row.office).includes('PRESIDENTE') || String(row.officeCode) === '1';

export async function loadTseMunicipal({ detailCsv, candidateCsv, mapping, granularity='municipality', finalistPatterns = { lula: 'LULA', flavio: 'FLAVIO BOLSONARO' } }) {
  const units = new Map();
  const unitKey = row => granularity==='section' ? `${row.uf}:${row.municipalityCode}:${row.zone}:${row.section}` : `${row.uf}:${row.municipalityCode}`;
  const detailKey = row => `${row.round}:${unitKey(row)}`;
  await streamCsv(detailCsv, raw => {
    const row = normalizeRecord(raw, mapping.detail, path.basename(detailCsv));
    if (!isPresident(row) || ![1, 2].includes(row.round)) return;
    const key = detailKey(row);
    const existing = units.get(key) ?? { ...row, zone: granularity==='section'?row.zone:null, section: granularity==='section'?row.section:null, unitKey: unitKey(row), eligible: 0, attendance: 0, abstention: 0, validVotes: 0, blankVotes: 0, nullVotes: 0, pendingVotes: 0, candidates: {}, _zones: new Set() };
    const coverageKey=granularity==='section'?`${row.zone}:${row.section}`:row.zone;
    if (!existing._zones.has(coverageKey)) {
      existing._zones.add(coverageKey);
      for (const field of ['eligible', 'attendance', 'abstention', 'validVotes', 'blankVotes', 'nullVotes', 'pendingVotes']) existing[field] = (existing[field] ?? 0) + (row[field] ?? 0);
    }
    units.set(key, existing);
  });
  const candidateFiles = Array.isArray(candidateCsv) ? candidateCsv : [candidateCsv];
  for (const candidateFile of candidateFiles) await streamCsv(candidateFile, raw => {
    const row = normalizeRecord(raw, mapping.candidate, path.basename(candidateFile));
    if (!isPresident(row) || ![1, 2].includes(row.round)) return;
    const key = detailKey(row);
    const existing = units.get(key);
    if (!existing) return;
    const candidate = compact(row.candidateName);
    let label = row.candidateName;
    for (const [slug, pattern] of Object.entries(finalistPatterns)) if (candidate.includes(compact(pattern))) label = slug;
    existing.candidates[label] = (existing.candidates[label] ?? 0) + (row.candidateVotes ?? 0);
  });
  const rows = [...units.values()].map(({ _zones, ...row }) => row);
  return { first: rows.filter(r => r.round === 1), second: rows.filter(r => r.round === 2) };
}

export function nationalFromMunicipal(rows) {
  const result = { eligible: 0, attendance: 0, abstention: 0, unavailableEligible:0, validVotes: 0, blankVotes: 0, nullVotes: 0, pendingVotes: 0, candidates: {} };
  for (const row of rows) {
    for (const field of ['eligible', 'attendance', 'abstention', 'unavailableEligible','validVotes', 'blankVotes', 'nullVotes', 'pendingVotes']) result[field] += row[field] ?? 0;
    for (const [candidate, votes] of Object.entries(row.candidates ?? {})) result.candidates[candidate] = (result.candidates[candidate] ?? 0) + votes;
  }
  return result;
}

export async function saveNormalized(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}
