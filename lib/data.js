// Build-time access to the small processed files. Only imported by server
// components; the per-name shards are fetched in the browser (lib/data-client.js).
import years from '../data/processed/years.json' with { type: 'json' };
import spikes from '../data/processed/insights/spikes.json' with { type: 'json' };
import flips from '../data/processed/insights/flips.json' with { type: 'json' };
import longTail from '../data/processed/insights/long-tail.json' with { type: 'json' };
import letters from '../data/processed/insights/letters.json' with { type: 'json' };

export { flips, letters, longTail, spikes, years };
export const totalBabies = ['F', 'M'].reduce((s, sex) => s + years.births[sex].reduce((a, b) => a + b, 0), 0);
