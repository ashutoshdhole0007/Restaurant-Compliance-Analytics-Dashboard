import {
  Building2, ClipboardCheck, FileBarChart2, LayoutDashboard,
  Scale, Settings, ShieldAlert, ShieldCheck, TriangleAlert, X,
} from "lucide-react";
import { cn } from "../utils/cn";

const NAV = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: ClipboardCheck, label: "Inspections" },
  { icon: TriangleAlert, label: "Violations" },
  { icon: Scale, label: "Audits" },
  { icon: Building2, label: "Locations" },
  { icon: FileBarChart2, label: "Reports" },
];

export default function Sidebar({
  open, onClose, dark,
}: { open: boolean; onClose: () => void; dark: boolean }) {
  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[248px] shrink-0 flex-col border-r transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
          "border-slate-200/80 bg-white dark:border-white/[0.06] dark:bg-[#0c1117]",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* logo */}
        <div className="flex items-center gap-2.5 px-5 pb-5 pt-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
            <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div className="leading-tight">
            <p className="font-display text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">SafeTable</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Compliance OS</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* nav */}
        <nav className="flex-1 overflow-y-auto px-3">
          <p className="px-2 pb-2 font-mono text-[9.5px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            Workspace
          </p>
          <div className="space-y-0.5">
            {NAV.map((n) => (
              <a
                key={n.label}
                href="#"
                onClick={(e) => e.preventDefault()}
                className={cn(
                  "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12.5px] font-medium transition-all",
                  n.active
                    ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/15"
                    : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-slate-100"
                )}
              >
                <n.icon className={cn("h-4 w-4", n.active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")} strokeWidth={2.1} />
                {n.label}
                {n.active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />}
              </a>
            ))}
          </div>

          <p className="px-2 pb-2 pt-6 font-mono text-[9.5px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            System
          </p>
          <div className="space-y-0.5">
            <a
              href="#" onClick={(e) => e.preventDefault()}
              className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12.5px] font-medium text-slate-500 transition-all hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-slate-100"
            >
              <ShieldAlert className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" strokeWidth={2.1} />
              Regulatory alerts
              <span className="ml-auto rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">3</span>
            </a>
            <a
              href="#" onClick={(e) => e.preventDefault()}
              className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12.5px] font-medium text-slate-500 transition-all hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-slate-100"
            >
              <Settings className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" strokeWidth={2.1} />
              Settings
            </a>
          </div>
        </nav>

        {/* sync status */}
        <div className="mx-3 mb-4 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              {dark ? "POS sync · Overnight" : "POS sync · Live"}
            </p>
          </div>
          <p className="mt-1 text-[10.5px] leading-relaxed text-slate-400 dark:text-slate-500">
            8 locations reporting across FDA Food Code &amp; local ordinances.
          </p>
        </div>
      </aside>
    </>
  );
}
