import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { CatRow } from "../lib/analytics";
import { useChartColors } from "../lib/theme";
import { Card, ChartTip, LegendDot, SectionHead } from "./ui";

const SHORT: Record<string, string> = {
  "Food Handling": "Food",
  "Temperature Control": "Temp",
  "Sanitation": "Sanit",
  "Documentation": "Docs",
  "Staff Hygiene": "Hygiene",
  "Equipment": "Equip",
  "Pest Control": "Pest",
};

export default function CategoryBars({ data }: { data: CatRow[] }) {
  const c = useChartColors();
  const shaped = data.map((d) => ({ ...d, short: SHORT[d.name] ?? d.name }));

  return (
    <Card className="flex h-full flex-col">
      <SectionHead
        overline="Category breakdown"
        title="Violations by regulation area"
        sub="Stacked by severity · selected period"
        actions={
          <div className="flex items-center gap-3">
            <LegendDot color={c.amber} label="Minor" />
            <LegendDot color={c.orange} label="Major" />
            <LegendDot color={c.rose} label="Critical" />
          </div>
        }
      />
      <div className="min-h-[250px] flex-1 px-2 pb-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={shaped} margin={{ top: 12, right: 12, bottom: 0, left: -14 }} barCategoryGap="30%">
            <CartesianGrid stroke={c.grid} vertical={false} />
            <XAxis dataKey="short" tickLine={false} axisLine={false} tick={{ fill: c.tick }} tickMargin={10} interval={0} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: c.tick }} allowDecimals={false} />
            <Tooltip content={<ChartTip />} cursor={{ fill: c.grid, opacity: 0.5 }} />
            <Bar dataKey="minor" name="Minor" stackId="s" fill={c.amber} fillOpacity={0.92} animationDuration={650} />
            <Bar dataKey="major" name="Major" stackId="s" fill={c.orange} fillOpacity={0.92} animationDuration={650} />
            <Bar dataKey="critical" name="Critical" stackId="s" fill={c.rose} radius={[4, 4, 0, 0]} maxBarSize={42} animationDuration={650} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
