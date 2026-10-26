import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'csv-stringify/sync';
import { aggregateSubstateRegions,buildIbgeMap,buildTseIbgeMap } from './lib/geography.js';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files={analysis:path.join(ROOT,'data/processed/analysis.json'),tse:path.join(ROOT,'data/raw/results-api/municipalities-config.json'),ibge:path.join(ROOT,'data/raw/ibge-municipalities.json'),custom:path.join(ROOT,'config/custom-regions.json')};
const analysis=JSON.parse(await fs.readFile(files.analysis,'utf8')),tse=JSON.parse(await fs.readFile(files.tse,'utf8')),custom=JSON.parse(await fs.readFile(files.custom,'utf8'));
let ibge;try{ibge=JSON.parse(await fs.readFile(files.ibge,'utf8'));}catch{const response=await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');if(!response.ok)throw new Error(`IBGE HTTP ${response.status}`);ibge=await response.json();await fs.writeFile(files.ibge,JSON.stringify(ibge));}
analysis.substateRegions=aggregateSubstateRegions(analysis.municipalityDifferences,buildTseIbgeMap(tse),buildIbgeMap(ibge),custom);
await fs.writeFile(files.analysis,JSON.stringify(analysis,null,2));
const all=[...analysis.substateRegions.custom,...analysis.substateRegions.intermediate,...analysis.substateRegions.immediate];
await fs.writeFile(path.join(ROOT,'outputs','variacoes-por-regiao-subestadual.csv'),'\uFEFF'+stringify(all,{header:true,delimiter:';'}));
console.log(JSON.stringify({custom:analysis.substateRegions.custom,intermediate:analysis.substateRegions.intermediate.length,immediate:analysis.substateRegions.immediate.length,unmapped:analysis.substateRegions.unmapped.length},null,2));
