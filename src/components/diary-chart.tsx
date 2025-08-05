
"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"

import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { DiaryEntry } from "@/app/(app)/diary/page"

const moodToValueMap = {
  great: 5,
  good: 4,
  meh: 3,
  bad: 2,
  awful: 1,
} as const;


const chartConfig = {
  overallMood: {
    label: "Overall Mood",
    color: "hsl(var(--chart-1))",
  },
  treatmentMood: {
    label: "Treatment Mood",
    color: "hsl(var(--chart-3))",
  },
  pain: {
    label: "Pain Score",
    color: "hsl(var(--chart-4))",
  },
  weight: {
    label: "Weight (kg)",
    color: "hsl(var(--chart-2))",
  },
  sleep: {
    label: "Sleep (hrs)",
    color: "hsl(var(--chart-5))",
  }
} satisfies ChartConfig

export function DiaryChart({ data, chartType }: { data: DiaryEntry[], chartType: 'mood' | 'weight' | 'sleep' | 'pain' | 'treatment' }) {
  const chartData = React.useMemo(() => {
    return data
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(entry => ({
        date: new Date(entry.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        overallMood: entry.mood ? moodToValueMap[entry.mood] : null,
        treatmentMood: entry.treatmentMood ? moodToValueMap[entry.treatmentMood] : null,
        pain: entry.painScore,
        weight: entry.weight ? parseFloat(entry.weight) : null,
        sleep: entry.sleep ? parseFloat(entry.sleep) : null,
      }));
  }, [data]);

  
  const yAxisDomain = React.useMemo(() => {
    switch (chartType) {
        case 'mood':
        case 'treatment':
            return [1, 5];
        case 'pain':
            return [0, 10];
        case 'weight':
            const weights = chartData.map(d => d.weight).filter(w => w !== null) as number[];
            if (weights.length === 0) return [0, 100];
            const minWeight = Math.min(...weights);
            const maxWeight = Math.max(...weights);
            return [Math.floor(minWeight - 5), Math.ceil(maxWeight + 5)];
        case 'sleep':
            const sleeps = chartData.map(d => d.sleep).filter(s => s !== null) as number[];
             if (sleeps.length === 0) return [0, 12];
            return [0, Math.ceil(Math.max(...sleeps) + 2)];
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
                allowDecimals={chartType !== 'mood' && chartType !== 'treatment'}
                ticks={chartType === 'mood' || chartType === 'treatment' ? [1, 2, 3, 4, 5] : (chartType === 'pain' ? [0, 2, 4, 6, 8, 10] : undefined) }
                tickFormatter={(value) => {
                    if (chartType === 'mood' || chartType === 'treatment') {
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
                <Line
                    dataKey="overallMood"
                    name="Overall Mood"
                    type="monotone"
                    stroke="var(--color-overallMood)"
                    strokeWidth={2}
                    dot={true}
                    connectNulls
                />
            )}
             {chartType === 'treatment' && (
                <Line
                    dataKey="treatmentMood"
                    name="Treatment Mood"
                    type="monotone"
                    stroke="var(--color-treatmentMood)"
                    strokeWidth={2}
                    dot={true}
                    connectNulls
                />
            )}
             {chartType === 'pain' && (
                <Line
                    dataKey="pain"
                    name="Pain"
                    type="monotone"
                    stroke="var(--color-pain)"
                    strokeWidth={2}
                    dot={true}
                    connectNulls
                />
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
