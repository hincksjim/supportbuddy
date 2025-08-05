
"use client"

import * as React from "react"
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Dot,
} from "recharts"

import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { DiaryEntry } from "@/app/(app)/diary/page"

const moodToValue = {
  great: 5,
  good: 4,
  meh: 3,
  bad: 2,
  awful: 1,
}

const chartConfig = {
  overallMood: {
    label: "Overall Mood",
    color: "hsl(var(--chart-1))",
  },
  diagnosisMood: {
    label: "Diagnosis Mood",
    color: "hsl(var(--chart-2))",
  },
  treatmentMood: {
    label: "Treatment Mood",
    color: "hsl(var(--chart-3))",
  },
  weight: {
    label: "Weight (kg)",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

export function DiaryChart({ data }: { data: DiaryEntry[] }) {
  const chartData = React.useMemo(() => {
    return data
      .map(entry => ({
        date: new Date(entry.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        overallMood: entry.mood ? moodToValue[entry.mood] : null,
        diagnosisMood: entry.diagnosisMood ? moodToValue[entry.diagnosisMood] : null,
        treatmentMood: entry.treatmentMood ? moodToValue[entry.treatmentMood] : null,
        weight: entry.weight ? parseFloat(entry.weight) : null,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data])

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <LineChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 6)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          domain={[0, 'dataMax + 10']}
          />
        <Tooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Legend />
        <Line
          dataKey="overallMood"
          type="monotone"
          stroke="var(--color-overallMood)"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
        <Line
          dataKey="diagnosisMood"
          type="monotone"
          stroke="var(--color-diagnosisMood)"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
        <Line
          dataKey="treatmentMood"
          type="monotone"
          stroke="var(--color-treatmentMood)"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
         <Line
          dataKey="weight"
          type="monotone"
          stroke="var(--color-weight)"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
      </LineChart>
    </ChartContainer>
  )
}
