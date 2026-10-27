const fmt = new Intl.NumberFormat('pt-BR');
const pct = v => `${(v * 100).toFixed(1).replace('.', ',')}%`;
let reference, analysis, scenarios = [], currentScenario, municipalityRows = [];

document.querySelectorAll('nav button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('nav button,.view').forEach(x => x.classList.remove('active'));
  button.classList.add('active'); document.getElementById(button.dataset.view).classList.add('active');
}));

async function boot() {
  reference = await fetch('/api/reference').then(r => r.json());
  try { analysis = await fetch('/api/analysis').then(r => r.ok ? r.json() : Promise.reject()); } catch {}
  renderOverview(); renderQuality(); await Promise.all([loadScenarios(),loadAutomaticEvidence()]);
  if (analysis) {renderMunicipal(analysis);renderRegions(analysis);}
}

let pollScenarioChart;
async function loadAutomaticEvidence(){
  const data=await fetch('/api/automatic-evidence').then(r=>r.json());
  if(data.error){document.getElementById('auto-status').textContent='erro';document.getElementById('auto-evidence').textContent=data.error;return;}
  document.getElementById('auto-status').textContent=`${data.meta.pollCount} pesquisas nacionais`;
  const p=data.predictive, valid=reference.second.validVotes, officialLula=reference.second.candidates.lula/valid*100;
  document.getElementById('auto-evidence').innerHTML=`<div class="auto-card"><small>Média das pesquisas</small><strong>${(50+p.meanMarginPp/2).toFixed(1).replace('.',',')}% Lula</strong><small>${(50-p.meanMarginPp/2).toFixed(1).replace('.',',')}% Flávio</small></div><div class="auto-card"><small>Resultado oficial</small><strong>${officialLula.toFixed(1).replace('.',',')}% Lula</strong><small>${(100-officialLula).toFixed(1).replace('.',',')}% Flávio</small></div><div class="auto-card"><small>Incerteza total</small><strong>± ${p.sdMarginPp.toFixed(2).replace('.',',')} p.p.</strong><small>amostra, institutos e erro histórico</small></div><div class="auto-card"><small>Distância observada</small><strong>${Math.abs(p.observedMarginPp-p.meanMarginPp).toFixed(2).replace('.',',')} p.p.</strong><small>probabilidade bilateral do desvio: ${(p.twoSidedTailProbability*100).toFixed(1).replace('.',',')}%</small></div>`;
  const groups=[
    {key:'all',name:'Todos',sub:'eliminados + brancos + nulos + abstenções',votes:reference.referenceIdentity.right,initials:'Σ',color:'#7c3aed'},
    ...Object.entries(reference.first.candidates).filter(([k])=>!['lula','flavio'].includes(k)).map(([key,votes],i)=>({key,name:key.replace('ESCRITOR ','').replace('VETERINÁRIO ',''),sub:`${fmt.format(votes)} votos no 1º turno`,votes,initials:key.split(' ').map(x=>x[0]).slice(0,2).join(''),color:['#f97316','#06b6d4','#ef4444','#eab308','#8b5cf6','#22c55e','#ec4899','#14b8a6','#3b82f6','#dc2626'][i]})),
    {key:'blank',name:'Brancos',sub:`redução de ${fmt.format(reference.referenceIdentity.blankReduction)}`,votes:reference.referenceIdentity.blankReduction,initials:'B',color:'#94a3b8'},
    {key:'null',name:'Nulos',sub:`redução de ${fmt.format(reference.referenceIdentity.nullReduction)}`,votes:reference.referenceIdentity.nullReduction,initials:'N',color:'#475569'},
    {key:'attendance',name:'Novos votantes líquidos',sub:`aumento de ${fmt.format(reference.referenceIdentity.attendanceIncrease)}`,votes:reference.referenceIdentity.attendanceIncrease,initials:'+',color:'#0ea5e9'}
  ];
  let selectedPoll=0,selectedGroup='all';
  document.getElementById('poll-picker').innerHTML=data.polls.map((x,i)=>`<button class="poll-chip ${i===0?'active':''}" data-poll="${i}" data-tip="Pesquisa ${x.registration}; campo de ${x.fieldStart.slice(5)} a ${x.fieldEnd.slice(5)}."><strong>${x.institute}</strong><small>${x.registration}</small></button>`).join('');
  document.getElementById('transfer-groups').innerHTML=groups.map((g,i)=>`<button class="group-card ${i===0?'active':''}" data-group="${g.key}" style="--group:${g.color}" data-tip="Clique para projetar este grupo com a proporção da pesquisa selecionada."><span class="group-avatar">${g.initials}</span><span><strong>${g.name}</strong><small>${g.sub}</small></span></button>`).join('');
  document.getElementById('polls-table').innerHTML=`<thead><tr><th>Instituto</th><th>Registro TSE</th><th>Campo</th><th>Amostra</th><th>Lula</th><th>Flávio</th><th>Transferência por candidato</th></tr></thead><tbody>${data.polls.map(x=>`<tr><td>${x.institute}</td><td>${x.registration}</td><td>${x.fieldStart.slice(5)} a ${x.fieldEnd.slice(5)}</td><td class="num">${fmt.format(x.sampleSize)}</td><td class="num">${x.lulaValid.toFixed(1).replace('.',',')}%</td><td class="num">${x.flavioValid.toFixed(1).replace('.',',')}%</td><td><span class="not-measured">não medida</span></td></tr>`).join('')}</tbody>`;
  const render=()=>{
    const poll=data.polls[selectedPoll],group=groups.find(g=>g.key===selectedGroup),lula=poll.lulaValid,flavio=poll.flavioValid;
    const lulaVotes=Math.round(group.votes*lula/100),flavioVotes=group.votes-lulaVotes;
    document.getElementById('sim-title').textContent=`${group.name} • cenário ${poll.institute}`;
    document.getElementById('sim-measurement').textContent='transferência não medida';
    document.getElementById('sim-numbers').innerHTML=`<div><span style="--dot:#e11d48"></span><small>Lula no cenário</small><strong>${lula.toFixed(1).replace('.',',')}% • ${fmt.format(lulaVotes)} votos</strong></div><div><span style="--dot:#2563eb"></span><small>Flávio no cenário</small><strong>${flavio.toFixed(1).replace('.',',')}% • ${fmt.format(flavioVotes)} votos</strong></div><div><small>Resultado real</small><strong>${officialLula.toFixed(1).replace('.',',')}% × ${(100-officialLula).toFixed(1).replace('.',',')}%</strong></div>`;
    const config={type:'bar',data:{labels:['Pesquisa selecionada','Resultado oficial'],datasets:[{label:'Lula',data:[lula,officialLula],backgroundColor:'#e11d48',borderRadius:7},{label:'Flávio',data:[flavio,100-officialLula],backgroundColor:'#2563eb',borderRadius:7}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',scales:{x:{stacked:true,max:100,ticks:{callback:v=>v+'%'}},y:{stacked:true}},plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${c.raw.toFixed(1)}%`}}}}};
    if(pollScenarioChart)pollScenarioChart.destroy();pollScenarioChart=new Chart(document.getElementById('pollScenarioChart'),config);
  };
  document.getElementById('poll-picker').onclick=e=>{const b=e.target.closest('[data-poll]');if(!b)return;selectedPoll=+b.dataset.poll;document.querySelectorAll('.poll-chip').forEach(x=>x.classList.toggle('active',x===b));render();};
  document.getElementById('transfer-groups').onclick=e=>{const b=e.target.closest('[data-group]');if(!b)return;selectedGroup=b.dataset.group;document.querySelectorAll('.group-card').forEach(x=>x.classList.toggle('active',x===b));render();};
  render();
  document.getElementById('b-mean').value=p.meanMarginPp.toFixed(3);document.getElementById('b-sd').value=p.sdMarginPp.toFixed(3);document.getElementById('b-shift').value=data.modelComparison.mechanism.fraudShiftMean;document.getElementById('b-shift-sd').value=data.modelComparison.mechanism.fraudShiftSd;
}

function renderOverview() {
  const f = reference.first, s = reference.second, id = reference.referenceIdentity;
  const cards = [
    ['Votos adicionais dos finalistas', id.left, '+11,82% sobre os válidos do 1º turno'],
    ['Votos dos eliminados', id.eliminated, '6 candidatos e candidaturas menores'],
    ['Aumento do comparecimento', id.attendanceIncrease, `${pct(id.attendanceIncrease / f.eligible)} dos aptos`],
    ['Resíduo da identidade', id.residual, 'fechamento contábil exato']
  ];
  document.getElementById('metrics').innerHTML = cards.map(([label, value, sub]) => `<div class="metric"><span>${label}</span><strong>${fmt.format(value)}</strong><small>${sub}</small></div>`).join('');
  const candidateDefs=[
    {key:'lula',name:'Lula',image:'assets/lula.jpg',color:'#0a6b58'},
    {key:'flavio',name:'Flávio Bolsonaro',image:'assets/flavio.jpg',color:'#4975d1'}
  ];
  document.getElementById('candidate-comparison').innerHTML=candidateDefs.map(c=>{
    const firstVotes=f.candidates[c.key],secondVotes=s.candidates[c.key],increase=secondVotes-firstVotes;
    const growth=increase/firstVotes,shareIncrease=increase/id.left,firstValid=firstVotes/f.validVotes,secondValid=secondVotes/s.validVotes;
    return `<article class="candidate-card" style="--candidate:${c.color}" data-tip="Mostra a votação exata e a mudança percentual de ${c.name} entre os turnos." tabindex="0"><div class="candidate-head"><img src="${c.image}" alt="Retrato de ${c.name}"><div><small>${c.name}</small><strong>+${fmt.format(increase)}</strong><span>aumento entre turnos</span></div></div><div class="vote-flow"><div><small>1º turno</small><strong>${fmt.format(firstVotes)}</strong><span>${pct(firstValid)} dos válidos</span></div><i>→</i><div><small>2º turno</small><strong>${fmt.format(secondVotes)}</strong><span>${pct(secondValid)} dos válidos</span></div></div><div class="candidate-stats"><span data-tip="Aumento dividido pela votação do próprio candidato no primeiro turno."><b>${pct(growth)}</b> crescimento sobre o próprio 1º turno</span><span data-tip="Parte do aumento combinado de 14.098.232 votos que pertence a este candidato."><b>${pct(shareIncrease)}</b> dos votos adicionais dos finalistas</span><span data-tip="Mudança na porcentagem do candidato sobre todos os votos válidos."><b>${((secondValid-firstValid)*100).toFixed(1).replace('.',',')} p.p.</b> na participação dos válidos</span></div></article>`;
  }).join('');
  const firstGap=f.candidates.lula-f.candidates.flavio,secondGap=s.candidates.lula-s.candidates.flavio,gapSwing=secondGap-firstGap;
  document.getElementById('candidate-gap').innerHTML=`<div data-tip="No primeiro turno, Flávio tinha esta quantidade de votos a mais que Lula." tabindex="0"><small>Diferença no 1º turno</small><strong>Flávio +${fmt.format(Math.abs(firstGap))}</strong></div><i>→</i><div data-tip="No segundo turno, Lula terminou com esta quantidade de votos a mais que Flávio." tabindex="0"><small>Diferença no 2º turno</small><strong>Lula +${fmt.format(secondGap)}</strong></div><div class="swing" data-tip="Quanto a diferença Lula menos Flávio mudou de um turno para o outro." tabindex="0"><small>Virada da diferença</small><strong>${fmt.format(gapSwing)} votos</strong></div>`;
  const parts = [
    ['Eliminados no 1º turno', id.eliminated, '#0a6b58'], ['Comparecimento líquido', id.attendanceIncrease, '#4975d1'],
    ['Redução de brancos', id.blankReduction, '#ee7d4d'], ['Redução de nulos', id.nullReduction, '#bb4c53']
  ];
  document.getElementById('identity-bars').innerHTML = parts.map(([label, value, color]) => `<div class="identity-row"><span>${label}</span><div class="bar"><i style="width:${value / id.left * 100}%;background:${color}"></i></div><strong>${fmt.format(value)}</strong></div>`).join('');
  const lulaIncrease=s.candidates.lula-f.candidates.lula,flavioIncrease=s.candidates.flavio-f.candidates.flavio;
  const afterFlavio=id.eliminated+id.attendanceIncrease+id.blankReduction+id.nullReduction-flavioIncrease;
  document.getElementById('identity-minus-flavio').innerHTML=`<div class="identity-formula" data-tip="Somamos as quatro parcelas da identidade e retiramos apenas o aumento de Flávio entre os turnos." tabindex="0"><span>${fmt.format(id.eliminated)}</span><i>+</i><span>${fmt.format(id.attendanceIncrease)}</span><i>+</i><span>${fmt.format(id.blankReduction)}</span><i>+</i><span>${fmt.format(id.nullReduction)}</span><i>−</i><span class="flavio-term">${fmt.format(flavioIncrease)}</span><i>=</i><strong>${fmt.format(afterFlavio)}</strong></div><div class="formula-legend"><span>eliminados</span><span>comparecimento</span><span>brancos</span><span>nulos</span><span>aumento de Flávio</span><b>aumento de Lula</b></div>`;
  const commonPool=id.attendanceIncrease+id.blankReduction+id.nullReduction;
  const eliminatedOutsideFlavio=id.eliminated-flavioIncrease;
  const inverseParts=[
    ['Menos abstenções',id.attendanceIncrease,'Pessoas a mais que compareceram no segundo turno.'],
    ['Menos brancos',id.blankReduction,'Redução dos votos em branco entre os turnos.'],
    ['Menos nulos',id.nullReduction,'Redução dos votos nulos entre os turnos.'],
    ['Eliminados menos ganho de Flávio',eliminatedOutsideFlavio,'Parcela que sobra dos 9.316.747 depois de descontar o aumento de Flávio.']
  ];
  document.getElementById('inverse-identity').innerHTML=`<div class="inverse-total" data-tip="Aumento oficial de Lula entre o primeiro e o segundo turno." tabindex="0"><small>Aumento de Lula</small><strong>${fmt.format(lulaIncrease)}</strong><span>100% do aumento</span></div><div class="equation-sign">=</div><div class="inverse-parts">${inverseParts.map(([label,value,tip])=>`<div class="inverse-part" data-tip="${tip}" tabindex="0"><small>${label}</small><strong>${fmt.format(value)}</strong><span>${pct(value/lulaIncrease)}</span></div>`).join('')}</div><div class="inverse-check"><strong>${fmt.format(commonPool)}</strong> das quedas integrais + <strong>${fmt.format(eliminatedOutsideFlavio)}</strong> dos eliminados restantes = <strong>${fmt.format(lulaIncrease)}</strong></div>`;
  new Chart(document.getElementById('movementChart'), { type:'bar', data:{ labels:['Comparecimento','Abstenção','Brancos','Nulos','Válidos'], datasets:[{label:'1º turno',data:[f.attendance,f.abstention,f.blankVotes,f.nullVotes,f.validVotes],backgroundColor:'#a9b2b5'},{label:'2º turno',data:[s.attendance,s.abstention,s.blankVotes,s.nullVotes,s.validVotes],backgroundColor:'#0a6b58'}]},options:{responsive:true,plugins:{legend:{position:'bottom'}},scales:{y:{ticks:{callback:v=>`${(v/1e6).toFixed(0)} mi`},grid:{color:'#e4e1da'}},x:{grid:{display:false}}}}});
}

async function loadScenarios() {
  const first = reference.first, second = reference.second;
  const eliminated = Object.entries(first.candidates).filter(([k]) => !['lula','flavio'].includes(k)).reduce((s,[,v])=>s+v,0);
  const groups = { lula:first.candidates.lula, flavio:first.candidates.flavio, eliminated, blankNull:first.blankVotes+first.nullVotes, abstention:first.abstention };
  const targets = { lula:second.candidates.lula, flavio:second.candidates.flavio, blank:second.blankVotes, null:second.nullVotes, abstention:second.abstention };
  const response = await fetch('/api/scenarios',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({groups,targets})}).then(r=>r.json());
  scenarios = response.scenario;
  const select=document.getElementById('scenario-select');
  select.innerHTML=scenarios.map((s,i)=>`<option value="${i}">${s.type==='named'?'Objetivo: ':'Busca automática: '}${s.label}</option>`).join('');
  select.addEventListener('change',()=>selectScenario(Number(select.value)));
  document.getElementById('apply-scenario').addEventListener('click',recalculate);
  const compatible=scenarios.filter(s=>s.residual<1e-4).length, widths=Object.values(response.ranges).map(x=>x.width), broad=widths.filter(x=>x>=.02).length;
  document.getElementById('family-title').textContent=`${compatible} matrizes distintas reproduzem o mesmo resultado`;
  document.getElementById('family-status').textContent=`${compatible}/${scenarios.length} compatíveis`;
  document.getElementById('family-facts').innerHTML=`<div class="auto-card"><small>Soluções procuradas</small><strong>${scenarios.length}</strong><small>objetivos dirigidos + buscas aleatórias</small></div><div class="auto-card"><small>Resíduo máximo aceito</small><strong>&lt; 0,0001 voto</strong><small>margens oficiais reproduzidas</small></div><div class="auto-card"><small>Parâmetros amplos</small><strong>${broad}</strong><small>faixa maior que 2 pontos percentuais</small></div><div class="auto-card"><small>Solução individual real</small><strong>não identificada</strong><small>limite da inferência ecológica</small></div>`;
  selectScenario(0); renderRanges(response.ranges);
}

function selectScenario(index){
  currentScenario=scenarios[index];
  const row=currentScenario.probabilities.eliminated;
  const outcomes=[
    {key:'lula',name:'Lula',image:'assets/lula.jpg',kind:'photo'},
    {key:'flavio',name:'Flávio Bolsonaro',image:'assets/flavio.jpg',kind:'photo'},
    {key:'blank',name:'Voto branco',icon:'○',kind:'icon'},
    {key:'null',name:'Voto nulo',icon:'×',kind:'icon'},
    {key:'abstention',name:'Abstenção',icon:'—',kind:'icon'}
  ];
  document.getElementById('solution-copy').innerHTML=`<div class="solution-heading"><strong>${currentScenario.label}</strong><span>Destino estimado dos eleitores de candidatos eliminados no primeiro turno</span></div><div class="outcome-grid">${outcomes.map(o=>`<article class="outcome-card ${o.kind}">${o.image?`<img src="${o.image}" alt="Retrato de ${o.name}">`:`<div class="outcome-icon" aria-hidden="true">${o.icon}</div>`}<div><small>${o.name}</small><strong>${pct(row[o.key])}</strong></div></article>`).join('')}</div><p class="scenario-warning">Esta é uma solução matematicamente compatível, não a trajetória observada de eleitores individuais.</p>`;
  document.getElementById('sliders').innerHTML=Object.entries(row).filter(([k])=>k!=='outOfUniverse').map(([k,v])=>`<div class="slider"><div class="slider-head"><span>${labels[k]}</span><strong id="v-${k}">${pct(v)}</strong></div><input data-destination="${k}" type="range" min="0" max="100" step="1" value="${Math.round(v*100)}"></div>`).join('');
  document.querySelectorAll('.slider input').forEach(input=>input.addEventListener('input',()=>document.getElementById(`v-${input.dataset.destination}`).textContent=`${input.value}%`));
  renderMatrix(currentScenario);
}

async function recalculate(){ const desired={}; document.querySelectorAll('.slider input').forEach(i=>desired[i.dataset.destination]=Number(i.value)); const total=Object.values(desired).reduce((a,b)=>a+b,0)||1; Object.keys(desired).forEach(k=>desired[k]/=total); const prior=structuredClone(currentScenario.probabilities); prior.eliminated=desired; const response=await fetch('/api/scenarios',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({groups:currentScenario.rowTotals,targets:currentScenario.columnTotals,prior})}).then(r=>r.json()); currentScenario=response.scenario; renderMatrix(currentScenario); }

const labels={lula:'Lula',flavio:'Flávio Bolsonaro',eliminated:'Candidatos eliminados',blankNull:'Branco ou nulo',abstention:'Abstenção',blank:'Branco',null:'Nulo',newElectorate:'Novo eleitorado',outOfUniverse:'Fora do universo'};
function renderMatrix(s){ const cols=Object.keys(s.columnTotals), rows=Object.keys(s.rowTotals); document.getElementById('matrix').innerHTML=`<thead><tr><th>Origem</th>${cols.map(c=>`<th>${labels[c]??c}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><th>${labels[r]??r}<br><small>${fmt.format(s.rowTotals[r])}</small></th>${cols.map(c=>{const v=s.probabilities[r][c];return `<td class="num"><span class="heat" style="background:rgba(10,107,88,${Math.min(.55,v*.8)})">${pct(v)}</span></td>`}).join('')}</tr>`).join('')}</tbody>`; const badge=document.getElementById('matrix-error'); badge.textContent=`erro máx. ${s.residual.toExponential(1)}`; badge.className='pill success'; }
function renderRanges(ranges){ const entries=Object.entries(ranges).filter(([k])=>k.startsWith('eliminated->')).slice(0,6); document.getElementById('ranges').innerHTML=entries.map(([k,v])=>`<div class="range-card"><small>${labels[k.split('->')[1]]}</small><strong>${pct(v.min)} — ${pct(v.max)}</strong><div class="range-line"><i style="width:${v.width*100}%"></i></div><small>${v.identifiable?'estreito nesta amostra':'amplo / não identificado'}</small></div>`).join(''); }

function renderMunicipal(data){ municipalityRows=data.municipalityDifferences??[]; const c=data.coverage,i=data.municipalStatistics?.identityByUnit; document.getElementById('coverage-copy').textContent=`${fmt.format(c.comparableCount)} unidades comparáveis; ${c.onlyFirst.length} apenas no 1º turno; ${c.onlySecond.length} apenas no 2º.${i?` Identidade exata em ${fmt.format(i.exact)} de ${fmt.format(i.tested)} unidades; soma dos resíduos: ${fmt.format(i.sumResiduals)}.`:''}`; document.getElementById('data-status').textContent='Dados municipais carregados'; document.getElementById('export-municipal').disabled=false; updateMunicipal(); document.getElementById('municipal-search').addEventListener('input',updateMunicipal); document.getElementById('municipal-sort').addEventListener('change',updateMunicipal); }
function updateMunicipal(){ const q=document.getElementById('municipal-search').value.toLowerCase(), sort=document.getElementById('municipal-sort').value; const rows=municipalityRows.filter(r=>`${r.municipalityName} ${r.uf}`.toLowerCase().includes(q)).sort((a,b)=>Math.abs(b[sort])-Math.abs(a[sort])).slice(0,500); document.querySelector('#municipal-table tbody').innerHTML=rows.map(r=>`<tr><td>${r.municipalityName??r.municipalityCode}</td><td>${r.uf}</td>${['attendanceChange','abstentionChange','blankChange','nullChange','validChange'].map(k=>`<td class="num">${r[k]>=0?'+':''}${fmt.format(r[k])}</td>`).join('')}<td class="num"><span class="pill ${r.identityHolds?'success':''}">${r.identityHolds?'exata':`resíduo ${fmt.format(r.identityResidual)}`}</span></td></tr>`).join(''); }

let regionData={};
function renderRegions(data){regionData=data.substateRegions??{};const featured=regionData.custom??[];document.getElementById('region-coverage').textContent=`Cobertura nacional: ${fmt.format((regionData.immediate??[]).length)} regiões imediatas, ${fmt.format((regionData.intermediate??[]).length)} intermediárias e ${fmt.format((regionData.legacyMesoregions??[]).length)} mesorregiões, além dos recortes destacados.`;document.getElementById('region-highlights').innerHTML=featured.map(r=>`<div class="metric"><span>Destaque • ${r.regionName}</span><strong>+${fmt.format(r.finalistIncrease)}</strong><small>${fmt.format(r.municipalityCount)} municípios • Lula +${fmt.format(r.lulaChange)} • Flávio +${fmt.format(r.flavioChange)}</small></div>`).join('');document.getElementById('region-level').addEventListener('change',updateRegions);document.getElementById('region-search').addEventListener('input',updateRegions);updateRegions();}
function updateRegions(){const level=document.getElementById('region-level').value,q=document.getElementById('region-search').value.toLowerCase(),rows=(regionData[level]??[]).filter(r=>`${r.regionName} ${r.uf??''}`.toLowerCase().includes(q)).sort((a,b)=>b.finalistIncrease-a.finalistIncrease);document.querySelector('#region-table tbody').innerHTML=rows.map(r=>`<tr><td>${r.regionName}<br><small>${r.basis??r.regionType}</small></td><td>${r.uf??'—'}</td><td class="num">${fmt.format(r.municipalityCount)}</td><td class="num">${r.lulaChange>=0?'+':''}${fmt.format(r.lulaChange)}</td><td class="num">${r.flavioChange>=0?'+':''}${fmt.format(r.flavioChange)}</td><td class="num">${r.finalistIncrease>=0?'+':''}${fmt.format(r.finalistIncrease)}</td><td class="num">${fmt.format(r.eliminatedVotesFirst)}</td><td class="num">${r.attendanceChange>=0?'+':''}${fmt.format(r.attendanceChange)}</td><td><span class="pill ${r.identityHolds?'success':''}">${r.identityHolds?'exata':fmt.format(r.identityResidual)}</span></td></tr>`).join('');}

function renderQuality(){ document.getElementById('sources').innerHTML=reference.sources.map(s=>`<div class="source"><strong>${s.label}</strong><br><a href="${s.url}" target="_blank">Abrir fonte oficial ↗</a><br><small>gerado na fonte: ${s.generatedAtSource}</small></div>`).join(''); document.getElementById('catalog-warning').textContent=reference.catalogWarning; const q=analysis?.quality; document.getElementById('quality-cards').innerHTML=q?`<span class="kicker">VALIDAÇÃO MUNICIPAL</span><h2>${q.first.errors+q.second.errors} erros encontrados</h2><p>1º turno: ${fmt.format(q.first.rowCount)} linhas • ${q.first.duplicates} duplicadas</p><p>2º turno: ${fmt.format(q.second.rowCount)} linhas • ${q.second.duplicates} duplicadas</p>`:`<span class="kicker">VALIDAÇÃO MUNICIPAL</span><h2>Aguardando CSVs completos</h2><p>O modo nacional de referência está validado. Importe os arquivos municipais para executar duplicatas, ausências, balanço de categorias e cobertura entre turnos.</p>`; }

async function download(format,data,name){const blob=await fetch('/api/export',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({format,data})}).then(r=>r.blob());const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href)}
document.getElementById('export-model').addEventListener('click',()=>download('json',currentScenario,'cenario-transicao.json'));
document.getElementById('export-municipal').addEventListener('click',()=>download('csv',municipalityRows,'diferencas-municipais.csv'));
document.getElementById('export-regions').addEventListener('click',()=>download('csv',[...(regionData.custom??[]),...(regionData.legacyMesoregions??[]),...(regionData.intermediate??[]),...(regionData.immediate??[])],'variacoes-regioes-subestaduais-brasil.csv'));
document.getElementById('bayes-run').addEventListener('click',async()=>{const ids=['b-observed','b-mean','b-sd','b-prior','b-shift','b-shift-sd'],box=document.getElementById('bayes-result');if(ids.some(id=>document.getElementById(id).value==='')){box.innerHTML='<strong>Incompleto</strong><span>Preencha todas as premissas; o programa não inventa taxa-base nem mecanismo de fraude.</span>';return;}const v=id=>Number(document.getElementById(id).value);const input={observedMargin:v('b-observed'),predictiveMean:v('b-mean'),predictiveSd:v('b-sd'),priorFraud:v('b-prior')/100,fraudShiftMean:v('b-shift'),fraudShiftSd:v('b-shift-sd')};const response=await fetch('/api/fraud-conditional',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)}).then(r=>r.json());if(response.error){box.innerHTML=`<strong>Erro</strong><span>${response.error}</span>`;return;}box.innerHTML=`<strong>${(response.result.posteriorFraud*100).toFixed(2).replace('.',',')}%</strong><span>posterior sob estas premissas • razão de verossimilhança ${response.result.likelihoodRatio.toFixed(3)}</span>`;});

