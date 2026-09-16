import { LucideIcon, Radar, SunMoon, TrendingUp } from "lucide-react";
import { DayRecord } from "../lib/data";
import { LocRow } from "../lib/analytics";
import { useMemo } from "react";

export interface Insight {
  icon: LucideIcon;
  tint: string;
  title: string;
  body: string;
}

export function useInsights(records: DayRecord[], locRows: LocRow[]): Insight[] {
  return useMemo(() => {
    if (records.length === 0 || locRows.length === 0) return [];
    const out: Insight[] = [];

    // 1 · biggest mover
    const mover = [...locRows].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
    if (mover && Math.abs(mover.delta) >= 0.1) {
      out.push({
        icon: TrendingUp,
        tint: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400",
        title: mover.delta >= 0 ? "Top improver" : "Needs attention",
        body: `${mover.name} ${mover.delta >= 0 ? "gained" : "slipped"} ${Math.abs(mover.delta).toFixed(1)} pts vs the prior window — ${mover.delta >= 0 ? "sustain current SOPs" : "review corrective actions"}.`,
      });
    }

    // 2 · critical concentration
    const totalCrit = locRows.reduce((a, l) => a + l.critical, 0);
    const riskiest = [...locRows].sort((a, b) => b.critical - a.critical)[0];
    if (riskiest && totalCrit > 0) {
      out.push({
        icon: Radar,
        tint: "bg-rose-500/10 text-rose-600 dark:bg-rose-400/10 dark:text-rose-400",
        title: "Risk concentration",
        body: `${riskiest.name} holds ${((riskiest.critical / totalCrit) * 100).toFixed(0)}% of ${totalCrit.toLocaleString()} critical findings in this window — prioritize audit scheduling.`,
      });
    }

    // 3 · weekend effect
    let weV = 0, weN = 0, wdV = 0, wdN = 0;
    for (const r of records) {
      const d = new Date(r.ts).getDay();
      if (d === 0 || d === 6) { weV += r.violations; weN++; }
      else { wdV += r.violations; wdN++; }
    }
    if (weN && wdN) {
      const diff = ((weV / weN - wdV / wdN) / Math.max(0.01, wdV / wdN)) * 100;
      out.push({
        icon: SunMoon,
        tint: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400",
        title: "Weekend pattern",
        body: `Weekend shifts log ${Math.abs(diff).toFixed(0)}% ${diff >= 0 ? "more" : "fewer"} violations per day than weekdays — ${diff >= 0 ? "staffing overlap may be driving risk" : "current rotation is performing well"}.`,
      });
    }
    return out.slice(0, 3);
  }, [records, locRows]);
}

export default function InsightsStrip({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {insights.map((it, i) => (
        <div
          key={it.title}
          className="flex animate-fade-up items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/60 px-4 py-3.5 backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.02]"
          style={{ animationDelay: `${140 + i * 70}ms` }}
        >
          <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${it.tint}`}>
            <it.icon className="h-3.5 w-3.5" strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[9.5px] font-medium uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              {it.title}
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">{it.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
