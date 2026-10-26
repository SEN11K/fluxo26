import fs from 'node:fs';
import { parse } from 'csv-parse';

export async function readCsv(path, { delimiter = ';', encoding = 'latin1', maxRows = Infinity } = {}) {
  const rows = [];
  const parser = fs.createReadStream(path, { encoding }).pipe(parse({ columns: true, delimiter, bom: true, relax_column_count: true, skip_empty_lines: true, trim: true }));
  for await (const row of parser) {
    rows.push(row);
    if (rows.length >= maxRows) break;
  }
  return rows;
}

export async function streamCsv(path, onRow, options = {}) {
  const { delimiter = ';', encoding = 'latin1' } = options;
  const parser = fs.createReadStream(path, { encoding }).pipe(parse({ columns: true, delimiter, bom: true, relax_column_count: true, skip_empty_lines: true, trim: true }));
  let count = 0;
  for await (const row of parser) { await onRow(row, count++); }
  return count;
}

export function detectColumns(headers, aliases) {
  const available = new Set(headers.map(h => h.trim().toUpperCase()));
  return Object.fromEntries(Object.entries(aliases).map(([canonical, names]) => [canonical, names.find(n => available.has(n)) ?? null]));
}
