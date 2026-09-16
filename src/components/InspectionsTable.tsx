import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown, ArrowUp, ChevronsUpDown, ChevronLeft, ChevronRight,
  ClipboardList, Download, Inbox, Search,
} from "lucide-react";
import { Inspection, LOCATIONS, Status } from "../lib/data";
import { STATUS_ORDER, fmtMed } from "../lib/analytics";
import { Card, SectionHead } from "./ui";
import { cn } from "../utils/cn";

const PAGE = 9;
const LOC_NAME = new Map(LOCATIONS.map((l) => [l.id, l.name]));

type SortKey = "ts" | "id" | "location" | "type" | "inspector" | "score" | "violations" | "status" | "resolved";

const COLS: { key: SortKey; label: string; align?: "right" | "center"; hide?: string }[] = [
  { key: "id", label: "Report" },
  { key: "ts", label: "Date" },
  { key: "location", label: "Location" },
  { key: "type", label: "Type", hide: "lg" },
  { key: "inspector", label: "Inspector", hide: "xl" },
  { key: "score", label: "Score", align: "right" },
  { key: "violations", label: "Viol.", align: "right" },
  { key: "status", label: "Status", align: "center" },
  { key: "resolved", label: "Resolved", align: "right", hide: "lg" },
];

const STATUS_STYLE: Record<Status, string> = {
  Passed: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  Conditional: "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
  Failed: "bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20",
};

function accessor(r: Inspection, key: SortKey): string | number {
  switch (key) {
    case "location": return LOC_NAME.get(r.locationId) ?? "";
    case "resolved": return r.resolvedDays ?? -1;
    case "status": return STATUS_ORDER[r.status];
    default: return r[key];
  }
}

