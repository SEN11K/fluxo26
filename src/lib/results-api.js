import fs from 'node:fs/promises';
import path from 'node:path';
import { sha256Text, stableStringify } from './utils.js';
import { streamCsv } from './csv.js';

const BASE = 'https://resultados.tse.jus.br/oficial/ele2026';
const elections = [{ id:'6257', round:1 },{ id:'6258', round:2 }];

const n = value => Number(value ?? 0);
const compact = text => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();

export function parseEa20(payload, municipality) {
  const candidates = {};
  for (const office of payload.carg ?? []) for (const alliance of office.agr ?? []) for (const party of alliance.par ?? []) for (const candidate of party.cand ?? []) {
    const name = compact(candidate.nmu || candidate.nm);
    const key = name === 'LULA' ? 'lula' : name.includes('FLAVIO BOLSONARO') ? 'flavio' : (candidate.nmu || candidate.nm);
    candidates[key] = (candidates[key] ?? 0) + n(candidate.vap);
  }
  return {
    sourceFile:`EA20-${payload.ele}-${municipality.uf}-${municipality.code}.json`, year:2026, round:n(payload.t), electionId:payload.ele,
    uf:municipality.uf.toUpperCase(), municipalityCode:municipality.code, municipalityName:municipality.name,
    zone:null,section:null,unitKey:`${municipality.uf.toUpperCase()}:${municipality.code}`,
    eligible:n(payload.e?.te),attendance:n(payload.e?.c),abstention:n(payload.e?.a),unavailableEligible:n(payload.e?.esni),validVotes:n(payload.v?.vv),blankVotes:n(payload.v?.vb),nullVotes:n(payload.v?.tvn),pendingVotes:0,candidates
  };
}

async function fetchJson(url, attempts=5) {
  for(let i=0;i<attempts;i++){
    const response=await fetch(url);
    if(response.ok)return {payload:await response.json(),etag:response.headers.get('etag'),lastModified:response.headers.get('last-modified')};
    if(response.status===404)return null;
    if(i===attempts-1)throw new Error(`HTTP ${response.status}: ${url}`);
    await new Promise(r=>setTimeout(r,1000*(i+1)));
  }
}

async function deriveMunicipalities(detailCsv){const map=new Map();await streamCsv(detailCsv,row=>{if(String(row.NR_TURNO)!=='1'||!String(row.DS_CARGO).toUpperCase().includes('PRESIDENTE'))return;const uf=String(row.SG_UF).toLowerCase(),code=String(row.CD_MUNICIPIO).padStart(5,'0');map.set(`${uf}:${code}`,{uf,code,name:row.NM_MUNICIPIO,ibge:null});});return [...map.values()];}

export async function fetchAllMunicipalResults(root,{concurrency=8,onProgress=()=>{},delayMs=150,detailCsv=null}={}){
  const configUrl=`${BASE}/6257/config/mun-e006257-cm.json`;
  const configFile=path.join(root,'municipalities-config.json');let municipalities;
  try{const config=JSON.parse(await fs.readFile(configFile,'utf8'));municipalities=config.abr.flatMap(state=>(state.mu??[]).map(mu=>({uf:state.cd,code:mu.cd,name:mu.nm,ibge:mu.cdi})));}
  catch{try{const config=(await fetchJson(configUrl)).payload;await fs.mkdir(root,{recursive:true});await fs.writeFile(configFile,JSON.stringify(config));municipalities=config.abr.flatMap(state=>(state.mu??[]).map(mu=>({uf:state.cd,code:mu.cd,name:mu.nm,ibge:mu.cdi})));}catch(error){if(!detailCsv)throw error;municipalities=await deriveMunicipalities(detailCsv);}}
  const jobs=elections.flatMap(e=>municipalities.map(m=>({e,m,url:`${BASE}/${e.id}/dados/${m.uf}/${m.uf}${m.code}-c0001-e${e.id.padStart(6,'0')}-u.json`})));
  const rows={first:[],second:[]}, failures=[];
  let cursor=0,done=0;
  const workers=Array.from({length:concurrency},async()=>{
    while(true){const index=cursor++;if(index>=jobs.length)return;const job=jobs[index];try{const dir=path.join(root,`turn-${job.e.round}`,job.m.uf);const file=path.join(dir,`${job.m.uf}${job.m.code}.json`);let payload;try{payload=JSON.parse(await fs.readFile(file,'utf8'));}catch{await new Promise(r=>setTimeout(r,delayMs));const fetched=await fetchJson(job.url);if(!fetched){failures.push({...job,status:404});continue;}payload=fetched.payload;await fs.mkdir(dir,{recursive:true});await fs.writeFile(file,JSON.stringify(payload));}rows[job.e.round===1?'first':'second'].push(parseEa20(payload,job.m));}catch(error){failures.push({...job,error:error.message});}finally{done++;if(done%250===0)onProgress({done,total:jobs.length,failures:failures.length});}}
  });
  await Promise.all(workers);
  const manifest={source:'TSE Resultados, arquivos EA20 municipais',configUrl,elections,municipalityCount:municipalities.length,requestCount:jobs.length,downloadedAt:new Date().toISOString(),failures:failures.map(x=>({url:x.url,status:x.status,error:x.error})),datasetSha256:sha256Text(stableStringify(rows))};
  await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2));
  return {rows,manifest};
}
