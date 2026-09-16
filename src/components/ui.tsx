import { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "../utils/cn";
import { useChartColors } from "../lib/theme";

// ─── Card shell ──────────────────────────────────────────────
export function Card({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <section
      style={style}
      className={cn(
        "rounded-2xl border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]",
        "border-slate-200/80 dark:border-white/[0.06] dark:bg-panel-dark dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_12px_32px_-16px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      {children}
    </section>
  );
}

// ─── Section header with overline ────────────────────────────
export function SectionHead({
  overline, title, sub, actions,
}: { overline: string; title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4.5 pb-1 sm:px-6">
      <div>
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
          {overline}
        </p>
        <h3 className="mt-0.5 font-display text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h3>
        {sub && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ─── delta pill for KPI trends ───────────────────────────────
export function DeltaPill({ value, suffix = "%", invert = false, unit = "" }: {
  value: number; suffix?: string; invert?: boolean; unit?: string;
}) {
  const good = invert ? value <= 0 : value >= 0;
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tnum",
        good
          ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400"
          : "bg-rose-500/10 text-rose-600 dark:bg-rose-400/10 dark:text-rose-400"
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {unit}
      {Math.abs(value)}
      {suffix}
    </span>
  );
}

// ─── shared chart tooltip ────────────────────────────────────
export function ChartTip({ active, payload, label, rows }: {
  active?: boolean;
  payload?: any[];
  label?: any;
  rows?: { name: string; value: string; color: string }[];
}) {
  const c = useChartColors();
  if (!active) return null;
  const items = rows ?? (payload ?? []).map((p) => ({
    name: p.name ?? "",
    value: typeof p.value === "number" ? p.value.toLocaleString() : String(p.value ?? ""),
    color: p.color ?? p.payload?.fill ?? c.emerald,
  }));
  return (
    <div
      className="rounded-xl border px-3 py-2.5 shadow-xl backdrop-blur-md"
      style={{ background: c.tipBg, borderColor: c.tipBorder, minWidth: 150 }}
    >
      {label != null && (
        <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {items.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-[3px]" style={{ background: r.color }} />
              {r.name}
            </span>
            <span className="text-[11px] font-semibold tnum text-slate-900 dark:text-slate-50">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── hand-rolled sparkline (area or bars) ────────────────────
export function Sparkline({ data, color, kind = "area", width = 132, height = 40 }: {
  data: number[]; color: string; kind?: "area" | "bars"; width?: number; height?: number;
}) {
  if (data.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const n = data.length;
  const px = (i: number) => (i / (n - 1)) * width;
  const py = (v: number) => height - 3 - ((v - min) / span) * (height - 8);

  if (kind === "bars") {
    const bw = Math.max(1.6, (width / n) * 0.62);
    return (
      <svg width={width} height={height} className="overflow-visible">
        {data.map((v, i) => {
          const x = (i / n) * width + (width / n - bw) / 2;
          const h = Math.max(1.5, ((v - min) / span) * (height - 6));
          return (
            <rect key={i} x={x} y={height - h} width={bw} height={h} rx={1.2}
              fill={color} opacity={i === n - 1 ? 1 : 0.32}
              style={{ transition: "all 0.4s ease" }} />
          );
        })}
      </svg>
    );
  }

  const pts = data.map((v, i) => [px(i), py(v)] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  const area = `${line}L${width},${height}L0,${height}Z`;
  const gid = `sp-${color.replace(/[^a-z0-9]/gi, "")}`;
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} style={{ transition: "all 0.4s ease" }} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="2.6" fill={color} stroke="white" strokeWidth="1.2" className="dark:stroke-panel-dark" />
    </svg>
  );
}

// ─── small legend dot ────────────────────────────────────────
export function LegendDot({ color, label, value }: { color: string; label: string; value?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
      {value && <span className="font-semibold tnum text-slate-700 dark:text-slate-200">{value}</span>}
    </span>
  );
}
