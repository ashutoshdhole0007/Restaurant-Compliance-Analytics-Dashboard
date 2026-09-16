import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { LocRow } from "../lib/analytics";
import { useChartColors } from "../lib/theme";
import { Card, SectionHead } from "./ui";
import { cn } from "../utils/cn";

export default function LocationBars({ data }: { data: LocRow[] }) {
  const c = useChartColors();
  const band = (s: number) => (s >= 90 ? c.emerald : s >= 84 ? c.teal : s >= 78 ? c.amber : c.rose);

  return (
    <Card className="flex h-full flex-col">
      <SectionHead
        overline="Benchmark"
        title="Location performance"
        sub="Avg. compliance score · period delta"
      />
      <div className="flex-1 space-y-1 px-4 pb-4 pt-2">
        {data.map((l, i) => (
          <div
            key={l.id}
            className="group grid grid-cols-[130px_1fr_auto] items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] sm:grid-cols-[150px_1fr_auto]"
          >
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-slate-700 dark:text-slate-200">{l.name}</p>
              <p className="truncate font-mono text-[9.5px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {l.city}
              </p>
            </div>
            <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${Math.max(2, (l.score / 100) * 100)}%`,
                  background: `linear-gradient(90deg, ${band(l.score)}cc, ${band(l.score)})`,
                  transition: "width .7s cubic-bezier(.22,1,.36,1), background .3s",
                  transitionDelay: `${i * 40}ms`,
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "hidden items-center gap-0.5 text-[10px] font-semibold tnum sm:flex",
                  l.delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                )}
              >
                {l.delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(l.delta).toFixed(1)}
              </span>
              <span className="w-10 text-right text-[13px] font-bold tnum text-slate-900 dark:text-white">
                {l.score.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-400">No locations match current filters.</p>
        )}
      </div>
    </Card>
  );
}
