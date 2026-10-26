// Build-time access to the small processed files. Only imported by server
// components; the per-name shards are fetched in the browser (lib/data-client.js).
import years from '../data/processed/years.json' with { type: 'json' };

export { years };
export const totalBabies = ['F', 'M'].reduce((s, sex) => s + years.births[sex].reduce((a, b) => a + b, 0), 0);
