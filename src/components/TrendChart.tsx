import { useState } from "react";
import {
  Area, Bar, CartesianGrid, ComposedChart, Line, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { SeriesPoint } from "../lib/analytics";
import { useChartColors } from "../lib/theme";
import { Card, ChartTip, LegendDot, SectionHead } from "./ui";
import { cn } from "../utils/cn";

export default function TrendChart({ data, betaLabel }: { data: SeriesPoint[]; betaLabel: string }) {
  const c = useChartColors();
  const [showViol, setShowViol] = useState(true);
  const [showMa, setShowMa] = useState(true);

  return (
    <Card className="flex h-full flex-col">
      <SectionHead
        overline="Trend analysis"
        title="Compliance score trajectory"
        sub={`${betaLabel} · aggregated across selected locations`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowViol((s) => !s)}
              className={cn(
                "rounded-lg border px-2 py-1 transition-all",
                showViol ? "border-rose-500/25 bg-rose-500/[0.06] dark:border-rose-400/20 dark:bg-rose-400/[0.08]" : "border-slate-200 opacity-45 dark:border-white/10"
              )}
            >
              <LegendDot color={c.rose} label="Violations" />
            </button>
            <button
              onClick={() => setShowMa((s) => !s)}
              className={cn(
                "rounded-lg border px-2 py-1 transition-all",
                showMa ? "border-indigo-500/25 bg-indigo-500/[0.06] dark:border-indigo-400/20 dark:bg-indigo-400/[0.08]" : "border-slate-200 opacity-45 dark:border-white/10"
              )}
            >
              <LegendDot color={c.indigo} label="Moving avg" />
            </button>
            <LegendDot color={c.emerald} label="Score" />
          </div>
        }
      />
      <div className="min-h-[290px] flex-1 px-2 pb-3 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -6 }} barCategoryGap="28%">
            <defs>
              <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.emerald} stopOpacity={0.32} />
                <stop offset="100%" stopColor={c.emerald} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={c.grid} vertical={false} />
            <XAxis
              dataKey="label" tickLine={false} axisLine={false} tick={{ fill: c.tick }}
              minTickGap={42} tickMargin={10}
            />
            <YAxis
              yAxisId="score" domain={[50, 100]} tickLine={false} axisLine={false}
              tick={{ fill: c.tick }} tickCount={6} width={38}
            />
            <YAxis yAxisId="viol" orientation="right" hide domain={[0, "dataMax + 14"]} />
            <Tooltip
              content={<ChartTip />}
              cursor={{ stroke: c.tick, strokeOpacity: 0.3, strokeDasharray: "4 4" }}
              position={{ y: 4 }}
            />
            <ReferenceLine
              yAxisId="score" y={90} stroke={c.target} strokeDasharray="5 5" strokeOpacity={0.7}
              label={{
                value: "Target 90", position: "insideTopLeft", fontSize: 10,
                fill: c.tick, fontFamily: "IBM Plex Mono", letterSpacing: 1,
              }}
            />
            {showViol && (
              <Bar yAxisId="viol" dataKey="violations" name="Violations" fill={c.rose}
                fillOpacity={0.28} radius={[3, 3, 0, 0]} maxBarSize={16} animationDuration={650} />
            )}
            <Area
              yAxisId="score" type="monotone" dataKey="score" name="Compliance score"
              stroke={c.emerald} strokeWidth={2.4} fill="url(#scoreFill)"
              dot={false} activeDot={{ r: 4.5, strokeWidth: 2, stroke: c.dark ? "#0a0e13" : "#fff" }}
              animationDuration={650}
            />
            {showMa && (
              <Line
                yAxisId="score" type="monotone" dataKey="ma" name="Moving average"
                stroke={c.indigo} strokeWidth={1.6} strokeDasharray="1 0" dot={false}
                activeDot={{ r: 3.5, strokeWidth: 2, stroke: c.dark ? "#0a0e13" : "#fff" }}
                animationDuration={650}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
