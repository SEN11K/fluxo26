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

test('teste alternativo usa somente os votos adicionais dos finalistas no segundo turno',()=>{
  const rates=data.polls.find(p=>p.registration==='BR-08535/2026').groups['ESCRITOR AUGUSTO CURY'];
  const base=reference.referenceIdentity.left;
  assert.equal(base,14098232);
  assert.equal(Math.round(base*rates.lula/100),6767151);
  assert.equal(Math.round(base*rates.flavio/100),4652417);
});
