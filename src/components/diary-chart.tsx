
"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
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
} as const;

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
      .sort((a, b) => {
        // We need to convert back to a sortable date format
        const dateA = new Date(a.date.split('/').reverse().join('-'));
        const dateB = new Date(b.date.split('/').reverse().join('-'));
        return dateA.getTime() - dateB.getTime();
      });
  }, [data]);
  
  const yAxisDomain = React.useMemo(() => {
    switch (chartType) {
        case 'mood':
            return [1, 5];
        case 'weight':
            const weights = chartData.map(d => d.weight).filter(w => w !== null) as number[];
            if (weights.length === 0) return [0, 100];
            return [Math.min(...weights) - 5, Math.max(...weights) + 5];
        case 'sleep':
            const sleeps = chartData.map(d => d.sleep).filter(s => s !== null) as number[];
            if (sleeps.length === 0) return [0, 12];
            return [0, Math.max(...sleeps) + 2];
        default:
            return [0, 'auto'];
    }
  }, [chartType, chartData]);
  
  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <ResponsiveContainer>
        <LineChart
            data={chartData}
            margin={{
            top: 5,
            right: 20,
            left: -10,
            bottom: 5,
            }}
        >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
            />
            <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={yAxisDomain}
                allowDecimals={chartType !== 'mood'}
                ticks={chartType === 'mood' ? [1, 2, 3, 4, 5] : undefined}
                tickFormatter={(value) => {
                    if (chartType === 'mood') {
                        const moodMap = { 1: 'Awful', 2: 'Bad', 3: 'Meh', 4: 'Good', 5: 'Great' };
                        return moodMap[value as keyof typeof moodMap] || value;
                    }
                    return value;
                }}
            />
            <Tooltip
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
                    name="Weight (kg)"
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
                    name="Sleep (hrs)"
                    type="monotone"
                    stroke="var(--color-sleep)"
                    strokeWidth={2}
                    dot={true}
                    connectNulls
                />
            )}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