function installSimpleTooltips(){
  const autoTips=[
    'Diferença média indicada pelas pesquisas. Negativo favorece Flávio; positivo favorece Lula.',
    'Tamanho normal da variação esperada. Quanto maior, menos precisa é a previsão.',
    'Diferença da apuração oficial. A cauda mede o quanto ela é incomum, não a chance de fraude.',
    'Compara dois modelos. Acima de 1 favorece o modelo amplo, que não significa necessariamente fraude.'
  ];
  const decorate=()=>{
    document.querySelectorAll('.auto-card').forEach((el,i)=>{if(!el.dataset.tip){el.dataset.tip=autoTips[i]??'Resumo automático do cálculo.';el.tabIndex=0;}});
    document.querySelectorAll('.outcome-card').forEach(el=>{if(!el.dataset.tip){const name=el.querySelector('small')?.textContent??'destino',value=el.querySelector('strong')?.textContent??'';el.dataset.tip=`Nesta solução, ${value} do grupo eliminado vai para ${name.toLowerCase()}. É uma possibilidade matemática, não uma observação individual.`;el.tabIndex=0;}});
    document.querySelectorAll('.range-card').forEach(el=>{if(!el.dataset.tip){el.dataset.tip='Mostra o menor e o maior valor encontrados. Uma faixa larga significa que os totais não revelam uma resposta única.';el.tabIndex=0;}});
    document.querySelectorAll('#matrix td').forEach(el=>{if(!el.dataset.tip){el.dataset.tip='Percentual estimado desta origem para este destino na solução selecionada.';el.tabIndex=0;}});
    document.querySelectorAll('.identity-row').forEach(el=>{if(!el.dataset.tip){el.dataset.tip='Esta parcela entra automaticamente na conta entre os dois turnos.';el.tabIndex=0;}});
    document.querySelectorAll('.metric').forEach(el=>{if(!el.dataset.tip){el.dataset.tip='Resumo calculado diretamente dos dados carregados.';el.tabIndex=0;}});
    document.querySelectorAll('.sensitivity .pill').forEach(el=>{if(!el.dataset.tip){el.dataset.tip='Mostra como a resposta muda quando se começa com uma taxa-base diferente.';el.tabIndex=0;}});
  };
  new MutationObserver(decorate).observe(document.body,{childList:true,subtree:true});
  decorate();
}

installSimpleTooltips();
boot();
