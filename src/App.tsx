import { useMemo, useState } from "react";
import {
  ClipboardCheck, ShieldCheck, TimerReset, TriangleAlert,
} from "lucide-react";
import { DAYS, Region, getDataset, LOCATIONS } from "./lib/data";
import {
  Range, buildCategoryRows, buildLocationRows, buildSeries,
  buildSeverity, buildTimeline, computeKpis, filterDaily, filterInspections,
  fmtMed, previousRange, sparkSeries, sparkSum,
} from "./lib/analytics";
import { ThemeProvider, useChartColors, useTheme } from "./lib/theme";
import { stagger } from "./lib/hooks";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import FiltersBar from "./components/FiltersBar";
import DateBrush from "./components/DateBrush";
import KpiGrid, { KpiView } from "./components/KpiCards";
import TrendChart from "./components/TrendChart";
import SeverityDonut from "./components/SeverityDonut";
import CategoryBars from "./components/CategoryBars";
import LocationBars from "./components/LocationBars";
import InspectionsTable from "./components/InspectionsTable";
import InsightsStrip, { useInsights } from "./components/InsightsStrip";

const dayMs = 86400000;

function Dashboard() {
  const ds = useMemo(() => getDataset(), []);
  const c = useChartColors();
  const { dark } = useTheme();

  // ── global filter state ──────────────────────────────────
  const [region, setRegion] = useState<Region | "All">("All");
  const [locIds, setLocIds] = useState<string[]>([]);
  const [idx, setIdx] = useState<[number, number]>([DAYS - 90, DAYS - 1]);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(false);

  const visibleLocs = useMemo(
    () =>
      LOCATIONS.filter(
        (l) => (region === "All" || l.region === region) && (locIds.length === 0 || locIds.includes(l.id))
      ),
    [region, locIds]
  );

  const dayCount = idx[1] - idx[0] + 1;
  const range: Range = useMemo(
    () => ({ startTs: ds.days[idx[0]].ts, endTs: ds.days[idx[1]].ts }),
    [ds, idx]
  );
  const prev = useMemo(() => previousRange(range), [range]);

  // ── derived views (all update live with filters) ─────────
  const records = useMemo(() => filterDaily(ds, visibleLocs, range), [ds, visibleLocs, range]);
  const prevRecords = useMemo(() => filterDaily(ds, visibleLocs, prev), [ds, visibleLocs, prev]);
  const insp = useMemo(() => filterInspections(ds, visibleLocs, range), [ds, visibleLocs, range]);
  const prevInsp = useMemo(() => filterInspections(ds, visibleLocs, prev), [ds, visibleLocs, prev]);

  const kpis = useMemo(() => computeKpis(records, insp), [records, insp]);
  const prevKpis = useMemo(() => computeKpis(prevRecords, prevInsp), [prevRecords, prevInsp]);

  const series = useMemo(() => buildSeries(records, dayCount), [records, dayCount]);
  const catRows = useMemo(() => buildCategoryRows(records), [records]);
  const sevData = useMemo(() => buildSeverity(records), [records]);
  const locRows = useMemo(() => buildLocationRows(records, prevRecords, visibleLocs), [records, prevRecords, visibleLocs]);
  const timeline = useMemo(() => buildTimeline(ds, visibleLocs), [ds, visibleLocs]);

  // sparklines
  const sparkScore = useMemo(() => sparkSeries(records, (r) => r.score, range), [records, range]);
  const sparkViol = useMemo(() => sparkSum(records, (r) => r.violations, range), [records, range]);
  const sparkRes = useMemo(() => sparkSeries(records, (r) => r.resolutionDays, range), [records, range]);
  const sparkPass = useMemo(() => {
    const m = new Map<number, { p: number; n: number }>();
    for (const i of insp) {
      const b = m.get(i.ts) ?? { p: 0, n: 0 };
      b.n += 1;
      if (i.status === "Passed") b.p += 1;
      m.set(i.ts, b);
    }
    const out: number[] = [];
    let last = kpis.passRate;
    for (let ts = range.startTs; ts <= range.endTs; ts += dayMs) {
      const b = m.get(ts);
      if (b && b.n > 0) last = (100 * b.p) / b.n;
      out.push(+last.toFixed(1));
    }
    return out;
  }, [insp, range, kpis.passRate]);

  // alert count = inspections with critical findings, trailing 14 days
  const alerts = useMemo(() => {
    const cutoff = ds.days[DAYS - 1].ts - 14 * dayMs;
    return ds.inspections.filter(
      (i) => i.ts >= cutoff && i.critical > 0 && visibleLocs.some((l) => l.id === i.locationId)
    ).length;
  }, [ds, visibleLocs]);

  // ── KPI view models ──────────────────────────────────────
  const pct = (cur: number, old: number) => (old ? +(((cur - old) / old) * 100).toFixed(1) : 0);
  const kpiItems: KpiView[] = [
    {
      label: "Avg. compliance score",
      value: kpis.score,
      format: (v) => v.toFixed(1),
      delta: +(kpis.score - prevKpis.score).toFixed(1),
      deltaSuffix: " pts",
      spark: sparkScore,
      kind: "area",
      color: c.emerald,
      icon: ShieldCheck,
      tint: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400",
      foot: `vs prior ${dayCount} days`,
    },
    {
      label: "Total violations",
      value: kpis.violations,
      format: (v) => Math.round(v).toLocaleString(),
      delta: pct(kpis.violations, prevKpis.violations),
      invert: true,
      spark: sparkViol,
      kind: "bars",
      color: c.rose,
      icon: TriangleAlert,
      tint: "bg-rose-500/10 text-rose-600 dark:bg-rose-400/10 dark:text-rose-400",
      foot: `${kpis.critical.toLocaleString()} critical findings`,
    },
    {
      label: "Inspection pass rate",
      value: kpis.passRate,
      format: (v) => `${v.toFixed(1)}%`,
      delta: +(kpis.passRate - prevKpis.passRate).toFixed(1),
      deltaSuffix: " pts",
      spark: sparkPass,
      kind: "area",
      color: c.indigo,
      icon: ClipboardCheck,
      tint: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400",
      foot: `${kpis.inspCount.toLocaleString()} inspections logged`,
    },
    {
      label: "Avg. resolution time",
      value: kpis.resolution,
      format: (v) => `${v.toFixed(1)}d`,
      delta: pct(kpis.resolution, prevKpis.resolution),
      invert: true,
      spark: sparkRes,
      kind: "area",
      color: c.amber,
      icon: TimerReset,
      tint: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
      foot: `${kpis.openActions} corrective actions`,
    },
  ];

  const insights = useInsights(records, locRows);
  const periodLabel = `${fmtMed(range.startTs)} – ${fmtMed(range.endTs)}`;
  const dirty = region !== "All" || locIds.length > 0 || idx[0] !== DAYS - 90 || idx[1] !== DAYS - 1;

  const onExport = () => {
    const head = "id,date,location,type,inspector,score,violations,critical,status,resolved_days,top_category\n";
    const body = insp
      .map((i) => {
        const loc = LOCATIONS.find((l) => l.id === i.locationId)?.name ?? i.locationId;
        return [i.id, i.date, `"${loc}"`, i.type, i.inspector, i.score, i.violations, i.critical, i.status, i.resolvedDays ?? "", `"${i.topCategory}"`].join(",");
      })
      .join("\n");
    const url = URL.createObjectURL(new Blob([head + body], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `safetable-inspections_${ds.days[idx[0]].date}_${ds.days[idx[1]].date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative flex min-h-screen">
      {/* ambient glows */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 right-[-80px] h-[460px] w-[620px] rounded-full bg-emerald-400/[0.09] blur-[120px] dark:bg-emerald-500/[0.05]" />
        <div className="absolute bottom-[-120px] left-[320px] h-[420px] w-[560px] rounded-full bg-indigo-400/[0.07] blur-[120px] dark:bg-indigo-500/[0.04]" />
      </div>

      <Sidebar open={menu} onClose={() => setMenu(false)} dark={dark} />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setMenu(true)} query={query} onQuery={setQuery} alerts={alerts} />

        <main className="mx-auto w-full max-w-[1460px] flex-1 space-y-4 px-4 pb-10 pt-5 sm:px-6">
          {/* filters */}
          <div className="animate-fade-up" style={stagger(0, 40)}>
            <FiltersBar
              region={region}
              onRegion={(r) => { setRegion(r); setLocIds([]); }}
              selected={locIds}
              onToggleLoc={(id) =>
                setLocIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
              }
              onClearLocs={() => setLocIds([])}
              onReset={() => { setRegion("All"); setLocIds([]); setIdx([DAYS - 90, DAYS - 1]); setQuery(""); }}
              dirty={dirty}
            />
          </div>

          {/* date brush */}
          <div className="animate-fade-up" style={stagger(1, 40)}>
            <DateBrush
              timeline={timeline}
              startIdx={idx[0]}
              endIdx={idx[1]}
              onChange={(s, e) => setIdx([s, e])}
            />
          </div>

          {/* KPI cards */}
          <KpiGrid items={kpiItems} />

          {/* auto-insights */}
          <InsightsStrip insights={insights} />

          {/* charts row 1 */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="animate-fade-up xl:col-span-8" style={stagger(2, 50)}>
              <TrendChart data={series} betaLabel={dayCount > 75 ? "Weekly rollup" : "Daily"} />
            </div>
            <div className="animate-fade-up xl:col-span-4" style={stagger(3, 50)}>
              <SeverityDonut data={sevData} />
            </div>
          </div>

          {/* charts row 2 */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="animate-fade-up xl:col-span-7" style={stagger(4, 50)}>
              <CategoryBars data={catRows} />
            </div>
            <div className="animate-fade-up xl:col-span-5" style={stagger(5, 50)}>
              <LocationBars data={locRows} />
            </div>
          </div>

          {/* table */}
          <div className="animate-fade-up" style={stagger(6, 50)}>
            <InspectionsTable rows={insp} query={query} onQuery={setQuery} periodLabel={periodLabel} onExport={onExport} />
          </div>

          <footer className="flex items-center justify-center gap-2 pt-2 text-[11px] text-slate-400 dark:text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            SafeTable Compliance OS · seeded sample data for analytical demonstration · {DAYS}-day rolling window
          </footer>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  );
}
