import fs from 'node:fs/promises';
import path from 'node:path';
import { nowIso, sha256File } from './utils.js';

export async function recordArtifact(filePath, { url = null, catalogName = null, notes = null } = {}) {
  const stat = await fs.stat(filePath);
  return {
    file: path.basename(filePath),
    relativePath: filePath.replaceAll('\\', '/'),
    sourceUrl: url,
    catalogName,
    obtainedAt: nowIso(),
    bytes: stat.size,
    sha256: await sha256File(filePath),
    notes
  };
}

export async function appendManifest(directory, entry) {
  const manifestPath = path.join(directory, 'manifest.json');
  let manifest = { version: 1, artifacts: [] };
  try { manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')); } catch {}
  manifest.artifacts = manifest.artifacts.filter(x => x.file !== entry.file);
  manifest.artifacts.push(entry);
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  return manifestPath;
}
