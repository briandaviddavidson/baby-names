import ChartCard from '../components/ChartCard.js';
import Legend from '../components/Legend.js';
import NameLookup from '../components/charts/NameLookup.js';
import SpikesChart from '../components/charts/SpikesChart.js';
import { SPIKE, STATUS_COLOR, spikeTableRows, spikesCaption } from '../lib/charts/spikes.js';
import { spikes, totalBabies, years } from '../lib/data.js';
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
