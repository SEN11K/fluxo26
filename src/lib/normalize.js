import { normalizeCode } from './utils.js';

export function normalizeRecord(raw, mapping, sourceFile = '') {
  const get = key => mapping[key] ? raw[mapping[key]] : undefined;
  const number = key => {
    const value = String(get(key) ?? '').replace(',', '.').trim();
    return value === '' ? null : Number(value);
  };
  const municipalityCode = normalizeCode(get('municipalityCode'), 5);
  const zone = normalizeCode(get('zone'), 4);
  const section = mapping.section ? normalizeCode(get('section'), 4) : null;
  return {
    sourceFile,
    year: number('electionYear'),
    round: number('round'),
    electionId: get('electionId') ?? null,
    uf: String(get('uf') ?? '').toUpperCase(),
    municipalityCode,
    municipalityName: get('municipalityName') ?? null,
    zone,
    section,
    unitKey: [String(get('uf') ?? '').toUpperCase(), municipalityCode, zone, section].filter(Boolean).join(':'),
    office: get('office') ?? null,
    officeCode: get('officeCode') ?? null,
    candidateName: get('candidateName') ?? null,
    candidateNumber: get('candidateNumber') ?? null,
    candidateVotes: number('candidateVotes'),
    eligible: number('eligible'),
    attendance: number('attendance'),
    abstention: number('abstention'),
    unavailableEligible: number('unavailableEligible'),
    validVotes: number('validVotes'),
    blankVotes: number('blankVotes'),
    nullVotes: number('nullVotes'),
    pendingVotes: number('pendingVotes')
  };
}

export function municipalityKey(row) {
  return `${row.uf}:${normalizeCode(row.municipalityCode, 5)}`;
}

export function aggregateZonesToMunicipality(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = municipalityKey(row);
    if (!groups.has(key)) groups.set(key, { ...row, zone: null, section: null, unitKey: key });
    else {
      const target = groups.get(key);
      for (const field of ['eligible', 'attendance', 'abstention', 'validVotes', 'blankVotes', 'nullVotes', 'pendingVotes', 'candidateVotes']) {
        if (row[field] != null) target[field] = (target[field] ?? 0) + row[field];
      }
    }
  }
  return [...groups.values()];
}
