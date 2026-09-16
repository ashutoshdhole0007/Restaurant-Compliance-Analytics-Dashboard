// ─────────────────────────────────────────────────────────────
// Aggregation + formatting helpers — every view derives from
// these so filters update all views consistently.
// ─────────────────────────────────────────────────────────────
import {
  CATEGORIES, CAT_SEVERITY_PROFILE, Category, Dataset, DayRecord,
  Inspection, Location, Status,
} from "./data";

const dayMs = 86400000;

export interface Range {
  startTs: number;
  endTs: number; // inclusive, end of day
}

export function filterDaily(ds: Dataset, locs: Location[], range: Range): DayRecord[] {
  const ids = new Set(locs.map((l) => l.id));
  return ds.daily.filter(
    (d) => ids.has(d.locationId) && d.ts >= range.startTs && d.ts <= range.endTs
  );
}

export function filterInspections(ds: Dataset, locs: Location[], range: Range): Inspection[] {
  const ids = new Set(locs.map((l) => l.id));
  return ds.inspections.filter(
    (i) => ids.has(i.locationId) && i.ts >= range.startTs && i.ts <= range.endTs + dayMs - 1
  );
}

// ─── KPI aggregations ────────────────────────────────────────
export interface Kpis {
  score: number;
  violations: number;
  critical: number;
  passRate: number;
  resolution: number;
  inspCount: number;
  openActions: number;
}

export function computeKpis(records: DayRecord[], inspections: Inspection[]): Kpis {
  if (records.length === 0) {
    return { score: 0, violations: 0, critical: 0, passRate: 0, resolution: 0, inspCount: 0, openActions: 0 };
  }
  const score = records.reduce((a, r) => a + r.score, 0) / records.length;
  const violations = records.reduce((a, r) => a + r.violations, 0);
  const critical = records.reduce((a, r) => a + r.critical, 0);
  const inspCount = inspections.length;
  const passed = inspections.filter((i) => i.status === "Passed").length;
  const openList = inspections.filter((i) => i.status !== "Passed");
  const resolution = openList.length
    ? openList.reduce((a, i) => a + (i.resolvedDays ?? 0), 0) / openList.length
    : 0;
  return {
    score: +score.toFixed(1),
    violations,
    critical,
    passRate: inspCount ? +(100 * (passed / inspCount)).toFixed(1) : 0,
    resolution: +resolution.toFixed(1),
    inspCount,
    openActions: openList.length,
  };
}

// ─── time series (auto daily/weekly granularity) ─────────────
export interface SeriesPoint {
  ts: number;
  label: string;
  score: number;
  ma: number;
  violations: number;
  critical: number;
  inspections: number;
}

export function buildSeries(records: DayRecord[], dayCount: number): SeriesPoint[] {
  const weekly = dayCount > 75;
  const bucketMs = weekly ? 7 * dayMs : dayMs;
  const buckets = new Map<number, DayRecord[]>();
  for (const r of records) {
    const b = Math.floor(r.ts / bucketMs) * bucketMs;
    if (!buckets.has(b)) buckets.set(b, []);
    buckets.get(b)!.push(r);
  }
  const keys = [...buckets.keys()].sort((a, b) => a - b);
  const pts: SeriesPoint[] = keys.map((k) => {
    const rows = buckets.get(k)!;
    const score = rows.reduce((a, r) => a + r.score, 0) / rows.length;
    return {
      ts: k,
      label: fmtShort(k),
      score: +score.toFixed(1),
      ma: 0,
      violations: rows.reduce((a, r) => a + r.violations, 0),
      critical: rows.reduce((a, r) => a + r.critical, 0),
      inspections: rows.reduce((a, r) => a + r.inspections, 0),
    };
  });
  // centered moving average (window 5)
  const w = 2;
  pts.forEach((p, i) => {
    let s = 0, n = 0;
    for (let j = Math.max(0, i - w); j <= Math.min(pts.length - 1, i + w); j++) {
      s += pts[j].score; n++;
    }
    p.ma = +(s / n).toFixed(2);
  });
  return pts;
}

// ─── category × severity matrix ─────────────────────────────
export interface CatRow {
  name: Category;
  minor: number;
  major: number;
  critical: number;
  total: number;
}

export function buildCategoryRows(records: DayRecord[]): CatRow[] {
  const totals = new Map<Category, number>(CATEGORIES.map((c) => [c, 0]));
  for (const r of records) for (const c of CATEGORIES) totals.set(c, (totals.get(c) ?? 0) + r.byCat[c]);
  const rows: CatRow[] = CATEGORIES.map((c) => {
    const total = totals.get(c) ?? 0;
    const [pm, pj] = CAT_SEVERITY_PROFILE[c];
    return {
      name: c,
      total,
      minor: Math.round(total * pm),
      major: Math.round(total * pj),
      critical: total - Math.round(total * pm) - Math.round(total * pj),
    };
  });
  return rows.sort((a, b) => b.total - a.total);
}

