import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const analysis=JSON.parse(await fs.readFile(new URL('../data/processed/analysis.json',import.meta.url),'utf8'));

test('aumentos e quedas municipais reconciliam o saldo nacional de comparecimento',()=>{
  const rows=analysis.municipalityDifferences;
  const positive=rows.filter(r=>r.attendanceChange>0);
  const negative=rows.filter(r=>r.attendanceChange<0);
  const positiveSum=positive.reduce((sum,r)=>sum+r.attendanceChange,0);
  const negativeSum=negative.reduce((sum,r)=>sum+r.attendanceChange,0);
  assert.equal(positive.length,4550);
  assert.equal(negative.length,1152);
  assert.equal(positiveSum,3339994);
  assert.equal(negativeSum,-379755);
  assert.equal(positiveSum+negativeSum,2960239);
});
