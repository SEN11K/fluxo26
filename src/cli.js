import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { downloadOfficialResource, verifyCatalog } from './lib/downloader.js';
import { profileCsv } from './lib/schema.js';
import { loadTseMunicipal, saveNormalized } from './lib/tse.js';
import { analyzeElection } from './lib/analysis.js';
import { fetchAllMunicipalResults } from './lib/results-api.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const command = process.argv[2];
const args = Object.fromEntries(process.argv.slice(3).map(x => x.startsWith('--') ? x.slice(2).split('=') : [x, true]));
const readJson = file => fs.readFile(file, 'utf8').then(JSON.parse);

async function downloadTse() {
  const config = await readJson(path.join(ROOT, 'config/sources.json'));
  const verified = await verifyCatalog(config);
  const requested = args.resource ?? 'detailMunicipalityZone';
  const resource = verified.find(r => r.id === requested);
  if (!resource?.verified || !resource.urlMatches) throw new Error(`Recurso ${requested} não foi confirmado no catálogo oficial; download bloqueado.`);
  const result = await downloadOfficialResource(resource, path.join(ROOT, 'data/raw'));
  console.log(JSON.stringify(result, null, 2));
}

async function profile() {
  if (!args.file) throw new Error('Use --file=C:\\caminho\\arquivo.csv');
  console.log(JSON.stringify(await profileCsv(path.resolve(args.file), path.join(ROOT, 'config/column-aliases.json')), null, 2));
}

async function analyze() {
  if (!args.detail || !args.candidates) throw new Error('Use --detail=... --candidates=... com os CSVs originais extraídos.');
  const detailProfile = await profileCsv(path.resolve(args.detail), path.join(ROOT, 'config/column-aliases.json'));
  const candidatePath = path.resolve(args.candidates);
  const candidateStat = await fs.stat(candidatePath);
  const candidateFiles = candidateStat.isDirectory()
    ? (await fs.readdir(candidatePath)).filter(name => name.toLowerCase().endsWith('.csv')).map(name => path.join(candidatePath, name))
    : [candidatePath];
  if (!candidateFiles.length) throw new Error('Nenhum CSV de candidaturas encontrado.');
  const candidateProfile = await profileCsv(candidateFiles[0], path.join(ROOT, 'config/column-aliases.json'));
  const granularity=args.granularity??'municipality';
  const normalized = await loadTseMunicipal({ detailCsv: path.resolve(args.detail), candidateCsv: candidateFiles, granularity, mapping: { detail: detailProfile.mapping, candidate: candidateProfile.mapping } });
  const result = analyzeElection({ firstRows: normalized.first, secondRows: normalized.second });
  const output = path.join(ROOT, granularity==='section'?'data/processed/section-analysis.json':'data/processed/analysis.json');
  await saveNormalized(output, result);
  console.log(`Análise salva em ${output}`);
}

async function fetchMunicipal() {
  const rawRoot=path.join(ROOT,'data/raw/results-api');
  await fs.mkdir(rawRoot,{recursive:true});
  const {rows,manifest}=await fetchAllMunicipalResults(rawRoot,{concurrency:Number(args.concurrency??8),delayMs:Number(args.delayMs??150),detailCsv:path.join(ROOT,'data/raw/detalhe_votacao_munzona_2026/detalhe_votacao_munzona_2026_BRASIL.csv'),onProgress:p=>console.log(`${p.done}/${p.total} arquivos; falhas: ${p.failures}`)});
  const result=analyzeElection({firstRows:rows.first,secondRows:rows.second});
  const output=path.join(ROOT,'data/processed/analysis.json');
  await saveNormalized(output,result);
  console.log(JSON.stringify({output,manifest,first:rows.first.length,second:rows.second.length},null,2));
}

try {
  if (command === 'download-tse') await downloadTse();
  else if (command === 'fetch-municipal') await fetchMunicipal();
  else if (command === 'profile') await profile();
  else if (command === 'analyze') await analyze();
  else console.log('Comandos: download-tse, fetch-municipal, profile, analyze');
} catch (error) { console.error(error.stack); process.exitCode = 1; }
