import { useCallback, useEffect, useState } from "react";
import { CalendarRange } from "lucide-react";
import { useElementWidth } from "../lib/hooks";
import { useChartColors } from "../lib/theme";
import { fmtInt, fmtMed } from "../lib/analytics";
import { cn } from "../utils/cn";

interface Props {
  timeline: { ts: number; value: number }[];
  startIdx: number;
  endIdx: number;
  onChange: (s: number, e: number) => void;
}

const H = 58;
const PRESETS = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "All", days: 0 },
];

export default function DateBrush({ timeline, startIdx, endIdx, onChange }: Props) {
  const c = useChartColors();
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();
  const n = timeline.length;
  const max = Math.max(1, ...timeline.map((d) => d.value));
  const [drag, setDrag] = useState<null | { mode: "l" | "r" | "m"; x0: number; s0: number; e0: number }>(null);

  const x = useCallback(
    (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * Math.max(1, width)),
    [n, width]
  );

  const applyPreset = (days: number) => {
    if (days === 0) onChange(0, n - 1);
    else onChange(Math.max(0, n - days), n - 1);
  };

  // global pointer move/up while dragging
  useEffect(() => {
    if (!drag) return;
    const pxPerIdx = width / (n - 1);
    const onMove = (ev: PointerEvent) => {
      const dIdx = Math.round((ev.clientX - drag.x0) / pxPerIdx);
      if (drag.mode === "l") {
        const s = Math.min(Math.max(0, drag.s0 + dIdx), drag.e0 - 6);
        onChange(s, drag.e0);
      } else if (drag.mode === "r") {
        const e = Math.max(Math.min(n - 1, drag.e0 + dIdx), drag.s0 + 6);
        onChange(drag.s0, e);
      } else {
        const span = drag.e0 - drag.s0;
        let s = drag.s0 + dIdx;
        s = Math.max(0, Math.min(n - 1 - span, s));
        onChange(s, s + span);
      }
    };
    const onUp = () => setDrag(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, n, width, onChange]);

  const begin = (mode: "l" | "r" | "m") => (ev: React.PointerEvent) => {
    ev.preventDefault();
    setDrag({ mode, x0: ev.clientX, s0: startIdx, e0: endIdx });
  };

  if (n === 0) return null;
  const xs = x(startIdx);
  const xe = x(endIdx);
  const dayCount = endIdx - startIdx + 1;
  const total = timeline.slice(startIdx, endIdx + 1).reduce((a, d) => a + d.value, 0);
  // find matching preset mark
  const isAll = startIdx === 0 && endIdx === n - 1;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-3 backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.02] sm:px-4 sm:py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
            <CalendarRange className="h-3.5 w-3.5" />
          </span>
          <div className="text-xs">
            <span className="font-semibold tnum text-slate-900 dark:text-slate-50">
              {fmtMed(timeline[startIdx].ts)} — {fmtMed(timeline[endIdx].ts)}
            </span>
            <span className="ml-2 text-slate-400 dark:text-slate-500 tnum">
              {dayCount} days · {fmtInt(total)} recorded violations
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-white/[0.05]">
          {PRESETS.map((p) => {
            const active = p.days === 0 ? isAll : dayCount === p.days && endIdx === n - 1;
            return (
              <button
                key={p.label}
                onClick={() => applyPreset(p.days)}
                className={cn(
                  "rounded-md px-2.5 py-1 font-mono text-[10.5px] font-medium tracking-wide transition-all",
                  active
                    ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200 dark:bg-white/10 dark:text-emerald-300 dark:ring-white/10"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div ref={wrapRef} className="relative mt-2.5 select-none">
        {width > 0 && (
          <svg width={width} height={H} className="block">
            {/* bars */}
            {timeline.map((d, i) => {
              const bw = Math.max(1, width / n - 1);
              const h = Math.max(1.5, (d.value / max) * (H - 8));
              const inSel = i >= startIdx && i <= endIdx;
              return (
                <rect
                  key={d.ts}
                  x={(i / n) * width}
                  y={H - h}
                  width={bw}
                  height={h}
                  rx={0.8}
                  fill={inSel ? c.emerald : c.slate}
                  opacity={inSel ? 0.9 : 0.5}
                  style={{ transition: "fill .2s, opacity .2s" }}
                />
              );
            })}

            {/* dim outside selection */}
            <rect x={0} y={0} width={xs} height={H} fill={c.dark ? "rgba(2,6,10,0.45)" : "rgba(241,245,249,0.72)"} />
            <rect x={xe} y={0} width={Math.max(0, width - xe)} height={H} fill={c.dark ? "rgba(2,6,10,0.45)" : "rgba(241,245,249,0.72)"} />

            {/* selection frame */}
            <rect x={xs} y={1} width={Math.max(0, xe - xs)} height={H - 2} fill="none"
              stroke={c.emerald} strokeOpacity="0.55" rx="4" />

            {/* middle drag zone */}
            <rect x={xs + 7} y={3} width={Math.max(0, xe - xs - 14)} height={H - 6}
              fill="transparent" className="brush-grab" onPointerDown={begin("m")} />

            {/* handles */}
            {([["l", xs], ["r", xe]] as const).map(([mode, hx]) => (
              <g key={mode} transform={`translate(${mode === "l" ? hx - 5 : hx - 5},0)`}
                className="brush-ew" onPointerDown={begin(mode)}>
                <rect x={-2} y={0} width={14} height={H} fill="transparent" />
                <rect x={2} y={(H - 26) / 2} width={6} height={26} rx={3}
                  fill={c.emerald} stroke={c.dark ? "#0a0e13" : "#ffffff"} strokeWidth="1.5" />
                <line x1={4.2} y1={H / 2 - 4} x2={4.2} y2={H / 2 + 4} stroke={c.dark ? "#052e22" : "#ffffff"} strokeWidth="1.1" strokeLinecap="round" />
                <line x1={6.4} y1={H / 2 - 4} x2={6.4} y2={H / 2 + 4} stroke={c.dark ? "#052e22" : "#ffffff"} strokeWidth="1.1" strokeLinecap="round" />
              </g>
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}
