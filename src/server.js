import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateScenarios, ipf, parameterRanges, sensitivity, validateProbabilityMatrix } from './lib/transition.js';
import { conditionalFraudProbability, sensitivityGrid } from './lib/bayes.js';
import { automaticEvidence } from './lib/automatic-evidence.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(ROOT, 'public')));
app.use('/vendor/chart.js', express.static(path.join(ROOT, 'node_modules/chart.js/dist')));

app.get('/api/analysis', async (_req, res) => {
  try { res.json(JSON.parse(await fs.readFile(path.join(ROOT, 'data/processed/analysis.json'), 'utf8'))); }
  catch { res.status(404).json({ status: 'awaiting-official-data', message: 'Execute a importação dos CSVs oficiais ou use o modo de referência.' }); }
});

app.get('/api/reference', async (_req, res) => res.json(JSON.parse(await fs.readFile(path.join(ROOT, 'public/reference.json'), 'utf8'))));

app.post('/api/scenarios', (req, res) => {
  const { groups, targets, prior } = req.body;
  const scenario = prior ? ipf(groups, targets, prior) : generateScenarios(groups, targets);
  if (prior) scenario.sensitivity = sensitivity(scenario);
  res.json({ scenario, ranges: Array.isArray(scenario) ? parameterRanges(scenario) : null, validation: prior ? validateProbabilityMatrix(scenario.probabilities) : null });
});

app.post('/api/export', async (req, res) => {
  const { format = 'json', data } = req.body;
  if (format === 'json') return res.type('application/json').send(JSON.stringify(data, null, 2));
  const rows = Array.isArray(data) ? data : [data];
  const headers = [...new Set(rows.flatMap(Object.keys))];
  const escape = v => `"${String(v ?? '').replaceAll('"', '""')}"`;
  res.type('text/csv; charset=utf-8').send('\uFEFF' + [headers.map(escape).join(';'), ...rows.map(r => headers.map(h => escape(typeof r[h] === 'object' ? JSON.stringify(r[h]) : r[h])).join(';'))].join('\n'));
});
app.post('/api/fraud-conditional',(req,res)=>{try{const result=conditionalFraudProbability(req.body);res.json({result,sensitivity:sensitivityGrid(req.body)});}catch(error){res.status(400).json({error:error.message});}});
app.get('/api/automatic-evidence',async(_req,res)=>{try{const polls=JSON.parse(await fs.readFile(path.join(ROOT,'data/polls-national-2026.json'),'utf8')),reference=JSON.parse(await fs.readFile(path.join(ROOT,'public/reference.json'),'utf8')),valid=reference.second.validVotes,observed=(reference.second.candidates.lula-reference.second.candidates.flavio)/valid*100;res.json(automaticEvidence(polls,observed));}catch(error){res.status(500).json({error:error.message});}});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`Analisador disponível em http://localhost:${port}`));
