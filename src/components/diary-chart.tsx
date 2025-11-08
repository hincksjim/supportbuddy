
"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Dot } from "recharts"

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
  diagnosisMood: {
    label: "Diagnosis Mood",
    color: "hsl(var(--chart-2))",
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
  },
  calories: {
    label: "Calories (kcal)",
    color: "hsl(var(--chart-3))",
  },
  fluidIntake: {
    label: "Fluid Intake (ml)",
    color: "hsl(var(--chart-1))",
  },
  bloodPressureSys: {
    label: "Systolic",
    color: "hsl(var(--chart-4))",
  },
  bloodPressureDia: {
      label: "Diastolic",
      color: "hsl(var(--chart-5))",
  },
  pulse: {
      label: "Pulse (BPM)",
      color: "hsl(var(--chart-1))",
  },
  bloodSugar: {
    label: "Blood Sugar (mmol/L)",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

const getStatusColor = (value: number, type: 'systolic' | 'diastolic' | 'pulse') => {
    if (type === 'systolic') {
        if (value < 120) return 'hsl(var(--chart-2))'; // Green
        if (value >= 120 && value <= 139) return 'hsl(var(--chart-4))'; // Amber
        return 'hsl(var(--chart-1))'; // Red
    }
    if (type === 'diastolic') {
        if (value < 80) return 'hsl(var(--chart-2))'; // Green
        if (value >= 80 && value <= 89) return 'hsl(var(--chart-4))'; // Amber
        return 'hsl(var(--chart-1))'; // Red
    }
    if (type === 'pulse') {
        if (value >= 60 && value <= 100) return 'hsl(var(--chart-2))'; // Green
        if (value < 60) return 'hsl(var(--chart-4))'; // Amber
        return 'hsl(var(--chart-1))'; // Red
    }
    return 'hsl(var(--foreground))';
};

const CustomDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;
    
    let color;
    if (dataKey === 'bloodPressureSystolic') {
        color = getStatusColor(payload.bloodPressureSystolic, 'systolic');
    } else if (dataKey === 'bloodPressureDiastolic') {
        color = getStatusColor(payload.bloodPressureDiastolic, 'diastolic');
    } else if (dataKey === 'pulse') {
        color = getStatusColor(payload.pulse, 'pulse');
    }

    if (color) {
        return <Dot cx={cx} cy={cy} r={4} fill={color} stroke={color} />;
    }

    return <Dot {...props} />;
};


