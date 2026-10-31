"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FounderInsights } from "@/lib/actions/insights";

const GREEN = "#1d9a52";
const BLUE = "#0284c7";
const VIOLET = "#7c3aed";
const AMBER = "#d97706";

const axis = { tick: { fontSize: 10, fill: "currentColor" }, tickLine: false, axisLine: false, className: "text-muted-foreground" } as const;
const tooltip = {
  contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 },
  labelStyle: { color: "var(--foreground)" },
} as const;

function Card({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4 bg-muted/50">
      <p className="text-sm font-semibold">{title}</p>
      {note && <p className="mt-0.5 text-[13px] text-muted-foreground">{note}</p>}
      <div className="mt-3 h-56">{children}</div>
    </div>
  );
}

function Grid() {
  return <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.4} vertical={false} />;
}

export function ActivityChart({ data }: { data: FounderInsights["daily"] }) {
  return (
    <Card title="Daily activity" note="Learners active and lessons completed each day, last 30 days">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Grid />
          <XAxis dataKey="date" {...axis} interval={4} />
          <YAxis {...axis} allowDecimals={false} width={28} />
          <Tooltip {...tooltip} />
          <Area type="monotone" dataKey="lessons" name="Lessons completed" stroke={BLUE} fill={BLUE} fillOpacity={0.12} strokeWidth={2} />
          <Area type="monotone" dataKey="active" name="Active learners" stroke={GREEN} fill={GREEN} fillOpacity={0.15} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function SignupsChart({ data }: { data: FounderInsights["daily"] }) {
  return (
    <Card title="New signups" note="Accounts created each day, last 30 days">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <Grid />
          <XAxis dataKey="date" {...axis} interval={4} />
          <YAxis {...axis} allowDecimals={false} width={28} />
          <Tooltip {...tooltip} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="signups" name="Signups" fill={AMBER} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function FunnelChart({ data }: { data: FounderInsights["funnel"] }) {
  return (
    <Card title="Chapter funnel" note="Learners who finished each chapter. Purple chapters need Pro.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <Grid />
          <XAxis dataKey="chapter" {...axis} />
          <YAxis {...axis} allowDecimals={false} width={28} />
          <Tooltip
            {...tooltip}
            cursor={{ fill: "var(--muted)" }}
            labelFormatter={(_, p) => (p?.[0]?.payload ? `Chapter ${p[0].payload.chapter}: ${p[0].payload.title}` : "")}
          />
          <Bar dataKey="finished" name="Finished" radius={[3, 3, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.chapter} fill={d.pro ? VIOLET : GREEN} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function StreakChart({ data }: { data: FounderInsights["streaks"] }) {
  return (
    <Card title="Current streaks" note="How many learners are on each streak length (days)">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <Grid />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} allowDecimals={false} width={28} />
          <Tooltip {...tooltip} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="learners" name="Learners" fill="#ea580c" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
