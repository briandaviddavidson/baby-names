import NameLookup from '../components/charts/NameLookup.js';
import { totalBabies, years } from '../lib/data.js';
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