export function DiaryChart({ data, chartType }: { data: DiaryEntry[], chartType: 'mood' | 'weight' | 'sleep' | 'pain' | 'treatment' | 'diagnosis' | 'calories' | 'fluid' | 'bloodPressure' | 'bloodSugar' }) {
  const chartData = React.useMemo(() => {
    return data
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(entry => ({
        date: new Date(entry.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        overallMood: entry.mood ? moodToValueMap[entry.mood] : null,
        treatmentMood: entry.treatmentMood ? moodToValueMap[entry.treatmentMood] : null,
        diagnosisMood: entry.diagnosisMood ? moodToValueMap[entry.diagnosisMood] : null,
        pain: entry.painScore,
        weight: entry.weight ? parseFloat(entry.weight) : null,
        sleep: entry.sleep ? parseFloat(entry.sleep) : null,
        calories: entry.foodIntake?.reduce((acc, meal) => acc + (meal.calories || 0), 0) || null,
        fluidIntake: entry.fluidIntake ? parseInt(entry.fluidIntake) : null,
        bloodPressureSystolic: entry.bloodPressureSystolic ? parseInt(entry.bloodPressureSystolic) : null,
        bloodPressureDiastolic: entry.bloodPressureDiastolic ? parseInt(entry.bloodPressureDiastolic) : null,
        pulse: entry.pulse ? parseInt(entry.pulse) : null,
        bloodSugar: entry.bloodSugar ? parseFloat(entry.bloodSugar) : null,
      }));
  }, [data]);

  
  const yAxisDomain = React.useMemo(() => {
    switch (chartType) {
        case 'mood':
        case 'treatment':
        case 'diagnosis':
            return [1, 5];
        case 'pain':
            return [0, 10];
        case 'weight': {
            const weights = chartData.map(d => d.weight).filter(w => w !== null && !isNaN(w)) as number[];
            if (weights.length === 0) return [0, 100];
            const minWeight = Math.min(...weights);
            const maxWeight = Math.max(...weights);
            return [Math.floor(minWeight - 5), Math.ceil(maxWeight + 5)];
        }
        case 'sleep': {
            const sleeps = chartData.map(d => d.sleep).filter(s => s !== null && !isNaN(s)) as number[];
             if (sleeps.length === 0) return [0, 12];
            return [0, Math.ceil(Math.max(...sleeps) + 2)];
        }
        case 'calories': {
            const calories = chartData.map(d => d.calories).filter(c => c !== null && !isNaN(c)) as number[];
            if (calories.length === 0) return [0, 3000];
            return [0, Math.ceil(Math.max(...calories) / 500) * 500]; // Round up to nearest 500
        }
        case 'fluid': {
            const fluids = chartData.map(d => d.fluidIntake).filter(f => f !== null && !isNaN(f)) as number[];
            if (fluids.length === 0) return [0, 'auto'];
            const maxVal = Math.max(...fluids);
            return [0, Math.ceil(maxVal / 500) * 500];
        }
        case 'bloodPressure': {
             const pressures = chartData.flatMap(d => [d.bloodPressureSystolic, d.bloodPressureDiastolic, d.pulse]).filter(p => p !== null && !isNaN(p)) as number[];
            if (pressures.length === 0) return [40, 'auto'];
            const maxVal = Math.max(...pressures);
            return [40, Math.ceil(maxVal / 10) * 10];
        }
        case 'bloodSugar': {
             const sugars = chartData.map(d => d.bloodSugar).filter(s => s !== null && !isNaN(s)) as number[];
            if (sugars.length === 0) return [0, 'auto'];
            const maxVal = Math.max(...sugars);
            return [0, Math.ceil(maxVal + 2)];
        }
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
                allowDecimals={chartType !== 'mood' && chartType !== 'treatment' && chartType !== 'diagnosis'}
                ticks={chartType === 'mood' || chartType === 'treatment' || chartType === 'diagnosis' ? [1, 2, 3, 4, 5] : (chartType === 'pain' ? [0, 2, 4, 6, 8, 10] : undefined) }
                tickFormatter={(value) => {
                    if (chartType === 'mood' || chartType === 'treatment' || chartType === 'diagnosis') {
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
             {chartType === 'diagnosis' && (
                <Line
                    dataKey="diagnosisMood"
                    name="Diagnosis Mood"
                    type="monotone"
                    stroke="var(--color-diagnosisMood)"
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
            {chartType === 'calories' && (
                <Line
                    dataKey="calories"
                    name="Calories (kcal)"
                    type="monotone"
                    stroke="var(--color-calories)"
                    strokeWidth={2}
                    dot={true}
                    connectNulls
                />
            )}
            {chartType === 'fluid' && (
                <Line
                    dataKey="fluidIntake"
                    name="Fluid Intake (ml)"
                    type="monotone"
                    stroke="var(--color-fluidIntake)"
                    strokeWidth={2}
                    dot={true}
                    connectNulls
                />
            )}
            {chartType === 'bloodPressure' && (
                <>
                    <Line
                        dataKey="bloodPressureSystolic"
                        name="Systolic"
                        type="monotone"
                        stroke="var(--color-bloodPressureSys)"
                        strokeWidth={2}
                        dot={<CustomDot />}
                        activeDot={<CustomDot />}
                        connectNulls
                    />
                     <Line
                        dataKey="bloodPressureDiastolic"
                        name="Diastolic"
                        type="monotone"
                        stroke="var(--color-bloodPressureDia)"
                        strokeWidth={2}
                        dot={<CustomDot />}
                        activeDot={<CustomDot />}
                        connectNulls
                    />
                     <Line
                        dataKey="pulse"
                        name="Pulse (BPM)"
                        type="monotone"
                        stroke="var(--color-pulse)"
                        strokeWidth={2}
                        dot={<CustomDot />}
                        activeDot={<CustomDot />}
                        connectNulls
                    />
                </>
            )}
            {chartType === 'bloodSugar' && (
                <Line
                    dataKey="bloodSugar"
                    name="Blood Sugar"
                    type="monotone"
                    stroke="var(--color-bloodSugar)"
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
