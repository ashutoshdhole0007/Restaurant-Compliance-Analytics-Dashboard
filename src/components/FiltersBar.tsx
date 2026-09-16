import { Check, MapPin, RotateCcw } from "lucide-react";
import { LOCATIONS, REGIONS, Region } from "../lib/data";
import { cn } from "../utils/cn";

export interface FiltersBarProps {
  region: Region | "All";
  onRegion: (r: Region | "All") => void;
  selected: string[]; // empty = all within region
  onToggleLoc: (id: string) => void;
  onClearLocs: () => void;
  onReset: () => void;
  dirty: boolean;
}

export default function FiltersBar({
  region, onRegion, selected, onToggleLoc, onClearLocs, onReset, dirty,
}: FiltersBarProps) {
  const visible = LOCATIONS.filter((l) => region === "All" || l.region === region);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-3 backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-3.5 lg:flex-row lg:items-center lg:gap-5">
      {/* region segmented control */}
      <div className="flex items-center gap-2">
        <span className="hidden font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 sm:block">
          Region
        </span>
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-white/[0.05]">
          {(["All", ...REGIONS] as const).map((r) => (
            <button
              key={r}
              onClick={() => onRegion(r)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                region === r
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-white/10 dark:text-white dark:ring-white/10"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden h-8 w-px bg-slate-200 dark:bg-white/10 lg:block" />

      {/* location chips */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <div className="no-scrollbar flex flex-1 items-center gap-1.5 overflow-x-auto">
          <button
            onClick={onClearLocs}
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
              selected.length === 0
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300"
                : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-white/10 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            All locations
          </button>
          {visible.map((l) => {
            const on = selected.includes(l.id);
            return (
              <button
                key={l.id}
                onClick={() => onToggleLoc(l.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-200",
                  on
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300"
                    : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-white/10 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {on && <Check className="h-3 w-3" strokeWidth={3} />}
                {l.name}
              </button>
            );
          })}
        </div>
      </div>

      {dirty && (
        <button
          onClick={onReset}
          className="flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800 dark:border-white/10 dark:text-slate-400 dark:hover:text-slate-100 lg:self-center"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      )}
    </div>
  );
}
