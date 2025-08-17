
"use client"

import { useState, useEffect, useMemo } from "react";
import { group } from "console";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { DiaryEntry } from "@/app/(app)/diary/page";
import { generateWeeklyDiarySummary } from "@/ai/flows/generate-weekly-diary-summary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { marked } from "marked";

interface WeeklySummaryProps {
    entries: DiaryEntry[];
    currentUserEmail: string | null;
}

interface WeeklySummaryData {
    [weekKey: string]: {
        summary: string;
        fingerprint: string;
    };
}

const getWeekKey = (date: Date) => {
    const year = date.getFullYear();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const weekNumber = Math.ceil(((startOfWeek.getTime() - new Date(year, 0, 1).getTime()) / 86400000) / 7);
    return `${year}-W${weekNumber}`;
}

const createFingerprint = (entries: DiaryEntry[]) => {
    return JSON.stringify(entries.map(e => ({ id: e.id, mood: e.mood, painScore: e.painScore, worriedAbout: e.worriedAbout, positiveAbout: e.positiveAbout })));
}


export function WeeklyDiarySummary({ entries, currentUserEmail }: WeeklySummaryProps) {
    const [summaries, setSummaries] = useState<WeeklySummaryData>({});
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!currentUserEmail) return;
        const storedSummaries = localStorage.getItem(`weeklyDiarySummaries_${currentUserEmail}`);
        if (storedSummaries) {
            setSummaries(JSON.parse(storedSummaries));
        }
    }, [currentUserEmail]);

    const saveSummaries = (newSummaries: WeeklySummaryData) => {
        if (!currentUserEmail) return;
        setSummaries(newSummaries);
        localStorage.setItem(`weeklyDiarySummaries_${currentUserEmail}`, JSON.stringify(newSummaries));
    }
    
    const groupedEntries = useMemo(() => {
        const groups: { [key: string]: DiaryEntry[] } = {};
        entries.forEach(entry => {
            const weekKey = getWeekKey(new Date(entry.date));
            if (!groups[weekKey]) {
                groups[weekKey] = [];
            }
            groups[weekKey].push(entry);
        });
        return groups;
    }, [entries]);

    const handleGenerateSummary = async (weekKey: string) => {
        const weekEntries = groupedEntries[weekKey];
        if (!weekEntries || weekEntries.length === 0) return;

        setLoadingStates(prev => ({ ...prev, [weekKey]: true }));

        try {
            const result = await generateWeeklyDiarySummary({ diaryEntries: weekEntries });
            const newFingerprint = createFingerprint(weekEntries);
            const newSummaryData = {
                ...summaries,
                [weekKey]: {
                    summary: result.summary,
                    fingerprint: newFingerprint,
                }
            };
            saveSummaries(newSummaryData);

        } catch (error) {
            console.error(`Failed to generate summary for ${weekKey}`, error);
        } finally {
            setLoadingStates(prev => ({ ...prev, [weekKey]: false }));
        }
    }

    const sortedWeeks = Object.keys(groupedEntries).sort((a,b) => b.localeCompare(a));
    
    if (entries.length === 0) return null;

    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Weekly Summaries</CardTitle>
                <CardDescription>Get AI-powered summaries of your weekly diary entries to spot trends.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {sortedWeeks.map(weekKey => {
                    const weekEntries = groupedEntries[weekKey];
                    const weekStartDate = new Date(weekEntries[weekEntries.length - 1].date);
                    const weekEndDate = new Date(weekEntries[0].date);
                    const title = `Week of ${weekStartDate.toLocaleDateString('en-GB', { month: 'long', day: 'numeric' })}`;
                    const currentFingerprint = createFingerprint(weekEntries);
                    const cachedSummary = summaries[weekKey];
                    const isUpToDate = cachedSummary && cachedSummary.fingerprint === currentFingerprint;
                    const isLoading = loadingStates[weekKey];

                    return (
                        <Alert key={weekKey}>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                <div className="flex-1">
                                    <AlertTitle className="font-bold">{title}</AlertTitle>
                                    <AlertDescription className="mt-2 prose prose-sm dark:prose-invert max-w-none">
                                        {isLoading ? (
                                            <p className="text-muted-foreground">Generating summary...</p>
                                        ) : isUpToDate ? (
                                             <div dangerouslySetInnerHTML={{ __html: marked(cachedSummary.summary) as string }} />
                                        ) : (
                                            <p className="text-muted-foreground italic">A summary can be generated for this week.</p>
                                        )}
                                    </AlertDescription>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleGenerateSummary(weekKey)}
                                    disabled={isLoading || isUpToDate}
                                >
                                    {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2" />}
                                    {isUpToDate ? "Up to date" : "Generate Summary"}
                                </Button>
                            </div>
                        </Alert>
                    )
                })}
            </CardContent>
        </Card>
    );
}

