# SafeTable · Restaurant Compliance Analytics

An interactive analytics dashboard for restaurant compliance & regulations, built for business analysts.
React 19 + Vite + Tailwind CSS 4 + Recharts — compiled to a **single self-contained `index.html`**,
so it hosts anywhere static files are served.

![stack](https://img.shields.io/badge/react-19-61dafb) ![stack](https://img.shields.io/badge/tailwind-4-38bdf8) ![deploy](https://img.shields.io/badge/deploy-GitHub%20Pages-222)

## Features

- **KPI summary cards** — compliance score. total violations, pass rate, resolution time, with animated
  numbers, trend pills and sparklines
- **Charts** — composed line/area/bar trend chart, severity donut, stacked category bars and animated
  location benchmarks, all with hover tooltips and smooth transitions
- **Data table** — sortable columns, status filter chips, live search, pagination, CSV export
- **Global filters** — draggable date-range brush with 7D/30D/90D/All presets, region segments and
  location multi-select; every view updates instantly
- **Dark mode** — persisted toggle with system-preference default
- **Auto-insights** — narrative observations (top mover, risk concentration, weekend patterns)
  computed from the current filter window
- Fully responsive, seeded realistic sample data (~1,700 daily records, ~900 inspections, 8 locations, 210 days)

## Run locally

```bash
npm install
npm run dev        # dev server
npm run build      # outputs a single-file dist/index.html
npm run preview    # preview the production build
```

## Hosting on GitHub Pages

### Option A — GitHub Actions (recommended, automatic)

1. Push this repository to GitHub on the `main` branch.
2. In the repo, go to **Settings → Pages** and set **Source** to **"GitHub Actions"**.
3. Commit and push — the workflow in `.github/workflows/deploy.yml` builds the app and publishes it.
4. Your site will be live at `https://<username>.github.io/<repo-name>/`.

Every subsequent push to `main` redeploys automatically. You can also trigger it manually
from the **Actions** tab (`Deploy to GitHub Pages → Run workflow`).

### Option B — Manual (single file)

The build is one self-contained `index.html` (all JS/CSS inlined), so no build step is needed in CI:

```bash
npm install && npm run build
```

Then either:

- copy `dist/index.html` into a `docs/` folder, push, and set **Settings → Pages → Deploy from a branch → /docs**; or
- push `dist/index.html` to the root of a `gh-pages` branch and set Pages to serve from that branch.

> The bundle has no relative asset references, so it works fine under a project subpath
> (no `base` config changes required). Web fonts load from Google Fonts CDN.

## Project structure

```
src/
├── lib/
│   ├── data.ts         # seeded sample-data engine (locations, daily records, inspections)
│   ├── analytics.ts    # filtering + aggregations (KPIs, series, breakdowns)
│   ├── theme.tsx       # dark-mode provider + chart palette
│   └── hooks.ts        # number tweening, element measuring, clock
└── components/
    ├── Sidebar.tsx / Header.tsx / FiltersBar.tsx
    ├── DateBrush.tsx   # custom draggable date-range slider
    ├── KpiCards.tsx / InsightsStrip.tsx
    ├── TrendChart.tsx / SeverityDonut.tsx / CategoryBars.tsx / LocationBars.tsx
    └── InspectionsTable.tsx / ui.tsx
```

All data is deterministically generated in the browser — no backend or API keys required.
