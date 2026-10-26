import test from 'node:test';
import assert from 'node:assert/strict';
import { ipf, validateProbabilityMatrix, generateScenarios } from '../src/lib/transition.js';

const groups={lula:40,flavio:40,eliminated:10,blankNull:5,abstention:25};
const targets={lula:50,flavio:45,blank:2,null:3,abstention:20};

test('matriz de transição soma 100% por origem e reproduz margens',()=>{
  const result=ipf(groups,targets,{});
  assert.equal(validateProbabilityMatrix(result.probabilities).valid,true);
  for(const [dest,total] of Object.entries(targets)) assert.ok(Math.abs(Object.values(result.matrix).reduce((s,row)=>s+row[dest],0)-total)<1e-6);
});

test('produz múltiplas soluções compatíveis',()=>{
  const scenarios=generateScenarios(groups,targets,{randomCount:4});
  assert.ok(scenarios.length>=9);
  assert.notDeepEqual(scenarios[0].probabilities.eliminated,scenarios[1].probabilities.eliminated);
});
