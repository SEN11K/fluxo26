import fs from 'node:fs/promises';
import { readCsv, detectColumns } from './csv.js';

export async function profileCsv(filePath, aliasesPath) {
  const aliases = JSON.parse(await fs.readFile(aliasesPath, 'utf8'));
  const rows = await readCsv(filePath, { maxRows: 50 });
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const mapping = detectColumns(headers, aliases);
  return {
    filePath,
    headers,
    mapping,
    missingCanonicalFields: Object.entries(mapping).filter(([, v]) => !v).map(([k]) => k),
    sampledRows: rows.length,
    sampleValues: Object.fromEntries(headers.slice(0, 12).map(h => [h, [...new Set(rows.slice(0, 5).map(r => r[h]))]]))
  };
}
