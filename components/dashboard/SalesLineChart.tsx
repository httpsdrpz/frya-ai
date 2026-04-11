"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface SalesLineChartProps {
  data: Array<{
    label: string;
    value: number;
    count: number;
  }>;
}

export function SalesLineChart({ data }: SalesLineChartProps) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            minTickGap={24}
            tick={{ fill: "rgba(255,255,255,0.52)", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.52)", fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value)}
            tickLine={false}
            width={92}
          />
          <Tooltip
            contentStyle={{
              background: "#101010",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "18px",
              color: "#ffffff",
            }}
            cursor={{ stroke: "rgba(0,255,136,0.2)", strokeWidth: 1 }}
            formatter={(value, _name, payload) => {
              const numericValue =
                typeof value === "number"
                  ? value
                  : Number.parseFloat(String(value ?? 0));

              return [
                formatCurrency(Number.isFinite(numericValue) ? numericValue : 0),
                `${payload?.payload?.count ?? 0} vendas`,
              ];
            }}
            labelStyle={{ color: "rgba(255,255,255,0.65)" }}
          />
          <Line
            dataKey="value"
            dot={{ fill: "#00FF88", r: 3, stroke: "#00FF88" }}
            stroke="#00FF88"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
