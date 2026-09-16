// ─────────────────────────────────────────────────────────────
// SafeTable · deterministic sample-data engine
// Seeded PRNG + seasonality + incident spikes so every chart
// feels alive yet renders identically on each load.
// ─────────────────────────────────────────────────────────────

export type Region = "Northeast" | "Southeast" | "West";
export type Category =
  | "Food Handling"
  | "Temperature Control"
  | "Sanitation"
  | "Documentation"
  | "Staff Hygiene"
  | "Equipment"
  | "Pest Control";

export type InspType = "Routine" | "Follow-up" | "Complaint" | "Re-inspection";
export type Status = "Passed" | "Conditional" | "Failed";

export interface Location {
  id: string;
  name: string;
  city: string;
  region: Region;
  format: "Fine Dining" | "Casual" | "QSR" | "Café";
  base: number; // baseline compliance score
  slope: number; // improvement per day
  volatility: number;
  size: number; // inspection volume multiplier
}

export interface DayRecord {
  ts: number;
  date: string; // ISO yyyy-mm-dd
  locationId: string;
  score: number;
  inspections: number;
  violations: number;
  minor: number;
  major: number;
  critical: number;
  byCat: Record<Category, number>;
  resolutionDays: number;
}

export interface Inspection {
  id: string;
  ts: number;
  date: string;
  locationId: string;
  inspector: string;
  type: InspType;
  score: number;
  violations: number;
  critical: number;
  status: Status;
  resolvedDays: number | null;
  topCategory: Category;
}

// ─── PRNG ────────────────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussian(rng: () => number) {
  // Box–Muller
  const u = Math.max(rng(), 1e-9);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// ─── Static dimensions ───────────────────────────────────────
export const LOCATIONS: Location[] = [
  { id: "hv", name: "Harbor & Vine", city: "Boston, MA", region: "Northeast", format: "Fine Dining", base: 93.2, slope: 0.008, volatility: 1.6, size: 1.1 },
  { id: "cf", name: "Copper Fork", city: "New York, NY", region: "Northeast", format: "Casual", base: 88.4, slope: 0.014, volatility: 2.6, size: 1.5 },
  { id: "bk", name: "Bluejay Café", city: "Providence, RI", region: "Northeast", format: "Café", base: 91.0, slope: 0.010, volatility: 1.9, size: 0.8 },
  { id: "mt", name: "Magnolia Table", city: "Atlanta, GA", region: "Southeast", format: "Casual", base: 84.6, slope: 0.030, volatility: 3.4, size: 1.4 },
  { id: "gh", name: "Golden Hour", city: "Miami, FL", region: "Southeast", format: "Fine Dining", base: 89.7, slope: 0.012, volatility: 2.2, size: 1.2 },
  { id: "lc", name: "Lowcountry Line", city: "Charleston, SC", region: "Southeast", format: "QSR", base: 79.8, slope: 0.045, volatility: 4.2, size: 1.8 },
  { id: "ja", name: "Juniper & Ash", city: "Denver, CO", region: "West", format: "Casual", base: 90.5, slope: 0.009, volatility: 2.0, size: 1.0 },
  { id: "cs", name: "Casa Solana", city: "Austin, TX", region: "West", format: "QSR", base: 86.3, slope: 0.018, volatility: 2.8, size: 1.3 },
];

export const REGIONS: Region[] = ["Northeast", "Southeast", "West"];

export const CATEGORIES: Category[] = [
  "Food Handling",
  "Temperature Control",
  "Sanitation",
  "Documentation",
  "Staff Hygiene",
  "Equipment",
  "Pest Control",
];

// how a violation of each category tends to split across severities
export const CAT_SEVERITY_PROFILE: Record<Category, [number, number, number]> = {
  "Food Handling": [0.52, 0.34, 0.14],
  "Temperature Control": [0.38, 0.4, 0.22],
  "Sanitation": [0.66, 0.26, 0.08],
  "Documentation": [0.82, 0.15, 0.03],
  "Staff Hygiene": [0.7, 0.24, 0.06],
  "Equipment": [0.58, 0.33, 0.09],
  "Pest Control": [0.3, 0.42, 0.28],
};

const CAT_WEIGHT: Record<Category, number> = {
  "Food Handling": 0.22,
  "Temperature Control": 0.2,
  "Sanitation": 0.17,
  "Documentation": 0.12,
  "Staff Hygiene": 0.11,
  "Equipment": 0.1,
  "Pest Control": 0.08,
};

const INSPECTORS = [
  "D. Okafor", "M. Alvarez", "S. Chen", "J. Novak", "A. Bergström",
  "R. Patel", "L. Moreau", "K. Tanaka", "E. Fitzgerald", "N. Haddad",
];

// ─── Generator ──────────────────────────────────────────────
export const DAYS = 210; // ~7 months of runway for the date brush

export interface Dataset {
  days: { ts: number; date: string }[];
  daily: DayRecord[];
  inspections: Inspection[];
  generatedAt: number;
}

let cache: Dataset | null = null;

