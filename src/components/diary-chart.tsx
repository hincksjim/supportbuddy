
"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Dot } from "recharts"

import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { DiaryEntry } from "@/app/(app)/diary/page"
import { cn } from "@/lib/utils"

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
  fluid: {
    label: "Fluid Intake (ml)",
    color: "hsl(var(--chart-1))",
  },
  systolic: {
    label: "Systolic",
    color: "hsl(var(--chart-4))",
  },
  diastolic: {
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
  wbc: { label: "WBC (x10⁹/L)", color: "hsl(var(--chart-1))" },
  neutrophils: { label: "Neutrophils (x10⁹/L)", color: "hsl(var(--chart-2))" },
  rbc: { label: "RBC (x10¹²/L)", color: "hsl(var(--chart-3))" },
  hemoglobin: { label: "Hemoglobin (g/dL)", color: "hsl(var(--chart-4))" },
  platelets: { label: "Platelets (x10⁹/L)", color: "hsl(var(--chart-5))" },
  creatinine: { label: "Creatinine (mg/dL)", color: "hsl(var(--chart-1))" },
  egfr: { label: "eGFR", color: "hsl(var(--chart-2))" },
  alt: { label: "ALT (U/L)", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

type StatusType = 'systolic' | 'diastolic' | 'pulse';

const getStatusInfo = (value: number, type: StatusType): { text: string; color: string } => {
    const colors = {
        green: "text-green-600 dark:text-green-500",
        amber: "text-yellow-600 dark:text-yellow-500",
        red: "text-red-600 dark:text-red-500",
    };

    if (type === 'systolic') {
        if (value < 120) return { text: 'Normal', color: colors.green };
        if (value <= 139) return { text: 'Elevated', color: colors.amber };
        return { text: 'High', color: colors.red };
    }
    if (type === 'diastolic') {
        if (value < 80) return { text: 'Normal', color: colors.green };
        if (value <= 89) return { text: 'Elevated', color: colors.amber };
        return { text: 'High', color: colors.red };
    }
    // pulse
    if (value >= 60 && value <= 100) return { text: 'Normal', color: colors.green };
    if (value < 60) return { text: 'Low', color: colors.amber };
    return { text: 'High', color: colors.red };
};


const getDotColor = (value: number, type: StatusType) => {
    if (type === 'systolic') {
        if (value < 120) return 'hsl(var(--chart-2))'; // Green
        if (value <= 139) return 'hsl(var(--chart-4))'; // Amber
        return 'hsl(var(--chart-1))'; // Red
    }
    if (type === 'diastolic') {
        if (value < 80) return 'hsl(var(--chart-2))'; // Green
        if (value <= 89) return 'hsl(var(--chart-4))'; // Amber
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
    const value = payload[dataKey];
    
    if (value === null || typeof value === 'undefined') return null;

    let color;
    if (dataKey === 'systolic') {
        color = getDotColor(value, 'systolic');
    } else if (dataKey === 'diastolic') {
        color = getDotColor(value, 'diastolic');
    } else if (dataKey === 'pulse') {
        color = getDotColor(value, 'pulse');
    }

    if (color) {
        return <Dot cx={cx} cy={cy} r={4} fill={color} stroke={color} />;
    }

    return <Dot {...props} />;
};


export function DiaryChart({ data, chartType }: { data: DiaryEntry[], chartType: keyof typeof chartConfig }) {
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
        fluid: entry.fluidIntake ? parseInt(entry.fluidIntake) : null,
        systolic: entry.bloodPressureSystolic ? parseInt(entry.bloodPressureSystolic) : null,
        diastolic: entry.bloodPressureDiastolic ? parseInt(entry.bloodPressureDiastolic) : null,
        pulse: entry.pulse ? parseInt(entry.pulse) : null,
        bloodSugar: entry.bloodSugar ? parseFloat(entry.bloodSugar) : null,
        wbc: entry.bloodWBC ? parseFloat(entry.bloodWBC) : null,
        neutrophils: entry.bloodNeutrophils ? parseFloat(entry.bloodNeutrophils) : null,
        rbc: entry.bloodRBC ? parseFloat(entry.bloodRBC) : null,
        hemoglobin: entry.bloodHemoglobin ? parseFloat(entry.bloodHemoglobin) : null,
        platelets: entry.bloodPlatelets ? parseInt(entry.bloodPlatelets) : null,
        creatinine: entry.kidneyCreatinine ? parseFloat(entry.kidneyCreatinine) : null,
        egfr: entry.kidneyEGFR ? parseInt(entry.kidneyEGFR) : null,
        alt: entry.liverALT ? parseInt(entry.liverALT) : null,
      }));
  }, [data]);

  
  const yAxisDomain = React.useMemo(() => {
    const getDomain = (key: keyof typeof chartData[0], defaultMin: number, defaultMax: number | 'auto', buffer: number = 5, roundTo: number = 1) => {
        const values = chartData.map(d => d[key]).filter(v => v !== null && !isNaN(v as number)) as number[];
        if (values.length === 0) return [defaultMin, defaultMax];
        const min = Math.min(...values);
        const max = Math.max(...values);
        const lower = Math.floor((min - buffer) / roundTo) * roundTo;
        const upper = Math.ceil((max + buffer) / roundTo) * roundTo;
        return [lower < 0 ? 0 : lower, upper];
    };

    switch (chartType) {
        case 'mood':
        case 'treatmentMood':
        case 'diagnosisMood':
            return [1, 5];
        case 'pain':
            return [0, 10];
        case 'weight': return getDomain('weight', 0, 'auto', 5, 5);
        case 'sleep': return getDomain('sleep', 0, 12, 2, 1);
        case 'calories': return getDomain('calories', 0, 3000, 500, 500);
        case 'fluid': return getDomain('fluid', 0, 'auto', 500, 500);
        case 'systolic':
        case 'diastolic':
        case 'pulse':
            return getDomain(chartType, 40, 'auto', 10, 10);
        case 'bloodSugar': return getDomain('bloodSugar', 0, 'auto', 2, 1);
        case 'wbc': return getDomain('wbc', 0, 'auto', 2, 1);
        case 'neutrophils': return getDomain('neutrophils', 0, 'auto', 2, 1);
        case 'rbc': return getDomain('rbc', 0, 'auto', 1, 0.5);
        case 'hemoglobin': return getDomain('hemoglobin', 0, 'auto', 2, 1);
        case 'platelets': return getDomain('platelets', 0, 'auto', 50, 50);
        case 'creatinine': return getDomain('creatinine', 0, 'auto', 0.5, 0.1);
        case 'egfr': return getDomain('egfr', 0, 'auto', 10, 10);
        case 'alt': return getDomain('alt', 0, 'auto', 10, 10);
        default:
            return [0, 'auto'];
    }
  }, [chartType, chartData]);

  const latestReading = React.useMemo(() => {
    if (chartType !== 'systolic' && chartType !== 'diastolic' && chartType !== 'pulse') return null;
    
    const lastEntryWithValue = [...chartData].reverse().find(d => d[chartType] !== null && typeof d[chartType] !== 'undefined');
    if (!lastEntryWithValue) return null;

    const value = lastEntryWithValue[chartType] as number;
    return {
        value,
        ...getStatusInfo(value, chartType),
    };
  }, [chartData, chartType]);
  
  return (
    <div className="relative">
      {latestReading && (
        <div className="absolute top-0 right-0 p-2 text-right">
            <p className="text-xs text-muted-foreground">Latest Reading</p>
            <p className={cn("text-lg font-bold", latestReading.color)}>{latestReading.value}</p>
            <p className={cn("text-sm font-semibold", latestReading.color)}>{latestReading.text}</p>
        </div>
      )}
      <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
        <ResponsiveContainer>
          <LineChart
              data={chartData}
              margin={{
              top: 20,
              right: latestReading ? 80 : 20, // Make space for the status text
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
                      if (chartType === 'mood' || chartType === 'treatmentMood' || chartType === 'diagnosisMood') {
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
              {Object.keys(chartConfig).map((key) => {
                if(chartType === key) {
                  return (
                    <Line
                      key={key}
                      dataKey={key}
                      name={chartConfig[key as keyof typeof chartConfig].label}
                      type="monotone"
                      stroke={`var(--color-${key})`}
                      strokeWidth={2}
                      dot={key === 'systolic' || key === 'diastolic' || key === 'pulse' ? <CustomDot /> : true}
                      activeDot={key === 'systolic' || key === 'diastolic' || key === 'pulse' ? <CustomDot /> : undefined}
                      connectNulls
                    />
                  )
                }
                return null;
              })}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
