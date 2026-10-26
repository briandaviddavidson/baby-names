// Downloads the SSA baby name files and unzips them into data/raw:
//   data/raw/national/yobYYYY.txt   name,sex,count       (1880–latest)
//   data/raw/state/XX.TXT           state,sex,year,name,count (1910–latest)
// Sources are tried in order, and data/raw/source.json records which one was used:
//   1. ssa.gov, with a browser-like User-Agent
//   2. whatever zip links the data.gov catalog page lists for the dataset
//   3. zips you downloaded by hand into data/ (names.zip, namesbystate.zip)
// Run it whenever SSA publishes a new year (usually in May).
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { unzipSync } from 'fflate';
import { DOWNLOADS_DIR, RAW_DIR, ROOT, SOURCE_FILE } from './lib/paths.js';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const DATASETS = [
  {
    key: 'national',
    zip: 'names.zip',
    url: 'https://www.ssa.gov/oact/babynames/names.zip',
    catalog: 'https://catalog.data.gov/dataset/baby-names-from-social-security-card-applications-national-data',
    file: /^yob\d{4}\.txt$/,
  },
  {
    key: 'state',
    zip: 'namesbystate.zip',
    url: 'https://www.ssa.gov/oact/babynames/state/namesbystate.zip',
    catalog: 'https://catalog.data.gov/dataset/baby-names-from-social-security-card-applications-state-and-district-of-columbia-data',
    file: /^[A-Z]{2}\.TXT$/,
  },
];

async function download(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: '*/*' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  // A blocked request can come back 200 with an HTML page; zips start with "PK".
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error('response is not a zip file');
  return bytes;
}

// data.gov retired its CKAN API, so read the zip links off the dataset's catalog page.
async function catalogLinks(page) {
  const res = await fetch(page, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${page}`);
  const html = await res.text();
  return [...new Set([...html.matchAll(/href="(https?:\/\/[^"]+\.zip)"/g)].map((m) => m[1]))];
}

async function fetchZip(dataset) {
  const failures = [];
  try {
    return { bytes: await download(dataset.url), source: 'ssa.gov', url: dataset.url };
  } catch (err) {
    failures.push(`ssa.gov (${dataset.url}): ${err.message}`);
  }
  try {
    const links = await catalogLinks(dataset.catalog);
    if (!links.length) failures.push(`data.gov: no zip links on ${dataset.catalog}`);
    for (const url of links) {
      try {
        return { bytes: await download(url), source: 'data.gov catalog', url };
      } catch (err) {
        failures.push(`data.gov link ${url}: ${err.message}`);
      }
    }
  } catch (err) {
    failures.push(`data.gov catalog: ${err.message}`);
  }
  const local = join(DOWNLOADS_DIR, dataset.zip);
  if (existsSync(local)) {
    const bytes = new Uint8Array(await readFile(local));
    return { bytes, source: 'manual download', url: relative(ROOT, local), failures };
  }
  throw new Error(
    `Could not get ${dataset.zip}:\n  ${failures.join('\n  ')}\n` +
      `Download ${dataset.url} in a browser, save it as ${local}, and run this again.`,
  );
}

await mkdir(RAW_DIR, { recursive: true });
const sources = {};
for (const dataset of DATASETS) {
  const { bytes, source, url, failures } = await fetchZip(dataset);
  const files = unzipSync(bytes, { filter: (f) => dataset.file.test(f.name.split('/').pop()) });
  const names = Object.keys(files);
  if (!names.length) throw new Error(`${dataset.zip} has no ${dataset.file} files`);
  const dir = join(RAW_DIR, dataset.key);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  for (const name of names) await writeFile(join(dir, name.split('/').pop()), files[name]);
  sources[dataset.key] = { source, url, files: names.length, ...(failures ? { failures } : {}) };
  console.log(`${dataset.key}: ${names.length} files from ${source} (${url})`);
  for (const f of failures ?? []) console.log(`  (failed first: ${f})`);
}
await writeFile(SOURCE_FILE, JSON.stringify({ fetchedAt: new Date().toISOString(), ...sources }, null, 2));
console.log(`Saved raw data to ${RAW_DIR}`);
