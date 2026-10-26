import fs from 'node:fs/promises';
import path from 'node:path';
import { sha256Text, stableStringify, nowIso } from './utils.js';

export class DataLeakageError extends Error { constructor(message) { super(message); this.name = 'DataLeakageError'; } }

export function assertPredictiveInputs(inputs, cutoff) {
  const cutoffTime = new Date(cutoff).getTime();
  const forbidden = inputs.filter(x => x.kind === 'result-second-round' || new Date(x.availableAt).getTime() > cutoffTime);
  if (forbidden.length) throw new DataLeakageError(`Modo preditivo bloqueou ${forbidden.length} fonte(s) futura(s): ${forbidden.map(x => x.id).join(', ')}`);
  return true;
}

export async function registerPrediction(directory, { prediction, parameters, inputs, cutoff, programVersion }) {
  assertPredictiveInputs(inputs, cutoff);
  const payload = { createdAt: nowIso(), cutoff, programVersion, prediction, parameters, inputs };
  payload.commitmentHash = sha256Text(stableStringify(payload));
  await fs.mkdir(directory, { recursive: true });
  const file = path.join(directory, `prediction-${payload.createdAt.replace(/[:.]/g, '-')}.json`);
  await fs.writeFile(file, JSON.stringify(payload, null, 2));
  return { file, commitmentHash: payload.commitmentHash };
}

export function temporalSplit(elections) {
  const sorted = [...elections].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) throw new Error('Validação temporal requer ao menos duas eleições.');
  return sorted.slice(1).map((test, i) => ({ train: sorted.slice(0, i + 1), test }));
}
