# Baby Names

Charts on what Americans name their babies, built from the Social Security Administration's baby name data (1880 to the latest year SSA has published). It's a static Next.js site, deployed at [briandaviddavidson.com/names/](https://briandaviddavidson.com/names/).

## Getting started

You need Node.js 20.9 or later.

```sh
npm install
npm run dev     # dev server at http://localhost:3000/names/
npm test        # node --test
npm run build   # static export in out/, based at /names/
```

`dev` and `build` first copy the processed data into `public/data/`, where the browser fetches it.

## Charts

1. **Any name**: search a name to see how many babies got it each year, per 1,000 births of each sex, with peak year, best rank and the latest year called out. Searches go in the URL (`#name=Emma`), so a lookup can be shared.
2. **Overnight sensations**: the 20 sharpest one-year jumps in a name's share of births (at least 1,000 babies in the jump year), and whether the name was still at least half as popular 10 years after its peak. The likely pop-culture triggers in `lib/charts/spike-notes.js` are editorial notes, kept to well-documented cases.
3. **Crossing over**: names that went from mostly boys to mostly girls (over 70%), or the reverse, using 5-year averages and only names with at least 10,000 babies on each side of the 50% crossing.

## The data

Source: [Beyond the Top 1000 Names](https://www.ssa.gov/oact/babynames/limits.html), Social Security Administration.

- **National** (`names.zip`): one `yobYYYY.txt` per year, with rows of `name,sex,count`, from 1880.
- **State** (`namesbystate.zip`): one file per state plus DC, with rows of `state,sex,year,name,count`, from 1910.

**Rare names have gaps.** To protect privacy, SSA leaves out any name given to fewer than 5 babies of one sex in a year. The state files apply the same rule to each state, year and sex. A missing year doesn't always mean nobody got the name: it can mean fewer than 5 did. It also means that yearly totals here (sums of the published counts) run slightly below the true number of births.

The site also leaves some data out to keep downloads small:

- Names given to fewer than 100 babies in all years combined aren't included.
- Ranks are kept for the top 1,000 only, as in SSA's own tables.
- State data is kept for names with at least 1,000 babies nationally.

The thresholds are constants at the top of `scripts/transform.js`.

## Refreshing the data

SSA usually adds a new year in May. The scripts find the latest year from the files, so a new release needs no code change.

```sh
npm run fetch-data   # download and unzip into data/raw
npm run transform    # build data/processed
npm test
```

`fetch-data` tries these sources in order and prints which one it used. It also records the source in `data/raw/source.json`, and `transform` copies it into `years.json`.

1. ssa.gov, with a browser-like User-Agent.
2. The zip links on the data.gov catalog pages for the [national](https://catalog.data.gov/dataset/baby-names-from-social-security-card-applications-national-data) and [state](https://catalog.data.gov/dataset/baby-names-from-social-security-card-applications-state-and-district-of-columbia-data) datasets. At the moment these just point back to ssa.gov.
3. `data/names.zip` and `data/namesbystate.zip`, if you've downloaded them yourself. ssa.gov's CDN sometimes refuses all scripted requests (a 403 even for the home page) while a browser still works. In that case, download the two zips in a browser into `data/` and run `fetch-data` again.

`data/raw/` and the zips are not committed. `data/processed/` is committed, so the site builds with no network access.

## Processed files

Every series is stored as `[startYear, value, value, …]`. Leading and trailing zeros are trimmed, and a 0 inside the series is a suppressed or missing year.

| File | Contents |
| --- | --- |
| `years.json` | Year range, thresholds, data source, and total births per year by sex |
| `names/index.json` | Shard keys |
| `names/<key>.json` | `{ Name: { F: [counts, ranks], M: [counts, ranks] } }`. The ranks series is left out if the name never made the top 1,000 |
| `state-totals.json` | Total births per state, year and sex |
| `states/index.json` | Shard keys |
| `states/<key>.json` | `{ Name: { F: { CA: counts, … }, M: { … } } }` |
| `insights/<chart>.json` | Numbers for the site-wide charts, computed from every name by `lib/charts/<chart>.js` |

Shards are keyed by the first letters of the name, lower-cased. Two letters is the default (`em` holds Emma, Emmett, and so on), and a shard over 150 KB is split into longer prefixes until it fits. A name is in the shard with the longest key that's a prefix of it (`shardFor` in `lib/shards.js`).

## Project structure

```
app/                Page, layout and styles (Next.js App Router, static export)
components/
  ChartCard.js      Shared chart frame: title, takeaway, note, table view
  NameSearch.js     Name search box with suggestions
  charts/           One component per chart
  usePlot.js        Renders an Observable Plot chart, re-rendering on resize and theme change
scripts/
  fetch-data.js     Download and unzip the SSA files
  transform.js      Build data/processed
  copy-data.js      Copy data/processed into public/data before dev and build
  lib/ssa.js        Readers, totals and ranks for the raw files
lib/
  charts/           Each chart's numbers and its computed caption (tested)
  data.js           Build-time data for server components
  data-client.js    Browser-side loading of shards
  series.js         Helpers for the [startYear, …values] series format
  shards.js         Shard writing and lookup, shared with the site
data/processed/     Committed output of transform.js
test/               node --test
```
