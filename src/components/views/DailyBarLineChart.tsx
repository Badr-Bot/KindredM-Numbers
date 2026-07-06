"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatEur0, formatPct } from "@/lib/format";

export interface ChartPoint {
  label: string;
  caEur: number;
  marginPct: number | null;
}

const PHOSPHOR = "#33ff9c";
const CYAN = "#5fd6e0";
const INK_DIM = "#6f8a78";
const LINE = "#1c2620";

interface TooltipEntry {
  name?: string;
  value?: number | string;
  dataKey?: string | number;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const ca = payload.find((p) => p.dataKey === "caEur")?.value;
  const marge = payload.find((p) => p.dataKey === "marginPct")?.value;
  return (
    <div className="rounded border border-line bg-terminal/95 px-2.5 py-1.5 text-[11px] tnum shadow-lg">
      <div className="mb-0.5 font-semibold text-ink">{label}</div>
      <div className="text-phosphor">CA {typeof ca === "number" ? formatEur0(ca * 100) : "—"}</div>
      <div className="text-cyan">
        Marge {typeof marge === "number" ? formatPct(marge / 100) : "—"}
      </div>
    </div>
  );
}

export function DailyBarLineChart({ data }: { data: ChartPoint[] }) {
  const chartData = data.map((d) => ({
    label: d.label,
    caEur: Math.round(d.caEur),
    marginPct: d.marginPct === null ? null : Math.round(d.marginPct * 1000) / 10,
  }));

  return (
    <div className="h-56 w-full rounded-lg border border-line bg-panel/40 p-2 pr-3">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -8 }}>
          <CartesianGrid stroke={LINE} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: INK_DIM, fontSize: 9 }}
            tickLine={false}
            axisLine={{ stroke: LINE }}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis
            yAxisId="ca"
            tick={{ fill: INK_DIM, fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            width={38}
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : `${v}`)}
          />
          <YAxis
            yAxisId="marge"
            orientation="right"
            tick={{ fill: CYAN, fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            width={30}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(51,255,156,0.05)" }} />
          <Bar yAxisId="ca" dataKey="caEur" fill={PHOSPHOR} fillOpacity={0.28} radius={[2, 2, 0, 0]} maxBarSize={22} />
          <Line
            yAxisId="marge"
            dataKey="marginPct"
            stroke={CYAN}
            strokeWidth={2}
            dot={{ r: 2, fill: CYAN }}
            activeDot={{ r: 4 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
