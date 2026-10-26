import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'csv-stringify/sync';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const analysis=JSON.parse(await fs.readFile(path.join(ROOT,'data/processed/analysis.json'),'utf8'));
const out=path.join(ROOT,'outputs');await fs.mkdir(out,{recursive:true});
const rows=analysis.municipalityDifferences.map(r=>({uf:r.uf,codigo_municipio:r.municipalityCode,municipio:r.municipalityName,aumento_finalistas:r.finalistIncrease,votos_eliminados_1t:r.eliminatedVotesFirst,variacao_comparecimento:r.attendanceChange,reducao_brancos:-r.blankChange,reducao_nulos:-r.nullChange,lado_direito:r.identityRight,residuo_identidade:r.identityResidual,identidade_exata:r.identityHolds}));
await fs.writeFile(path.join(out,'identidade-por-municipio.csv'),'\uFEFF'+stringify(rows,{header:true,delimiter:';'}),'utf8');
const regionalLevels = [
  ['mesorregiao_ibge', analysis.substateRegions?.legacyMesoregions ?? []],
  ['regiao_intermediaria_ibge', analysis.substateRegions?.intermediate ?? []],
  ['regiao_imediata_ibge', analysis.substateRegions?.immediate ?? []],
  ['recorte_personalizado', analysis.substateRegions?.custom ?? []]
];
const regionalRows = regionalLevels.flatMap(([nivel, items]) => items.map(r => ({
  nivel,
  codigo_regiao: r.regionCode ?? '',
  regiao: r.regionName,
  uf: r.uf ?? '',
  municipios: r.municipalityCount,
  aumento_lula: r.lulaChange,
  aumento_flavio: r.flavioChange,
  aumento_finalistas: r.finalistIncrease,
  eliminados_1t: r.eliminatedVotesFirst,
  variacao_comparecimento: r.attendanceChange,
  reducao_brancos: r.blankReduction,
  reducao_nulos: r.nullReduction,
  residuo_identidade: r.identityResidual,
  identidade_exata: r.identityHolds,
  criterio: r.basis ?? r.regionType ?? nivel
})));
await fs.writeFile(path.join(out,'variacoes-por-regiao-subestadual-brasil.csv'),'\uFEFF'+stringify(regionalRows,{header:true,delimiter:';'}),'utf8');
const summary={generatedAt:analysis.generatedAt,coverage:analysis.coverage,quality:{first:{...analysis.quality.first,issues:undefined},second:{...analysis.quality.second,issues:undefined}},national:analysis.national,municipalStatistics:analysis.municipalStatistics,substateRegions:analysis.substateRegions,model:{groups:analysis.model.groups,targets:analysis.model.targets,parameterRanges:analysis.model.parameterRanges,ecologicalWarning:analysis.model.ecologicalWarning},fraud:analysis.fraud,artifacts:{municipalManifest:'data/raw/results-api/manifest.json'}};
await fs.writeFile(path.join(out,'relatorio-resumido.json'),JSON.stringify(summary,null,2));
console.log(`Exportados ${rows.length} recortes municipais e ${regionalRows.length} recortes regionais de todo o Brasil.`);
