import { LucideIcon } from "lucide-react";
import { Card, DeltaPill, Sparkline } from "./ui";
import { useTweenedNumber, stagger } from "../lib/hooks";

export interface KpiView {
  label: string;
  value: number;
  format: (v: number) => string;
  delta: number;
  invert?: boolean;
  deltaSuffix?: string;
  spark: number[];
  kind: "area" | "bars";
  color: string;
  icon: LucideIcon;
  tint: string; // tailwind bg class for icon chip
  foot: string;
}

function KpiCard({ k, i }: { k: KpiView; i: number }) {
  const v = useTweenedNumber(k.value);
  const Icon = k.icon;
  return (
    <Card className="group animate-fade-up p-5 transition-transform duration-300 hover:-translate-y-0.5" style={stagger(i, 70)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${k.tint}`}>
            <Icon className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <p className="text-[12px] font-medium leading-tight text-slate-500 dark:text-slate-400">{k.label}</p>
        </div>
        <DeltaPill value={+k.delta.toFixed(1)} suffix={k.deltaSuffix ?? "%"} invert={k.invert} />
      </div>
      <div className="mt-3.5 flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-[30px] font-bold leading-none tracking-tight tnum text-slate-900 dark:text-white">
            {k.format(v)}
          </p>
          <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">{k.foot}</p>
        </div>
        <div className="shrink-0 opacity-90 transition-opacity group-hover:opacity-100">
          <Sparkline data={k.spark} color={k.color} kind={k.kind} />
        </div>
      </div>
    </Card>
  );
}

export default function KpiGrid({ items }: { items: KpiView[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((k, i) => (
        <KpiCard key={k.label} k={k} i={i} />
      ))}
    </div>
  );
}
