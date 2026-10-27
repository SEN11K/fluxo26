import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const data=JSON.parse(await fs.readFile(new URL('../public/transfer-polls.json',import.meta.url),'utf8'));

test('pesquisas de transferência têm registro, fonte e percentuais válidos',()=>{
  assert.ok(data.polls.length>=4);
  for(const poll of data.polls){
    assert.match(poll.registration,/^BR-\d{5}\/2026$/);
    assert.match(poll.sourceUrl,/^https:\/\//);
    for(const values of Object.values(poll.groups)){
      for(const value of Object.values(values))if(value!==null)assert.ok(value>=0&&value<=100);
      const reported=Object.values(values).filter(value=>value!==null).reduce((sum,value)=>sum+value,0);
      assert.ok(reported<=101,'arredondamentos publicados não podem exceder 101%');
    }
  }
});

test('há medição de branco, nulo ou ausência e candidatos com foto',async()=>{
  assert.ok(data.polls.some(p=>p.groups.blankNullAbstention));
  for(const file of ['augusto-cury.jpg','renan-santos.jpg','ronaldo-caiado.jpg','romeu-zema.jpg'])
    assert.ok((await fs.stat(new URL(`../public/assets/candidates/${file}`,import.meta.url))).size>1000);
});
