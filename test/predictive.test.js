import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { assertPredictiveInputs, DataLeakageError, registerPrediction, temporalSplit } from '../src/lib/predictive.js';

test('modo preditivo bloqueia resultados futuros',()=>{
  assert.throws(()=>assertPredictiveInputs([{id:'2t',kind:'result-second-round',availableAt:'2026-10-25'}],'2026-10-24'),DataLeakageError);
});

test('registra compromisso imutável antes da avaliação',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'fluxo26-'));
  const out=await registerPrediction(dir,{prediction:{lula:.51},parameters:{},inputs:[{id:'poll',kind:'poll',availableAt:'2026-10-20'}],cutoff:'2026-10-24',programVersion:'1.0.0'});
  assert.match(out.commitmentHash,/^[a-f0-9]{64}$/);
});

test('validação temporal só treina no passado',()=>{
  const splits=temporalSplit([{date:'2018'},{date:'2022'},{date:'2026'}]);
  assert.equal(splits[1].train.length,2); assert.equal(splits[1].test.date,'2026');
});
