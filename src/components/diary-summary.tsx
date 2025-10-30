
"use client"

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { DiaryEntry } from "@/app/(app)/diary/page";
import { generateDiarySummary } from "@/ai/flows/generate-diary-summary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { marked } from "marked";

interface DiarySummaryProps {
    entries: DiaryEntry[];
    currentUserEmail: string | null;
}

interface StoredSummaryData {
    [key: string]: { // key is weekKey or monthKey
        summary: string;
        fingerprint: string;
    };
}

const getWeekKey = (date: Date) => {
    const year = date.getFullYear();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday as start of week
    const dayOfYear = (startOfWeek.getTime() - new Date(year, 0, 1).getTime()) / 86400000;
    const weekNumber = Math.ceil(dayOfYear / 7);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

const getMonthKey = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}-M${String(month).padStart(2, '0')}`;
}


const createFingerprint = (entries: DiaryEntry[]) => {
    return JSON.stringify(entries.map(e => ({ id: e.id, mood: e.mood, painScore: e.painScore, worriedAbout: e.worriedAbout, positiveAbout: e.positiveAbout, notes: e.notes, symptomAnalysis: e.symptomAnalysis })));
}

function SummaryCard({ title, entries, summaryKey, timeframe, onGenerate, storedSummary, isLoading }: {
    title: string;
    entries: DiaryEntry[];
    summaryKey: string;
    timeframe: 'Weekly' | 'Monthly';
    onGenerate: (key: string, timeframe: 'Weekly' | 'Monthly', entriesToSummarize: DiaryEntry[]) => void;
    storedSummary?: { summary: string; fingerprint: string; };
    isLoading: boolean;
}) {
    const currentFingerprint = createFingerprint(entries);
    const isUpToDate = storedSummary && storedSummary.fingerprint === currentFingerprint;
    
    return (
        <Alert>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="flex-1">
                    <AlertTitle className="font-bold">{title}</AlertTitle>
                    <AlertDescription className="mt-2 prose prose-sm dark:prose-invert max-w-none">
                        {isLoading ? (
                            <p className="text-muted-foreground">Generating summary...</p>
                        ) : isUpToDate ? (
                             <div dangerouslySetInnerHTML={{ __html: marked(storedSummary.summary) as string }} />
                        ) : (
                            <p className="text-muted-foreground italic">A {timeframe.toLowerCase()} summary can be generated for this period.</p>
                        )}
                    </AlertDescription>
                </div>
                <Button
                    size="sm"
                    onClick={() => onGenerate(summaryKey, timeframe, entries)}
                    disabled={isLoading || isUpToDate}
                    className="mt-2 sm:mt-0"
                >
                    {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2" />}
                    {isUpToDate ? "Up to date" : `Generate ${timeframe} Summary`}
                </Button>
            </div>
        </Alert>
    );
}

export function DiarySummary({ entries, currentUserEmail }: DiarySummaryProps) {
    const [summaries, setSummaries] = useState<StoredSummaryData>({});
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!currentUserEmail) return;
        const storedSummaries = localStorage.getItem(`diarySummaries_${currentUserEmail}`);
        if (storedSummaries) {
            setSummaries(JSON.parse(storedSummaries));
        }
    }, [currentUserEmail]);

    const saveSummaries = (newSummaries: StoredSummaryData) => {
        if (!currentUserEmail) return;
        setSummaries(newSummaries);
        localStorage.setItem(`diarySummaries_${currentUserEmail}`, JSON.stringify(newSummaries));
    }
    
    const groupedEntriesByMonth = useMemo(() => {
        const groups: { [key: string]: DiaryEntry[] } = {};
        entries.forEach(entry => {
            const monthKey = getMonthKey(new Date(entry.date));
            if (!groups[monthKey]) {
                groups[monthKey] = [];
            }
            groups[monthKey].push(entry);
        });
        return groups;
    }, [entries]);

    const handleGenerateSummary = async (key: string, timeframe: 'Weekly' | 'Monthly', entriesToSummarize: DiaryEntry[]) => {
        if (!entriesToSummarize || entriesToSummarize.length === 0) return;

        setLoadingStates(prev => ({ ...prev, [key]: true }));

        try {
            const result = await generateDiarySummary({ diaryEntries: entriesToSummarize, timeframe });
            const newFingerprint = createFingerprint(entriesToSummarize);
            const newSummaryData = {
                ...summaries,
                [key]: {
                    summary: result.summary,
                    fingerprint: newFingerprint,
                }
            };
            saveSummaries(newSummaryData);

        } catch (error) {
            console.error(`Failed to generate summary for ${key}`, error);
        } finally {
            setLoadingStates(prev => ({ ...prev, [key]: false }));
        }
    }

    const sortedMonths = Object.keys(groupedEntriesByMonth).sort((a,b) => b.localeCompare(a));
    const currentMonthKey = getMonthKey(new Date());

    if (entries.length === 0) return null;

    return (
        <Card className="mb-8 diary-summary-card">
            <CardHeader>
                <CardTitle>Diary Summaries</CardTitle>
                <CardDescription>Get AI-powered summaries of your diary entries to spot trends.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {sortedMonths.map(monthKey => {
                    const monthEntries = groupedEntriesByMonth[monthKey];
                    const monthDate = new Date(monthEntries[0].date);
                    const monthTitle = monthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
                    
                    const groupedByWeek = monthEntries.reduce((acc, entry) => {
                        const weekKey = getWeekKey(new Date(entry.date));
                        if (!acc[weekKey]) acc[weekKey] = [];
                        acc[weekKey].push(entry);
                        return acc;
                    }, {} as { [key: string]: DiaryEntry[] });

                    const sortedWeeks = Object.keys(groupedByWeek).sort((a,b) => b.localeCompare(a));
                    
                    return (
                         <Card key={monthKey} className="p-4 bg-muted/30">
                            <h3 className="font-semibold mb-4">{monthTitle}</h3>
                            <div className="space-y-4">
                                <SummaryCard 
                                    title="Monthly Summary"
                                    entries={monthEntries}
                                    summaryKey={monthKey}
                                    timeframe="Monthly"
                                    onGenerate={handleGenerateSummary}
                                    storedSummary={summaries[monthKey]}
                                    isLoading={loadingStates[monthKey]}
                                />
                                {monthKey === currentMonthKey && sortedWeeks.length > 1 && (
                                     <div className="space-y-2 pt-4 border-t">
                                        <h4 className="text-sm font-semibold text-muted-foreground">Weekly Breakdowns for {monthTitle}</h4>
                                        {sortedWeeks.map(weekKey => {
                                            const weekEntries = groupedByWeek[weekKey];
                                            const weekStartDate = new Date(weekEntries[weekEntries.length - 1].date);
                                            const weekTitle = `Week of ${weekStartDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;

                                            return <SummaryCard 
                                                key={weekKey}
                                                title={weekTitle}
                                                entries={weekEntries}
                                                summaryKey={weekKey}
                                                timeframe="Weekly"
                                                onGenerate={handleGenerateSummary}
                                                storedSummary={summaries[weekKey]}
                                                isLoading={loadingStates[weekKey]}
                                            />
                                        })}
                                    </div>
                                )}
                            </div>
                        </Card>
                    )
                })}
            </CardContent>
        </Card>
    );
}
