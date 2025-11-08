
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { DateRange } from "react-day-picker"
import { addDays, format, subDays } from "date-fns"
import { Calendar as CalendarIcon, RefreshCw, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DiaryChart } from "@/components/diary-chart"
import { DiaryEntry } from "@/app/(app)/diary/page"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

interface UserData {
    initialDiagnosis?: string;
}

export default function HealthDashboardPage() {
    const [allEntries, setAllEntries] = useState<DiaryEntry[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<DiaryEntry[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState<UserData>({});

    const loadData = useCallback(() => {
        setIsLoading(true);
        const email = localStorage.getItem("currentUserEmail");
        if (email) {
            setCurrentUserEmail(email);
            const storedEntries = localStorage.getItem(`diaryEntries_${email}`);
            if (storedEntries) {
                const parsedEntries: DiaryEntry[] = JSON.parse(storedEntries);
                setAllEntries(parsedEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            }
            const storedUser = localStorage.getItem(`userData_${email}`);
            if (storedUser) {
                setUserData(JSON.parse(storedUser));
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    useEffect(() => {
        const handleFocus = () => {
            loadData();
        };
        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [loadData]);

    useEffect(() => {
        if (dateRange?.from && dateRange?.to) {
            const filtered = allEntries.filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate >= dateRange.from! && entryDate <= dateRange.to!;
            });
            setFilteredEntries(filtered);
        } else {
            setFilteredEntries(allEntries);
        }
    }, [dateRange, allEntries]);
    
    const setDatePreset = (preset: '30d' | '90d' | 'all') => {
        if (preset === 'all') {
            const firstDate = allEntries.length > 0 ? new Date(allEntries[0].date) : new Date();
            setDateRange({ from: firstDate, to: new Date() });
        } else {
            const days = preset === '30d' ? 29 : 89;
            setDateRange({ from: subDays(new Date(), days), to: new Date() });
        }
    }
    
    const diagnosis = userData?.initialDiagnosis?.toLowerCase() || "";
    const showFluidChart = diagnosis.includes("kidney") || diagnosis.includes("renal");
    const showBloodPressureCharts = diagnosis.includes("heart") || diagnosis.includes("cardiac") || diagnosis.includes("stroke") || diagnosis.includes("vascular") || diagnosis.includes("hypertension") || diagnosis.includes("kidney") || diagnosis.includes("renal");
    const showBloodSugarChart = diagnosis.includes("diabetes");


    if (isLoading) {
      return (
          <div className="flex justify-center items-center h-full p-6">
              <Loader2 className="h-8 w-8 animate-spin"/>
          </div>
      )
    }

    return (
        <div className="p-4 md:p-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                 <div>
                    <h1 className="text-3xl font-bold font-headline">Health Dashboard</h1>
                    <p className="text-muted-foreground">
                        Visualize your diary entries and track your progress over time.
                    </p>
                </div>
                 <div className="flex items-center gap-2">
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-[260px] justify-start text-left font-normal",
                                !dateRange && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                dateRange.to ? (
                                <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                </>
                                ) : (
                                format(dateRange.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date</span>
                            )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                    <Button variant="secondary" onClick={() => setDatePreset('30d')}>Last 30 days</Button>
                    <Button variant="secondary" onClick={() => setDatePreset('90d')}>Last 90 days</Button>
                    <Button variant="secondary" onClick={() => setDatePreset('all')}>All time</Button>
                     <Button variant="ghost" size="icon" onClick={loadData}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                 </div>
            </div>
            
            {filteredEntries.length > 1 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Overall Mood</CardTitle>
                            <CardDescription>Your general mood over the selected period.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DiaryChart data={filteredEntries} chartType="mood" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Pain Score</CardTitle>
                            <CardDescription>Your reported pain levels (0-10) over time.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DiaryChart data={filteredEntries} chartType="pain" />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Weight</CardTitle>
                            <CardDescription>Your weight (kg) over time.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DiaryChart data={filteredEntries} chartType="weight" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Sleep</CardTitle>
                            <CardDescription>Your sleep duration (hours) over time.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <DiaryChart data={filteredEntries} chartType="sleep" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Diagnosis Mood</CardTitle>
                            <CardDescription>How you felt about your diagnosis.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <DiaryChart data={filteredEntries} chartType="diagnosis" />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Treatment Mood</CardTitle>
                            <CardDescription>How you felt about your treatment.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <DiaryChart data={filteredEntries} chartType="treatment" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Calorie Intake</CardTitle>
                            <CardDescription>Your daily calorie intake (kcal).</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <DiaryChart data={filteredEntries} chartType="calories" />
                        </CardContent>
                    </Card>
                    {showFluidChart && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Fluid Intake</CardTitle>
                                <CardDescription>Your daily fluid intake (ml).</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DiaryChart data={filteredEntries} chartType="fluid" />
                            </CardContent>
                        </Card>
                    )}
                    {showBloodPressureCharts && (
                        <>
                        <Card>
                           <CardHeader>
                               <CardTitle>Systolic Blood Pressure</CardTitle>
                               <CardDescription>Your daily systolic readings (mmHg).</CardDescription>
                           </CardHeader>
                           <CardContent>
                               <DiaryChart data={filteredEntries} chartType="systolic" />
                           </CardContent>
                       </Card>
                        <Card>
                           <CardHeader>
                               <CardTitle>Diastolic Blood Pressure</CardTitle>
                               <CardDescription>Your daily diastolic readings (mmHg).</CardDescription>
                           </CardHeader>
                           <CardContent>
                               <DiaryChart data={filteredEntries} chartType="diastolic" />
                           </CardContent>
                       </Card>
                        <Card>
                           <CardHeader>
                               <CardTitle>Pulse</CardTitle>
                               <CardDescription>Your daily pulse readings (BPM).</CardDescription>
                           </CardHeader>
                           <CardContent>
                               <DiaryChart data={filteredEntries} chartType="pulse" />
                           </CardContent>
                       </Card>
                       </>
                    )}
                    {showBloodSugarChart && (
                         <Card>
                            <CardHeader>
                                <CardTitle>Blood Sugar</CardTitle>
                                <CardDescription>Your blood sugar readings (mmol/L).</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DiaryChart data={filteredEntries} chartType="bloodSugar" />
                            </CardContent>
                        </Card>
                    )}
                </div>
            ) : (
                 <div className="text-center py-20 rounded-lg border-2 border-dashed">
                    <h2 className="text-xl font-semibold">Not Enough Data</h2>
                    <p className="text-muted-foreground mt-2">
                        You need at least two diary entries in the selected date range to display charts.
                    </p>
                </div>
            )}
        </div>
    )
}
