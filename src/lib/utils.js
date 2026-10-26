import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

export const sum = values => values.reduce((a, b) => a + (Number(b) || 0), 0);
export const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export const round = (x, digits = 6) => Number(Number(x).toFixed(digits));
export const normalizeCode = (value, width) => String(value ?? '').trim().replace(/\.0$/, '').padStart(width, '0');
export const deepClone = value => structuredClone(value);
export const nowIso = () => new Date().toISOString();

export async function sha256File(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

export function sha256Text(text) {
  return createHash('sha256').update(text).digest('hex');
}

export function seededRandom(seed = 2026) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}
