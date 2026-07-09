"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "./design-system";

export function ScenarioProjectionChartInner({ data, title = "Scenario projection", description }: { data: Array<{ label: string; value: number }>; title?: string; description?: string }) {
  const safeData = data.length ? data : [{ label: "Now", value: 0 }];
  return (
    <Card className="p-5 transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted">{title}</p>
          {description ? <p className="mt-1 text-sm leading-6 text-muted">{description}</p> : null}
        </div>
      </div>
      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={safeData}>
            <defs>
              <linearGradient id="scenarioFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgb(37 99 235)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="rgb(37 99 235)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,.18)" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "rgb(100 116 139)", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "rgb(100 116 139)", fontSize: 12 }} />
            <Tooltip cursor={{ stroke: "rgba(37,99,235,.2)" }} />
            <Area type="monotone" dataKey="value" stroke="rgb(37 99 235)" strokeWidth={3} fill="url(#scenarioFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function BarComparisonChartInner({ title, leftLabel, rightLabel, leftValue, rightValue }: { title?: string; leftLabel: string; rightLabel: string; leftValue: number; rightValue: number }) {
  const total = Math.max(leftValue + rightValue, 1);
  const data = [
    { label: leftLabel, value: leftValue, fill: "rgb(37 99 235)" },
    { label: rightLabel, value: rightValue, fill: "rgb(124 58 237)" },
  ];
  return (
    <Card className="p-5 transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-lift">
      {title ? <p className="text-sm font-semibold text-muted">{title}</p> : null}
      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={32}>
            <CartesianGrid stroke="rgba(148,163,184,.18)" horizontal={false} />
            <XAxis type="number" hide domain={[0, total]} />
            <YAxis type="category" dataKey="label" width={90} tickLine={false} axisLine={false} tick={{ fill: "rgb(100 116 139)", fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[0, 999, 999, 0]}>
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
