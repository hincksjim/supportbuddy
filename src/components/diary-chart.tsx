
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
    label: "Overall",
    color: "hsl(var(--chart-1))",
  },
  diagnosisMood: {
    label: "Diagnosis",
    color: "hsl(var(--chart-2))",
  },
  treatmentMood: {
    label: "Treatment",
    color: "hsl(var(--chart-3))",
  },
  weight: {
    label: "Weight (kg)",
    color: "hsl(var(--chart-4))",
  },
  sleep: {
    label: "Sleep (hrs)",
    color: "hsl(var(--chart-5))",
  }
} satisfies ChartConfig

export function DiaryChart({ data, chartType }: { data: DiaryEntry[], chartType: 'mood' | 'weight' | 'sleep' }) {
  const chartData = React.useMemo(() => {
    return data
      .map(entry => ({
        date: new Date(entry.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        overallMood: entry.mood ? moodToValue[entry.mood] : null,
        diagnosisMood: entry.diagnosisMood ? moodToValue[entry.diagnosisMood] : null,
        treatmentMood: entry.treatmentMood ? moodToValue[entry.treatmentMood] : null,
        weight: entry.weight ? parseFloat(entry.weight) : null,
        sleep: entry.sleep ? parseFloat(entry.sleep) : null,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data])

  const yAxisDomain = React.useMemo(() => {
    switch (chartType) {
        case 'mood':
            return [1, 5];
        case 'weight':
            return ['dataMin - 5', 'dataMax + 5'];
        case 'sleep':
            return [0, 'dataMax + 2'];
        default:
            return [0, 'auto'];
    }
  }, [chartType]);
  

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
          domain={yAxisDomain}
          allowDecimals={chartType !== 'mood'}
          />
        <Tooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Legend />
        {chartType === 'mood' && (
            <>
                <Line
                    dataKey="overallMood"
                    name="Overall"
                    type="monotone"
                    stroke="var(--color-overallMood)"
                    strokeWidth={2}
                    dot={true}
                    connectNulls
                />
                <Line
                    dataKey="diagnosisMood"
                    name="Diagnosis"
                    type="monotone"
                    stroke="var(--color-diagnosisMood)"
                    strokeWidth={2}
                    dot={true}
                    connectNulls
                />
                <Line
                    dataKey="treatmentMood"
                    name="Treatment"
                    type="monotone"
                    stroke="var(--color-treatmentMood)"
                    strokeWidth={2}
                    dot={true}
                    connectNulls
                />
            </>
        )}
        {chartType === 'weight' && (
             <Line
              dataKey="weight"
              name="Weight"
              type="monotone"
              stroke="var(--color-weight)"
              strokeWidth={2}
              dot={true}
              connectNulls
            />
        )}
        {chartType === 'sleep' && (
             <Line
              dataKey="sleep"
              name="Sleep"
              type="monotone"
              stroke="var(--color-sleep)"
              strokeWidth={2}
              dot={true}
              connectNulls
            />
        )}
      </LineChart>
    </ChartContainer>
  )
}
