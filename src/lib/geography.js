import { sum } from './utils.js';

const numericFields=['attendanceChange','abstentionChange','blankChange','nullChange','validChange','eliminatedVotesFirst','finalistIncrease','identityRight','identityResidual','lulaChange','flavioChange'];

export function buildTseIbgeMap(config){const map=new Map();for(const state of config.abr??[])for(const municipality of state.mu??[])map.set(`${state.cd.toUpperCase()}:${municipality.cd}`,{ibgeCode:String(municipality.cdi),name:municipality.nm});return map;}

export function buildIbgeMap(municipalities){return new Map(municipalities.map(m=>[String(m.id),{ibgeCode:String(m.id),municipality:m.nome,uf:m.microrregiao?.mesorregiao?.UF?.sigla,mesoregionId:m.microrregiao?.mesorregiao?.id,mesoregion:m.microrregiao?.mesorregiao?.nome,microregionId:m.microrregiao?.id,microregion:m.microrregiao?.nome,immediateId:m['regiao-imediata']?.id,immediate:m['regiao-imediata']?.nome,intermediateId:m['regiao-imediata']?.['regiao-intermediaria']?.id,intermediate:m['regiao-imediata']?.['regiao-intermediaria']?.nome}]));}

function aggregate(rows,keyFn,metaFn){const groups=new Map();for(const row of rows){const key=keyFn(row);if(!key)continue;const target=groups.get(key)??{...metaFn(row),municipalityCount:0};target.municipalityCount++;for(const f of numericFields)target[f]=(target[f]??0)+(row[f]??0);groups.set(key,target);}return [...groups.values()].map(r=>({...r,identityHolds:r.identityResidual===0}));}

export function aggregateSubstateRegions(rows,tseMap,ibgeMap,customRegions=[]){const enriched=[],unmapped=[];for(const row of rows){const tse=tseMap.get(`${row.uf}:${row.municipalityCode}`),geo=tse&&ibgeMap.get(tse.ibgeCode);if(!geo){unmapped.push({unitKey:row.unitKey,uf:row.uf,name:row.municipalityName});continue;}enriched.push({...row,ibgeCode:tse.ibgeCode,geo});}
  const immediate=aggregate(enriched,r=>r.geo.immediateId,r=>({regionType:'immediate',regionId:r.geo.immediateId,regionName:r.geo.immediate,uf:r.uf}));
  const intermediate=aggregate(enriched,r=>r.geo.intermediateId,r=>({regionType:'intermediate',regionId:r.geo.intermediateId,regionName:r.geo.intermediate,uf:r.uf}));
  const mesoregions=aggregate(enriched,r=>r.geo.mesoregionId,r=>({regionType:'legacy-mesoregion',regionId:r.geo.mesoregionId,regionName:r.geo.mesoregion,uf:r.uf}));
  const custom=customRegions.map(def=>{const subset=enriched.filter(r=>def.mesoregionIds.includes(r.geo.mesoregionId));const totals={regionType:'custom',regionId:def.id,regionName:def.name,basis:def.basis,municipalityCount:subset.length};for(const f of numericFields)totals[f]=sum(subset.map(r=>r[f]));totals.identityHolds=totals.identityResidual===0;return totals;});
  return {immediate,intermediate,legacyMesoregions:mesoregions,custom,unmapped,methodology:'Regiões imediatas/intermediárias de 2017 e mesorregiões legadas do IBGE; recortes personalizados declaram seus componentes.'};
}