export default function InspectionsTable({
  rows, query, onQuery, periodLabel, onExport,
}: {
  rows: Inspection[];
  query: string;
  onQuery: (q: string) => void;
  periodLabel: string;
  onExport: () => void;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "ts", dir: -1 });
  const [status, setStatus] = useState<Status | "All">("All");
  const [page, setPage] = useState(0);

  const counts = useMemo(() => {
    const m = { All: rows.length, Passed: 0, Conditional: 0, Failed: 0 } as Record<Status | "All", number>;
    for (const r of rows) m[r.status]++;
    return m;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = rows;
    if (status !== "All") out = out.filter((r) => r.status === status);
    if (q) {
      out = out.filter((r) =>
        [r.id, r.inspector, r.type, r.topCategory, LOC_NAME.get(r.locationId) ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    const { key, dir } = sort;
    return [...out].sort((a, b) => {
      const va = accessor(a, key);
      const vb = accessor(b, key);
      const cmp = typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb));
      return cmp * dir;
    });
  }, [rows, query, status, sort]);

  useEffect(() => setPage(0), [query, status, rows]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const slice = filtered.slice(cur * PAGE, cur * PAGE + PAGE);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "ts" ? -1 : 1 }));

  return (
    <Card>
      <SectionHead
        overline="Inspection log"
        title="Health inspection records"
        sub={`${filtered.length.toLocaleString()} records · ${periodLabel}`}
        actions={
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:border-emerald-500/40 hover:text-emerald-700 dark:border-white/10 dark:text-slate-300 dark:hover:border-emerald-400/30 dark:hover:text-emerald-300"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        }
      />

      {/* mobile search (header search is hidden below md) */}
      <label className="mx-5 mt-2.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 dark:border-white/10 dark:bg-white/[0.03] sm:mx-6 md:hidden">
        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search inspections, inspectors…"
          className="w-full bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none dark:text-slate-200"
        />
      </label>

      {/* status filter chips */}
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-5 pb-2 pt-2 sm:px-6">
        <ClipboardList className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        {(["All", "Passed", "Conditional", "Failed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all tnum",
              status === s
                ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:border-white/10 dark:text-slate-400 dark:hover:text-slate-100"
            )}
          >
            {s} <span className="opacity-60">{counts[s]}</span>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50/60 dark:border-white/[0.05] dark:bg-white/[0.02]">
              {COLS.map((col) => {
                const active = sort.key === col.key;
                const Icon = active ? (sort.dir === 1 ? ArrowUp : ArrowDown) : ChevronsUpDown;
                return (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-2.5 first:pl-6 last:pr-6",
                      col.hide === "lg" && "hidden lg:table-cell",
                      col.hide === "xl" && "hidden xl:table-cell"
                    )}
                  >
                    <button
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        "group flex w-full items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] transition-colors",
                        col.align === "right" && "justify-end",
                        col.align === "center" && "justify-center",
                        active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                      )}
                    >
                      {col.label}
                      <Icon className={cn("h-3 w-3", !active && "opacity-35 group-hover:opacity-70")} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {slice.map((r, i) => (
              <tr
                key={r.id}
                className="animate-fade-in border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-white/[0.03] dark:hover:bg-white/[0.025]"
                style={{ animationDelay: `${i * 18}ms` }}
              >
                <td className="px-4 py-3 pl-6 font-mono text-[11px] font-medium text-slate-500 dark:text-slate-400">{r.id}</td>
                <td className="whitespace-nowrap px-4 py-3 text-[12px] tnum text-slate-600 dark:text-slate-300">{fmtMed(r.ts)}</td>
                <td className="px-4 py-3 text-[12px] font-medium text-slate-800 dark:text-slate-100">{LOC_NAME.get(r.locationId)}</td>
                <td className="hidden px-4 py-3 text-[12px] text-slate-500 dark:text-slate-400 lg:table-cell">{r.type}</td>
                <td className="hidden px-4 py-3 text-[12px] text-slate-500 dark:text-slate-400 xl:table-cell">{r.inspector}</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center justify-end gap-2">
                    <span className="hidden h-1 w-10 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10 sm:block">
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          r.score >= 88 ? "bg-emerald-500" : r.score >= 75 ? "bg-amber-500" : "bg-rose-500"
                        )}
                        style={{ width: `${r.score}%` }}
                      />
                    </span>
                    <span className="text-[12.5px] font-semibold tnum text-slate-800 dark:text-slate-100">{r.score}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-[12px] tnum text-slate-600 dark:text-slate-300">
                  {r.violations}
                  {r.critical > 0 && (
                    <span className="ml-1.5 rounded bg-rose-500/10 px-1 py-0.5 text-[9.5px] font-bold text-rose-600 dark:text-rose-400">
                      {r.critical}C
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset", STATUS_STYLE[r.status])}>
                    {r.status}
                  </span>
                </td>
                <td className="hidden px-4 py-3 pr-6 text-right text-[12px] tnum text-slate-500 dark:text-slate-400 lg:table-cell">
                  {r.resolvedDays == null ? "—" : `${r.resolvedDays}d`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {slice.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-14 text-slate-400 dark:text-slate-500">
            <Inbox className="h-6 w-6" />
            <p className="text-xs">No inspections match the current filters.</p>
          </div>
        )}
      </div>

      {/* pagination */}
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-white/[0.05] sm:px-6">
        <p className="text-[11px] tnum text-slate-400 dark:text-slate-500">
          {filtered.length === 0 ? "0" : `${cur * PAGE + 1}–${Math.min(filtered.length, (cur + 1) * PAGE)}`} of{" "}
          {filtered.length.toLocaleString()}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={cur === 0}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors enabled:hover:border-slate-300 enabled:hover:text-slate-800 disabled:opacity-35 dark:border-white/10 dark:text-slate-400 dark:enabled:hover:text-slate-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-14 text-center font-mono text-[11px] tnum text-slate-500 dark:text-slate-400">
            {cur + 1} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            disabled={cur >= pages - 1}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors enabled:hover:border-slate-300 enabled:hover:text-slate-800 disabled:opacity-35 dark:border-white/10 dark:text-slate-400 dark:enabled:hover:text-slate-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
