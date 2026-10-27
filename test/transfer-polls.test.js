import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const data=JSON.parse(await fs.readFile(new URL('../public/transfer-polls.json',import.meta.url),'utf8'));
const reference=JSON.parse(await fs.readFile(new URL('../public/reference.json',import.meta.url),'utf8'));

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

test('cenário individual aplica a taxa somente aos votos do candidato selecionado',()=>{
  const rates=data.polls.find(p=>p.registration==='BR-08535/2026').groups['ESCRITOR AUGUSTO CURY'];
  const pool=reference.first.candidates['ESCRITOR AUGUSTO CURY'];
  const lula=reference.first.candidates.lula+Math.round(pool*rates.lula/100);
  const flavio=reference.first.candidates.flavio+Math.round(pool*rates.flavio/100);
  assert.equal(pool,3448569);
  assert.equal(lula,55534851);
  assert.equal(flavio,57242531);
  assert.equal(reference.referenceIdentity.attendanceIncrease,2960239);
});

test('cenário total soma candidato por candidato usando a própria taxa',()=>{
  const groups=data.polls.find(p=>p.registration==='BR-08535/2026').groups;
  const measured=Object.entries(groups).filter(([name])=>name!=='blankNullAbstention');
  const lulaTransfer=measured.reduce((sum,[name,rates])=>sum+reference.first.candidates[name]*rates.lula/100,0);
  const flavioTransfer=measured.reduce((sum,[name,rates])=>sum+reference.first.candidates[name]*rates.flavio/100,0);
  assert.equal(Math.round(lulaTransfer),2871366);
  assert.equal(Math.round(flavioTransfer),3987665);
});

test('teste completo separa eliminados, novos comparecimentos e redução de brancos e nulos',()=>{
  const attendance=reference.referenceIdentity.attendanceIncrease;
  const blankNull=reference.referenceIdentity.blankReduction+reference.referenceIdentity.nullReduction;
  const normalPoll={lula:48.6/(48.6+50.4),flavio:50.4/(48.6+50.4)};
  assert.equal(attendance,2960239);
  assert.equal(blankNull,1821246);
  assert.equal(Math.round(attendance*normalPoll.lula),1453208);
  assert.equal(Math.round(attendance*normalPoll.flavio),1507031);
  assert.equal(Math.round(blankNull*.40),728498);
  assert.equal(Math.round(blankNull*.36),655649);
  assert.equal(2871366+1453208+728498,5053072);
  assert.equal(3987665+1507031+655649,6150345);
});
