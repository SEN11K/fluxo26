import test from 'node:test';
import assert from 'node:assert/strict';
import { accounting, municipalityDifferences } from '../src/lib/accounting.js';

test('reproduz a identidade contábil de referência sem impô-la', () => {
  const first = { attendance:125275835, abstention:33469244, validVotes:119300788, blankVotes:2300798, nullVotes:3674249, candidates:{lula:53879538,flavio:56104503,outros:9316747} };
  const second = { attendance:128236074, abstention:30509005, validVotes:124082273, blankVotes:1430496, nullVotes:2723305, candidates:{lula:64256232,flavio:59826041} };
  const result = accounting(first, second, ['lula','flavio']);
  assert.equal(result.finalistIncrease, 14098232);
  assert.equal(result.eliminatedVotes, 9316747);
  assert.equal(result.attendanceIncrease, 2960239);
  assert.equal(result.blankReduction, 870302);
  assert.equal(result.nullReduction, 950944);
  assert.deepEqual(result.identity, { left:14098232, right:14098232, residual:0, holds:true });
});

test('recalcula a identidade independentemente em cada município',()=>{
  const first=[{unitKey:'SP:1',uf:'SP',municipalityCode:'1',attendance:100,abstention:20,validVotes:90,blankVotes:4,nullVotes:6,candidates:{lula:40,flavio:40,outro:10}}];
  const second=[{unitKey:'SP:1',uf:'SP',municipalityCode:'1',attendance:105,abstention:15,validVotes:99,blankVotes:2,nullVotes:4,candidates:{lula:50,flavio:49}}];
  const row=municipalityDifferences(first,second,['lula','flavio'])[0];
  assert.equal(row.identityResidual,0);assert.equal(row.identityHolds,true);assert.equal(row.identityRight,19);
});

test('expõe discrepância em vez de forçar igualdade', () => {
  const first = { attendance:100,abstention:20,validVotes:90,blankVotes:4,nullVotes:6,candidates:{a:40,b:40,x:10} };
  const second = { attendance:105,abstention:15,validVotes:99,blankVotes:2,nullVotes:4,candidates:{a:50,b:48} };
  const result = accounting(first,second,['a','b']);
  assert.equal(result.identity.holds,false);
  assert.equal(result.identity.residual,-1);
});
