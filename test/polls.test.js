import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePoll } from '../src/lib/polls.js';

test('comparecimento não medido permanece desconhecido',()=>{
  const result=validatePoll({institute:'X',fieldStart:'2026-10-20',fieldEnd:'2026-10-21',sampleSize:2000,targetPopulation:'eleitores',method:'entrevista'});
  assert.equal(result.valid,true); assert.match(result.warnings[0],/desconhecida/);
});
