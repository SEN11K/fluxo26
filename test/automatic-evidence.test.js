import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { automaticEvidence, preparePolls } from '../src/lib/automatic-evidence.js';

const config = JSON.parse(fs.readFileSync(new URL('../data/polls-national-2026.json', import.meta.url), 'utf8'));

test('pesquisas nacionais são normalizadas automaticamente', () => {
  const polls = preparePolls(config.polls);
  assert.equal(polls.length, 6);
  assert.ok(polls.every(p => Number.isFinite(p.marginPp) && p.samplingSdMarginPp > 0));
});

test('evidência automática separa surpresa de probabilidade de fraude', () => {
  const result = automaticEvidence(config, 3.5702);
  assert.equal(result.meta.pollCount, 6);
  assert.ok(result.predictive.sdMarginPp > 0);
  assert.ok(result.predictive.twoSidedTailProbability >= 0 && result.predictive.twoSidedTailProbability <= 1);
  assert.equal(result.posteriorSensitivity.length, 5);
  assert.equal(result.identification.singleFraudProbability, null);
});
