import { useEffect, useRef } from "react";
import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "../lib/theme";
import { useNow } from "../lib/hooks";

export default function Header({
  onMenu, query, onQuery, alerts,
}: { onMenu: () => void; query: string; onQuery: (q: string) => void; alerts: number }) {
  const { dark, toggle } = useTheme();
  const now = useNow();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const time = new Date(now).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-canvas/80 backdrop-blur-md dark:border-white/[0.06] dark:bg-ink/80">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onMenu}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* left cluster */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-[15px] font-bold tracking-tight text-slate-900 dark:text-white sm:text-base">
                Compliance Overview
              </h1>
              <span className="hidden items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-600 ring-1 ring-inset ring-emerald-500/25 dark:text-emerald-400 dark:ring-emerald-400/20 sm:flex">
                <span className="h-1 w-1 animate-tick rounded-full bg-emerald-500" />
                Live
              </span>
            </div>
            <p className="truncate font-mono text-[10px] tracking-wide text-slate-400 dark:text-slate-500 tnum">
              Synced {time} · FDA Food Code 2025 + local ordinances
            </p>
          </div>
        </div>

        {/* right cluster */}
        <div className="ml-auto flex items-center gap-2">
          <label className="group relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-500" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search inspections, inspectors…"
              className="h-9 w-60 rounded-xl border border-slate-200 bg-white pl-8.5 pr-9 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition-all focus:w-72 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:focus:border-emerald-400/40"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono text-[9px] text-slate-400 dark:border-white/10 dark:bg-white/[0.06]">
              ⌘K
            </kbd>
          </label>

          <button aria-label="Regulatory alerts" className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:text-slate-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:text-slate-100">
            <Bell className="h-4 w-4" />
            {alerts > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-canvas dark:ring-ink">
                {alerts}
              </span>
            )}
          </button>

          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="relative h-9 w-9 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:text-amber-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:text-amber-300"
          >
            <span
              className="absolute inset-0 flex items-center justify-center transition-transform duration-500"
              style={{ transform: dark ? "translateY(-100%)" : "translateY(0)" }}
            >
              <Sun className="h-4 w-4" />
            </span>
            <span
              className="absolute inset-0 flex items-center justify-center transition-transform duration-500"
              style={{ transform: dark ? "translateY(0)" : "translateY(100%)" }}
            >
              <Moon className="h-4 w-4" />
            </span>
          </button>

        </div>
      </div>
    </header>
  );
}