// ─── severity donut ─────────────────────────────────────────
export interface SevSlice {
  name: "Minor" | "Major" | "Critical";
  value: number;
}
export function buildSeverity(records: DayRecord[]): SevSlice[] {
  let minor = 0, major = 0, critical = 0;
  for (const r of records) {
    minor += r.minor; major += r.major; critical += r.critical;
  }
  return [
    { name: "Minor", value: minor },
    { name: "Major", value: major },
    { name: "Critical", value: critical },
  ];
}

// ─── per-location rollup ────────────────────────────────────
export interface LocRow {
  id: string;
  name: string;
  city: string;
  score: number;
  passRate: number;
  violations: number;
  critical: number;
  delta: number;
}

export function buildLocationRows(records: DayRecord[], prev: DayRecord[], locs: Location[]): LocRow[] {
  const cur = new Map<string, DayRecord[]>();
  const old = new Map<string, DayRecord[]>();
  for (const r of records) {
    if (!cur.has(r.locationId)) cur.set(r.locationId, []);
    cur.get(r.locationId)!.push(r);
  }
  for (const r of prev) {
    if (!old.has(r.locationId)) old.set(r.locationId, []);
    old.get(r.locationId)!.push(r);
  }
  return locs
    .map((l) => {
      const rows = cur.get(l.id) ?? [];
      const prevRows = old.get(l.id) ?? [];
      const score = rows.length ? rows.reduce((a, r) => a + r.score, 0) / rows.length : 0;
      const pScore = prevRows.length ? prevRows.reduce((a, r) => a + r.score, 0) / prevRows.length : score;
      const insp = rows.reduce((a, r) => a + r.inspections, 0);
      const violations = rows.reduce((a, r) => a + r.violations, 0);
      const critical = rows.reduce((a, r) => a + r.critical, 0);
      const passRate = insp ? clampNum(100 - (violations / Math.max(1, insp)) * 9, 40, 100) : 0;
      return {
        id: l.id, name: l.name, city: l.city,
        score: +score.toFixed(1), passRate: +passRate.toFixed(0),
        violations, critical, delta: +(score - pScore).toFixed(1),
      };
    })
    .sort((a, b) => b.score - a.score);
}

// ─── full-timeline for the date brush ───────────────────────
export function buildTimeline(ds: Dataset, locs: Location[]): { ts: number; value: number }[] {
  const ids = new Set(locs.map((l) => l.id));
  const byDay = new Map<number, number>();
  for (const r of ds.daily) {
    if (!ids.has(r.locationId)) continue;
    byDay.set(r.ts, (byDay.get(r.ts) ?? 0) + r.violations);
  }
  return ds.days.map((d) => ({ ts: d.ts, value: byDay.get(d.ts) ?? 0 }));
}

// ─── sparkline series for KPI cards ─────────────────────────
export function sparkSeries(records: DayRecord[], pick: (r: DayRecord) => number, range: Range): number[] {
  const byDay = new Map<number, { s: number; n: number }>();
  for (const r of records) {
    const b = byDay.get(r.ts) ?? { s: 0, n: 0 };
    b.s += pick(r); b.n += 1;
    byDay.set(r.ts, b);
  }
  const out: number[] = [];
  for (let ts = range.startTs; ts <= range.endTs; ts += dayMs) {
    const b = byDay.get(ts);
    if (b) out.push(+(b.s / b.n).toFixed(2));
  }
  return out;
}

export function sparkSum(records: DayRecord[], pick: (r: DayRecord) => number, range: Range): number[] {
  const byDay = new Map<number, number>();
  for (const r of records) byDay.set(r.ts, (byDay.get(r.ts) ?? 0) + pick(r));
  const out: number[] = [];
  for (let ts = range.startTs; ts <= range.endTs; ts += dayMs) {
    if (byDay.has(ts)) out.push(byDay.get(ts)!);
  }
  return out;
}

// ─── previous comparison range ──────────────────────────────
export function previousRange(range: Range, dayMsLocal: number = dayMs): Range {
  const span = range.endTs - range.startTs + dayMsLocal;
  const endTs = range.startTs - dayMsLocal;
  return { startTs: endTs - span + dayMsLocal, endTs };
}

// ─── status helpers ─────────────────────────────────────────
export const STATUS_ORDER: Record<Status, number> = { Failed: 0, Conditional: 1, Passed: 2 };

// ─── formatting ─────────────────────────────────────────────
const mShort = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const mMed = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
export const fmtShort = (ts: number) => mShort.format(new Date(ts));
export const fmtMed = (ts: number) => mMed.format(new Date(ts));
export const fmtInt = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));
export const clampNum = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
