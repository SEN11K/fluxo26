import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import AdmZip from 'adm-zip';
import { appendManifest, recordArtifact } from './provenance.js';

export async function verifyCatalog(config) {
  const response = await fetch(config.ckanApiUrl);
  if (!response.ok) throw new Error(`Catálogo CKAN indisponível: HTTP ${response.status}`);
  const payload = await response.json();
  if (!payload.success) throw new Error('Catálogo CKAN retornou success=false');
  const resources = payload.result.resources;
  return config.officialResources.map(expected => {
    const actual = resources.find(r => r.name.trim() === expected.catalogName.trim());
    return { ...expected, verified: Boolean(actual), catalogUrl: actual?.url ?? null, urlMatches: actual?.url === expected.url };
  });
}

export async function downloadOfficialResource(resource, rawDirectory, { extract = true } = {}) {
  await fs.mkdir(rawDirectory, { recursive: true });
  const filename = path.basename(new URL(resource.url).pathname);
  const destination = path.join(rawDirectory, filename);
  const partial = `${destination}.partial`;
  const response = await fetch(resource.url);
  if (!response.ok || !response.body) throw new Error(`Falha no download: HTTP ${response.status}`);
  await pipeline(response.body, createWriteStream(partial));
  await fs.rename(partial, destination);
  const entry = await recordArtifact(destination, { url: resource.url, catalogName: resource.catalogName });
  await appendManifest(rawDirectory, entry);
  const extracted = [];
  if (extract) {
    const target = path.join(rawDirectory, path.basename(filename, '.zip'));
    await fs.mkdir(target, { recursive: true });
    const zip = new AdmZip(destination);
    zip.extractAllTo(target, true);
    for (const zipEntry of zip.getEntries()) if (!zipEntry.isDirectory) extracted.push(path.join(target, zipEntry.entryName));
  }
  return { destination, extracted, manifest: entry };
}
