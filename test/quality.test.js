import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRows, compareCoverage, compareNationalToMunicipal } from '../src/lib/quality.js';

const row = (unitKey, changes={}) => ({ round:1,unitKey,eligible:100,attendance:80,abstention:20,validVotes:75,blankVotes:2,nullVotes:3,pendingVotes:0,...changes });

test('detecta duplicatas, ausências e balanços inconsistentes', () => {
  const result = validateRows([row('A'),row('A'),row('B',{attendance:null}),row('C',{abstention:19})]);
  assert.equal(result.duplicates,1);
  assert.equal(result.rowsWithMissing,1);
  assert.ok(result.issues.some(x=>x.code==='ELECTORATE_BALANCE'));
});

test('impede união automática de coberturas incompatíveis', () => {
  const coverage=compareCoverage([row('A'),row('B')],[row('B'),row('C')]);
  assert.equal(coverage.compatible,false); assert.deepEqual(coverage.comparable,['B']);
});

test('detecta divergência entre nacional e soma municipal', () => {
  const result=compareNationalToMunicipal({attendance:161},[row('A'),row('B')],['attendance'])[0];
  assert.equal(result.delta,1); assert.equal(result.matches,false);
});
