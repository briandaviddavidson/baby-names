import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export const ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const DATA_DIR = join(ROOT, 'data');
export const RAW_DIR = join(DATA_DIR, 'raw');
// Zips downloaded by hand (e.g. in a browser) go straight in data/, when ssa.gov blocks scripted requests.
export const DOWNLOADS_DIR = DATA_DIR;
export const PROCESSED_DIR = join(DATA_DIR, 'processed');
export const SOURCE_FILE = join(RAW_DIR, 'source.json');

export const processedPath = (name) => join(PROCESSED_DIR, name);
