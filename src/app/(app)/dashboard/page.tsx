"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { marked } from "marked"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog"
import { MessageSquare, FileText } from "lucide-react"

// Interfaces matching the data stored in localStorage
interface ConversationSummary {
  id: string;
  title: string;
  summary: string;
  date: string; // ISO String
}

interface AnalysisResult {
  id: string
  title: string
  question: string
  fileDataUri: string
  fileType: string
  fileName: string
  analysis: string
  date: string; // Should be ISO String for sorting
}

type ActivityItem = 
  | { type: 'conversation', data: ConversationSummary }
  | { type: 'analysis', data: AnalysisResult };


function ViewAnalysisDialog({ result, children }: { result: AnalysisResult; children: React.ReactNode }) {
  const analysisHtml = marked(result.analysis || "");

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{result.title}</DialogTitle>
          <DialogDescription>
            Analyzed on {new Date(result.date).toLocaleDateString()}. Question: "{result.question}"
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-4 overflow-hidden flex-1">
          <div className="overflow-y-auto rounded-md border">
            {result.fileType.startsWith("image/") ? (
                <Image src={result.fileDataUri} alt={result.fileName} width={800} height={1200} className="object-contain" />
            ) : (
                <iframe src={result.fileDataUri} className="w-full h-full" title={result.fileName} />
            )}
          </div>
          <div 
            className="prose prose-sm dark:prose-invert max-w-none text-foreground p-2 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: analysisHtml as string }}
          />
        </div>
         <DialogFooter className="mt-4 sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ConversationCard({ summary }: { summary: ConversationSummary }) {
    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    {summary.title}
                </CardTitle>
                <CardDescription>{new Date(summary.date).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
                 <p className="text-sm text-muted-foreground line-clamp-4">{summary.summary}</p>
                 <Link href="/support-chat" className="mt-4">
                    <Button variant="link" className="px-0 pt-2">View conversation &rarr;</Button>
                 </Link>
            </CardContent>
        </Card>
    )
}

function AnalysisCard({ result }: { result: AnalysisResult }) {
    return (
        <ViewAnalysisDialog result={result}>
            <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer flex flex-col h-full">
                <CardHeader>
                  <div className="relative aspect-[1.4/1] w-full rounded-md overflow-hidden border">
                    {result.fileType.startsWith("image/") ? (
                      <Image src={result.fileDataUri} alt={result.fileName} fill className="object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full bg-secondary p-4">
                          <FileText className="w-12 h-12 text-muted-foreground" />
                          <p className="text-xs text-center mt-2 text-muted-foreground break-all">{result.fileName}</p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                   <div>
                    <CardTitle className="text-lg mb-2 flex items-center gap-2">
                         <FileText className="w-5 h-5 text-primary" />
                        {result.title}
                    </CardTitle>
                    <CardDescription className="text-xs mb-2">{new Date(result.date).toLocaleDateString()}</CardDescription>
                    <div 
                        className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: marked.parse(result.analysis || "") as string }}
                    />
                   </div>
                </CardContent>
            </Card>
        </ViewAnalysisDialog>
    )
}


export default function DashboardPage() {
    const [activity, setActivity] = useState<ActivityItem[]>([]);

    useEffect(() => {
        let allActivity: ActivityItem[] = [];

        try {
            const storedSummaries = localStorage.getItem("conversationSummaries");
            if (storedSummaries) {
                const summaries: ConversationSummary[] = JSON.parse(storedSummaries);
                allActivity.push(...summaries.map(s => ({ type: 'conversation' as const, data: s })));
            }

            const storedAnalyses = localStorage.getItem("analysisResults");
            if (storedAnalyses) {
                const analyses: AnalysisResult[] = JSON.parse(storedAnalyses);
                allActivity.push(...analyses.map(a => ({ type: 'analysis' as const, data: a })));
            }

            // Sort all activities by date, most recent first
            allActivity.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
            
            setActivity(allActivity);
        } catch (error) {
            console.error("Could not load activity from localStorage", error);
        }
    }, []);

    return (
        <div className="p-4 md:p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Activity Overview</h1>
                <p className="text-muted-foreground">
                    Here&apos;s a summary of your recent conversations and document analyses.
                </p>
            </div>

            {activity.length > 0 ? (
                 <section>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {activity.map((item) => {
                            if (item.type === 'conversation') {
                                return <ConversationCard key={`convo-${item.data.id}`} summary={item.data} />;
                            }
                            if (item.type === 'analysis') {
                                return <AnalysisCard key={`analysis-${item.data.id}`} result={item.data} />;
                            }
                            return null;
                        })}
                    </div>
                </section>
            ) : (
                 <div className="text-center py-20 rounded-lg border-2 border-dashed">
                    <h2 className="text-xl font-semibold">No Activity Yet</h2>
                    <p className="text-muted-foreground mt-2">Your recent conversation summaries and document analyses will appear here.</p>
                </div>
            )}
        </div>
    )
}