export function getDataset(): Dataset {
  if (cache) return cache;

  const rng = mulberry32(20260214);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 86400000;
  const startTs = today.getTime() - (DAYS - 1) * dayMs;

  const days: { ts: number; date: string }[] = [];
  for (let i = 0; i < DAYS; i++) {
    const ts = startTs + i * dayMs;
    days.push({ ts, date: new Date(ts).toISOString().slice(0, 10) });
  }

  const daily: DayRecord[] = [];
  const inspections: Inspection[] = [];
  let inspCounter = 4200;

  for (const loc of LOCATIONS) {
    let inspSerial = 0;
    const catTilt = CATEGORIES.map(() => 0.75 + rng() * 0.5); // per-location category emphasis

    for (let i = 0; i < DAYS; i++) {
      const { ts, date } = days[i];
      const dow = new Date(ts).getDay(); // 0 Sun … 6 Sat
      const weekend = dow === 0 || dow === 6;

      // ── score: baseline + trend + seasonality + noise + incident dips
      const weeklyWave = Math.sin((i / 7) * Math.PI * 2 + loc.base) * 0.8;
      const weekendDip = weekend ? -1.4 : 0;
      const incident = rng() < 0.012; // ~1.2% incident days
      const incidentDip = incident ? 5 + rng() * 7 : 0;
      const noise = gaussian(rng) * loc.volatility;
      const score = clamp(
        loc.base + loc.slope * i + weeklyWave + weekendDip + noise - incidentDip,
        52, 99.6
      );

      // ── volume
      const inspExpected = loc.size * (weekend ? 0.45 : 1) * (0.9 + 0.2 * Math.sin(i / 17));
      const inspCount = rng() < inspExpected % 1 ? Math.floor(inspExpected) + 1 : Math.floor(inspExpected);

      // ── violations tied inversely to score
      const risk = clamp((96 - score) / 12, 0.15, 4.5);
      let violations = Math.round(inspCount * risk * (1.15 + gaussian(rng) * 0.35) + (incident ? 4 + rng() * 6 : 0));
      violations = Math.max(0, violations);

      // severity mix worsens as score drops
      const heat = clamp((92 - score) / 18, 0, 1);
      const pCrit = 0.08 + heat * 0.16;
      const pMajor = 0.27 + heat * 0.12;
      let remaining = violations;
      const critical = Math.min(remaining, Math.round(violations * pCrit * (0.6 + rng() * 0.8)));
      remaining -= critical;
      const major = Math.min(remaining, Math.round(violations * pMajor * (0.7 + rng() * 0.6)));
      remaining -= major;
      const minor = remaining;

      // category distribution — weighted multinomial draws
      const byCat = {} as Record<Category, number>;
      CATEGORIES.forEach((c) => (byCat[c] = 0));
      const weights = CATEGORIES.map((c, ci) => CAT_WEIGHT[c] * catTilt[ci]);
      const wSum = weights.reduce((a, b) => a + b, 0);
      for (let v = 0; v < violations; v++) {
        let r = rng() * wSum;
        let ci = 0;
        while (ci < weights.length - 1 && r > weights[ci]) { r -= weights[ci]; ci++; }
        byCat[CATEGORIES[ci]]++;
      }

      const resolutionDays = clamp(
        5.2 - loc.slope * 30 + heat * 3.4 + gaussian(rng) * 0.9 + (incident ? 1.6 : 0),
        0.8, 14
      );

      daily.push({
        ts, date, locationId: loc.id, score: +score.toFixed(1),
        inspections: inspCount, violations, minor, major, critical,
        byCat, resolutionDays: +resolutionDays.toFixed(2),
      });

      // ── individual inspections (table rows)
      for (let k = 0; k < inspCount; k++) {
        if (rng() < 0.42) continue; // thin the table vs daily volume
        inspSerial++;
        const adverse = rng() < 0.075; // complaint-triggered rough days
        const iScore = clamp(score + gaussian(rng) * 3.0 - (adverse ? 7 + rng() * 9 : 0), 48, 100);
        const status: Status = iScore >= 87 ? "Passed" : iScore >= 75 ? "Conditional" : "Failed";
        const iViol = Math.max(0, Math.round(risk * (0.8 + rng()) + (status === "Passed" ? rng() * 2 : 1 + rng() * 4) + (adverse ? 2 : 0)));
        const iCrit = Math.min(iViol, status === "Failed" ? Math.round(rng() * 2 + 1) : rng() < 0.25 + heat * 0.3 + (adverse ? 0.35 : 0) ? 1 : 0);
        const type: InspType =
          status === "Failed" ? (rng() < 0.5 ? "Re-inspection" : "Complaint")
          : rng() < 0.72 ? "Routine"
          : rng() < 0.6 ? "Follow-up"
          : rng() < 0.5 ? "Complaint" : "Re-inspection";
        const topCat = CATEGORIES[Math.floor(rng() * CATEGORIES.length)];
        inspections.push({
          id: `IN-${inspCounter++}`,
          ts, date, locationId: loc.id,
          inspector: INSPECTORS[Math.floor(rng() * INSPECTORS.length)],
          type,
          score: +iScore.toFixed(0),
          violations: iViol,
          critical: iCrit,
          status,
          resolvedDays: status === "Passed" ? null : +(clamp(resolutionDays + gaussian(rng), 0.5, 21)).toFixed(0),
          topCategory: topCat,
        });
      }
    }
  }

  inspections.sort((a, b) => b.ts - a.ts || b.id.localeCompare(a.id));
  cache = { days, daily, inspections, generatedAt: Date.now() };
  return cache;
}
