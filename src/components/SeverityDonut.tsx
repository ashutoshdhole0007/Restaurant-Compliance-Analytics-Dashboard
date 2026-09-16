import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SevSlice, fmtInt } from "../lib/analytics";
import { useChartColors } from "../lib/theme";
import { Card, ChartTip, SectionHead } from "./ui";

export default function SeverityDonut({ data }: { data: SevSlice[] }) {
  const c = useChartColors();
  const [active, setActive] = useState<number>(-1);
  const colors: Record<string, string> = { Minor: c.amber, Major: c.orange, Critical: c.rose };
  const total = data.reduce((a, d) => a + d.value, 0);
  const focus = active >= 0 ? data[active] : null;

  return (
    <Card className="flex h-full flex-col">
      <SectionHead overline="Risk mix" title="Violations by severity" sub="Hover segments for detail" />
      <div className="relative min-h-[200px] flex-1 px-2">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Tooltip content={<ChartTip />} />
            <Pie
              data={data} dataKey="value" nameKey="name"
              innerRadius={64} outerRadius={86}
              paddingAngle={3} cornerRadius={5}
              strokeWidth={0}
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(-1)}
              animationDuration={650}
            >
              {data.map((d, i) => (
                <Cell
                  key={d.name}
                  fill={colors[d.name]}
                  opacity={active === -1 || active === i ? 1 : 0.32}
                  style={{
                    transform: active === i ? "scale(1.045)" : "scale(1)",
                    transformOrigin: "center",
                    transformBox: "fill-box",
                    transition: "all .25s ease",
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* center readout */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-display text-[26px] font-bold leading-none tnum text-slate-900 dark:text-white">
            {fmtInt(focus ? focus.value : total)}
          </p>
          <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
            {focus ? focus.name : "Total"}
          </p>
        </div>
      </div>
      {/* legend */}
      <div className="grid grid-cols-3 gap-2 px-5 pb-4 pt-1">
        {data.map((d, i) => (
          <button
            key={d.name}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(-1)}
            className="rounded-xl border border-transparent px-2 py-1.5 text-left transition-colors hover:border-slate-200 hover:bg-slate-50 dark:hover:border-white/10 dark:hover:bg-white/[0.03]"
          >
            <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
              <span className="h-2 w-2 rounded-full" style={{ background: colors[d.name] }} />
              {d.name}
            </span>
            <span className="mt-0.5 block text-[13px] font-semibold tnum text-slate-800 dark:text-slate-100">
              {total ? ((d.value / total) * 100).toFixed(0) : 0}%
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
