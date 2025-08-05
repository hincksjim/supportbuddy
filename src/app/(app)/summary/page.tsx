
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { marked } from "marked"

import { generatePersonalSummary, SourceDocument, SourceConversation } from "@/ai/flows/generate-personal-summary"
import type { GenerateTreatmentTimelineOutput } from "@/ai/flows/generate-treatment-timeline"
import { DiaryEntry } from "@/app/(app)/diary/page"
import { DiaryChart } from "@/components/diary-chart"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface AnalysisResult {
  id: string
  title: string
  question: string
  fileDataUri: string
  fileType: string
  fileName: string
  analysis: string
  date: string
}

interface ConversationSummary {
  id: string;
  title: string;
  summary: string;
  date: string;
}

type TimelineData = GenerateTreatmentTimelineOutput;

export default function SummaryPage() {
  const [report, setReport] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null)
  
  // State to hold all the data needed for the report
  const [userName, setUserName] = useState("User")
  const [userAge, setUserAge] = useState("")
  const [userGender, setUserGender] = useState("")
  const [userPostcode, setUserPostcode] = useState("")
  const [conversationHistory, setConversationHistory] = useState<Message[]>([])
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null)
  const [analysisData, setAnalysisData] = useState<AnalysisResult[]>([])
  const [conversationSummaries, setConversationSummaries] = useState<ConversationSummary[]>([])
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([])

  const loadDiaryEntries = () => {
       try {
            const storedDiaryEntries = localStorage.getItem("diaryEntries");
            if (storedDiaryEntries) {
                setDiaryEntries(JSON.parse(storedDiaryEntries));
            }
       } catch (e) {
           console.error("Failed to load diary entries from localStorage", e);
           setError("Could not load your diary data for the charts.");
       }
  }

  // Load all necessary data from localStorage
  const loadPrerequisites = () => {
    try {
      // User Details
      const storedName = localStorage.getItem("userName");
      const storedAge = localStorage.getItem("userAge");
      const storedGender = localStorage.getItem("userGender");
      const storedPostcode = localStorage.getItem("userPostcode");
      if (storedName) setUserName(storedName);
      if (storedAge) setUserAge(storedAge);
      if (storedGender) setUserGender(storedGender);
      if (storedPostcode) setUserPostcode(storedPostcode);
      
      // Conversation History (primary source)
      const storedHistory = localStorage.getItem("conversationHistory");
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          setConversationHistory(parsedHistory);
        }
      }
      
      // Timeline Data
      const storedTimeline = localStorage.getItem("treatmentTimeline");
      if (storedTimeline) {
        setTimelineData(JSON.parse(storedTimeline));
      }

      // Analysis Data
      const storedAnalyses = localStorage.getItem("analysisResults");
      if (storedAnalyses) {
        setAnalysisData(JSON.parse(storedAnalyses));
      }
      
      // Conversation Summaries
      const storedSummaries = localStorage.getItem("conversationSummaries");
      if (storedSummaries) {
        setConversationSummaries(JSON.parse(storedSummaries));
      }

      // Diary Entries
      loadDiaryEntries();

    } catch (e) {
      console.error("Failed to load data from localStorage", e);
      setError("Could not load your saved data. Some information may be missing from the report.");
    }
  }
  
  useEffect(() => {
    loadPrerequisites();
    const savedReport = localStorage.getItem("personalSummaryReport");
    if (savedReport) {
        setReport(savedReport);
    } else {
        // Automatically generate the report on first load if none is cached
        handleGenerateReport(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateReport = async (isInitialLoad = false) => {
    if (!isInitialLoad) {
        // Always get the freshest data before a manual refresh
        loadPrerequisites();
    }
    
    // We need at least some data to generate a report
    if (conversationHistory.length < 1 && analysisData.length < 1 && conversationSummaries.length < 1 && isInitialLoad) {
        setError("You need to have a conversation or analyze a document first to generate a summary report.");
        return
    }

    setIsLoading(true);
    setError(null);

    // Give a slight delay for the state to update, especially on manual refresh
    setTimeout(async () => {
        try {
            const sourceDocuments: SourceDocument[] = analysisData.map(a => ({
                id: a.id,
                title: a.title,
                date: new Date(a.date).toLocaleDateString(),
                analysis: a.analysis,
            }));

            const sourceConversations: SourceConversation[] = conversationSummaries.map(c => ({
                id: c.id,
                title: c.title,
                date: new Date(c.date).toLocaleDateString(),
                summary: c.summary
            }));

            const result = await generatePersonalSummary({
                userName,
                age: userAge,
                gender: userGender,
                postcode: userPostcode,
                conversationHistory,
                timelineData,
                sourceDocuments,
                sourceConversations
            });
            setReport(result.report);
            localStorage.setItem("personalSummaryReport", result.report); // Save to localStorage
        } catch (err) {
            console.error("Failed to generate report:", err);
            setError("Sorry, there was an error generating your report. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, 100); // 100ms delay
  }

  const handleRefreshCharts = () => {
    setIsChartLoading(true);
    loadDiaryEntries();
    // Simulate a short delay for user feedback
    setTimeout(() => setIsChartLoading(false), 300);
  }

  const reportHtml = report ? marked(report) : "";

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Personal Summary</h1>
          <p className="text-muted-foreground">
            A consolidated report of your journey so far.
          </p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => handleGenerateReport(false)} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh Report
            </Button>
        </div>
      </div>

       {diaryEntries.length > 1 && (
         <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                     <div>
                        <CardTitle>Wellness Trends</CardTitle>
                        <CardDescription>A visual overview of your diary entries.</CardDescription>
                    </div>
                     <Button onClick={handleRefreshCharts} disabled={isChartLoading} variant="outline" size="sm">
                        {isChartLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Refresh Charts
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Overall Mood Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DiaryChart data={diaryEntries} chartType="mood" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Treatment Mood Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DiaryChart data={diaryEntries} chartType="treatment" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Diagnosis Mood Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DiaryChart data={diaryEntries} chartType="diagnosis" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Pain Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DiaryChart data={diaryEntries} chartType="pain" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                         <CardTitle className="text-base">Weight Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DiaryChart data={diaryEntries} chartType="weight" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Sleep Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DiaryChart data={diaryEntries} chartType="sleep" />
                    </CardContent>
                </Card>
            </CardContent>
         </Card>
      )}

      <Card>
        <CardHeader>
            <CardTitle>AI Generated Report</CardTitle>
            <CardDescription>This report is generated from your conversations, documents, and timeline.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !report && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Generating your personal report...</p>
            </div>
          )}
          {error && !isLoading && (
            <Alert variant="destructive" className="my-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!isLoading && !error && !report && (
             <div className="text-center py-20 rounded-lg border-2 border-dashed">
              <h2 className="text-xl font-semibold">No report generated yet</h2>
              <p className="text-muted-foreground mt-2">Have a chat or analyze a document, then click "Refresh Report".</p>
            </div>
          )}
          {report && !isLoading && (
             <div 
                className="prose dark:prose-invert max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: reportHtml as string }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

    
