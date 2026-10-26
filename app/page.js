import ChartCard from '../components/ChartCard.js';
import Legend, { SEX_ITEMS } from '../components/Legend.js';
import NameLookup from '../components/charts/NameLookup.js';
import SpikesChart from '../components/charts/SpikesChart.js';
import FlipsChart from '../components/charts/FlipsChart.js';
import LongTailChart from '../components/charts/LongTailChart.js';
import LettersChart from '../components/charts/LettersChart.js';
import StateMap from '../components/charts/StateMap.js';
import { lettersCaption, lettersTableRows } from '../lib/charts/letters.js';
import { longTailCaption, longTailTableRows } from '../lib/charts/long-tail.js';
import { FLIP, flipTableRows, flipsCaption } from '../lib/charts/flips.js';
import { SPIKE, STATUS_COLOR, spikeTableRows, spikesCaption } from '../lib/charts/spikes.js';
import { flips, letters, longTail, spikes, totalBabies, years } from '../lib/data.js';
import { fmt } from '../lib/series.js';

export default function Home() {
  const { firstYear, lastYear } = years;

  return (
    <>
      <header className="site-bar">
        <div className="wrap">
          <a className="site-name" href="#top">
            What We Name Our Babies
          </a>
          <a className="byline" href="https://briandaviddavidson.com/">
            Brian Davidson
          </a>
        </div>
      </header>

      <main className="wrap" id="top">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">
            A data story · {firstYear}–{lastYear}
          </p>
          <h1 id="page-title">What We Name Our Babies</h1>
          <p className="deck">
            Every name the Social Security Administration has on record for babies born in the U.S. since {firstYear}: how
            names rise and fall, which fads stuck, and where a name is loved most.
          </p>
          <ul className="hero-stats">
            <li>
              <strong>{fmt(Math.round(totalBabies / 1e6))}M</strong>
              <span>babies on record</span>
            </li>
            <li>
              <strong>{fmt(years.names.all)}</strong>
              <span>different names</span>
            </li>
            <li>
              <strong>{lastYear - firstYear + 1}</strong>
              <span>years of data</span>
            </li>
            <li>
              <strong>51</strong>
              <span>states and DC, since 1910</span>
            </li>
          </ul>
        </section>

        <NameLookup firstYear={firstYear} lastYear={lastYear} minTotal={years.minTotal} />

        <ChartCard
          id="spikes"
          eyebrow="02 · Overnight sensations"
          title="Sudden spikes, and what happened next"
          subtitle={`The ${spikes.length} sharpest one-year jumps in a name’s popularity, from ${SPIKE.before} years before to ${SPIKE.after} after. Each line is a share of the name’s peak (the gray line is 100%).`}
          hint="Hover or touch a panel to read a year. The dot marks ten years after the peak."
          takeaway={spikesCaption(spikes)}
          note={`A jump is the rise in a name’s share of same-sex births from one year to the next, counting a suppressed previous year as 5 babies. Only jumps to at least ${fmt(SPIKE.minCount)} babies count, one per name. “Stuck” means that ${SPIKE.laterYears} years after its peak (the jump year or up to 3 years later) the name was at least ${Math.round(SPIKE.stuckAt * 100)}% as popular; “too soon” means that hasn’t happened yet. The likely triggers in the table are editorial notes, not part of the SSA data.`}
          table={{
            columns: ['Name', 'Sex', 'Year', 'Babies, year before → jump year', 'Jump', `${SPIKE.laterYears} years after peak`, 'Status', 'Likely trigger'],
            rows: spikeTableRows(spikes),
          }}
        >
          <Legend
            shape="line"
            items={[
              { key: 'stuck', label: 'Stuck', color: STATUS_COLOR.stuck },
              { key: 'faded', label: 'Faded', color: STATUS_COLOR.faded },
              ...(spikes.some((s) => s.status === 'too soon') ? [{ key: 'soon', label: 'Too soon to tell', color: STATUS_COLOR['too soon'] }] : []),
            ]}
          />
          <SpikesChart list={spikes} before={SPIKE.before} after={SPIKE.after} />
        </ChartCard>

        <ChartCard
          id="flips"
          eyebrow="03 · Crossing over"
          title="Names that changed sides"
          subtitle={`Each bar runs from the last year a name was mostly given to one sex (over ${Math.round(FLIP.high * 100)}%) to the first year it was mostly given to the other. The dot is the year it crossed 50%.`}
          hint="Hover or touch a dot to read a name’s flip."
          takeaway={flipsCaption(flips, { lastYear })}
          note={`Shares are 5-year averages, judged only in years a name averaged at least ${FLIP.minPerYear} babies. A flip counts only with at least ${fmt(FLIP.minSide)} babies of the old sex before the crossing and of the new sex after it, which leaves out names like Ashley, given to only a few thousand boys before it became a girls’ name. Jaime flipped twice: to girls in the mid-1970s, then back to boys.`}
          table={{
            columns: ['Name', 'Flip', 'Last mostly old sex', 'Crossed 50%', 'First mostly new sex', 'Babies before (old sex)', 'Babies after (new sex)', 'Girls, latest'],
            rows: flipTableRows(flips),
          }}
        >
          <Legend
            items={[
              { key: 'F', label: 'Became a girls’ name', color: 'var(--girls)', shape: 'dot' },
              { key: 'M', label: 'Became a boys’ name', color: 'var(--boys)', shape: 'dot' },
            ]}
          />
          <FlipsChart list={flips} firstYear={firstYear} lastYear={lastYear} />
        </ChartCard>

        <ChartCard
          id="long-tail"
          eyebrow="04 · The long tail"
          title="Are names getting more diverse?"
          subtitle="Share of babies given one of that year’s 10 or 100 most popular names, by decade"
          hint="Hover or touch a point to read its value."
          takeaway={longTailCaption(longTail, { lastYear })}
          note={`*${Math.floor(lastYear / 10) * 10}–${lastYear} only. Each year’s top names are that year’s own. Early decades are less complete: many people born before 1937, when Social Security began, never applied for a card. Different names a year (in the table) counts only names given to at least 5 babies, so it also grows with the number of births.`}
          table={{
            columns: ['Decade', 'Girls, top 10', 'Girls, top 100', 'Boys, top 10', 'Boys, top 100', 'Girls’ names a year', 'Boys’ names a year'],
            rows: longTailTableRows(longTail, { lastYear }),
          }}
        >
          <Legend items={SEX_ITEMS} shape="line" />
          <LongTailChart rows={longTail} lastYear={lastYear} />
        </ChartCard>

        <ChartCard
          id="letters"
          eyebrow="05 · Sound and shape"
          title="How long, and how it ends"
          subtitle="The average length of babies’ names, and the share of babies whose name ends in each letter, by year"
          hint="Hover or touch a line or cell to read a year. Darker cells are more common endings."
          takeaway={lettersCaption(letters)}
          note="Weighted by babies: a name given to 10,000 babies counts 10,000 times. Heatmaps show letters that ended at least 1% of one sex’s names in some year."
          table={{
            columns: ['Year', 'Girls, letters', 'Boys, letters', 'Girls, top endings', 'Boys, top endings'],
            rows: lettersTableRows(letters),
          }}
        >
          <Legend items={SEX_ITEMS} shape="line" />
          <LettersChart data={letters} />
        </ChartCard>

        <StateMap minStateTotal={years.minStateTotal} />
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <p>
            A data project by <a href="https://briandaviddavidson.com/">Brian Davidson</a>. Data from the Social Security
            Administration’s{' '}
            <a href="https://www.ssa.gov/oact/babynames/limits.html">baby names files</a>, {firstYear}–{lastYear}, counted
            from applications for Social Security cards.
          </p>
          <p>
            SSA leaves out any name given to fewer than 5 babies of one sex in a year (or in a state), so the rarest names
            have gaps and totals run slightly below true births.
          </p>
        </div>
      </footer>
    </>
  );
}
