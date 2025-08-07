
"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, RefreshCw, Download } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { marked } from "marked"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"


import { generatePersonalSummary, SourceDocument, SourceConversation } from "@/ai/flows/generate-personal-summary"
import type { GenerateTreatmentTimelineOutput } from "@/ai/flows/generate-treatment-timeline"
import { DiaryEntry } from "@/app/(app)/diary/page"
import { Medication } from "@/app/(app)/medication/page"
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

interface StoredConversation {
    id: string;
    messages: Message[];
}

type TimelineData = GenerateTreatmentTimelineOutput;

interface UserData {
  name?: string;
  age?: string;
  gender?: string;
  postcode?: string;
  employmentStatus?: string;
  income?: string;
  savings?: string;
  benefits?: string[];
}

export default function SummaryPage() {
  const [report, setReport] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)
  const printableRef = useRef<HTMLDivElement>(null)
  
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  
  // State to hold all the data needed for the report
  const [userData, setUserData] = useState<UserData>({});
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null)
  const [analysisData, setAnalysisData] = useState<AnalysisResult[]>([])
  const [sourceConversationsData, setSourceConversationsData] = useState<StoredConversation[]>([])
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([])
  const [medicationData, setMedicationData] = useState<Medication[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem("currentUserEmail");
    setCurrentUserEmail(email);
  }, []);

  // Load all necessary data from localStorage
  const loadPrerequisites = () => {
    if (!currentUserEmail) return;
    try {
      // User Details from the single user data object
      const storedUserData = localStorage.getItem(`userData_${currentUserEmail}`);
      if (storedUserData) {
          setUserData(JSON.parse(storedUserData));
      }
      
      // Timeline Data
      const storedTimeline = localStorage.getItem(`treatmentTimeline_${currentUserEmail}`);
      if (storedTimeline) {
        setTimelineData(JSON.parse(storedTimeline));
      }

      // Analysis Data
      const storedAnalyses = localStorage.getItem(`analysisResults_${currentUserEmail}`);
      if (storedAnalyses) {
        setAnalysisData(JSON.parse(storedAnalyses));
      }
      
      // All Saved Conversations
      const storedConversations = localStorage.getItem(`allConversations_${currentUserEmail}`);
      if (storedConversations) {
        setSourceConversationsData(JSON.parse(storedConversations));
      } else {
        setSourceConversationsData([]);
      }

      // Diary Entries
      const storedDiaryEntries = localStorage.getItem(`diaryEntries_${currentUserEmail}`);
      if (storedDiaryEntries) {
          const parsedEntries = JSON.parse(storedDiaryEntries);
          setDiaryEntries(parsedEntries);
      } else {
          setDiaryEntries([]);
      }

       // Medication Data
      const storedMedications = localStorage.getItem(`medications_${currentUserEmail}`);
      if (storedMedications) {
        setMedicationData(JSON.parse(storedMedications));
      } else {
        setMedicationData([]);
      }

      setHasLoaded(true);

    } catch (e) {
      console.error("Failed to load data from localStorage", e);
      setError("Could not load your saved data. Some information may be missing from the report.");
    }
  }
  
  useEffect(() => {
    if (currentUserEmail) {
        const savedReport = localStorage.getItem(`personalSummaryReport_${currentUserEmail}`);
        if (savedReport) {
            setReport(savedReport);
        }
        // Always load fresh data
        loadPrerequisites();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserEmail]);


  // Effect to check for data on initial load and maybe auto-generate
  useEffect(() => {
    if (hasLoaded && !report) {
      const hasContent = analysisData.length > 0 || sourceConversationsData.length > 0;
      if (hasContent) {
          handleGenerateReport(true); // Auto-generate if there's content and no report
      } else {
          setError("You need to have a conversation or analyze a document first to generate a summary report.");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoaded, analysisData, sourceConversationsData, report]);


  const handleGenerateReport = async (isInitialLoad = false) => {
    if (!currentUserEmail) return;

    if (!isInitialLoad) {
        loadPrerequisites(); // Force a refresh of all data
    }
    
    // Give UI time to update before blocking with AI call
    setTimeout(async () => {
        const hasContent = analysisData.length > 0 || sourceConversationsData.length > 0;
        if (!hasContent) {
            setError("You need to have a conversation or analyze a document first to generate a summary report.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const sourceDocuments: SourceDocument[] = analysisData.map(a => ({
                id: a.id,
                title: a.title,
                date: new Date(a.date).toLocaleDateString(),
                analysis: a.analysis,
            }));

            const allSummariesStr = localStorage.getItem(`conversationSummaries_${currentUserEmail}`);
            const allSummaries: ConversationSummary[] = allSummariesStr ? JSON.parse(allSummariesStr) : [];

            const sourceConversations: SourceConversation[] = sourceConversationsData.map(c => {
                const summary = allSummaries.find(s => s.id === c.id);
                return {
                    id: c.id,
                    title: summary?.title || "Conversation",
                    date: summary ? new Date(summary.date).toLocaleDateString() : 'N/A',
                    summary: summary?.summary || "No summary available.",
                    fullConversation: c.messages,
                }
            });

            const result = await generatePersonalSummary({
                userName: userData.name || "User",
                age: userData.age || "",
                gender: userData.gender || "",
                postcode: userData.postcode || "",
                employmentStatus: userData.employmentStatus || "",
                income: userData.income || "",
                savings: userData.savings || "",
                existingBenefits: userData.benefits || [],
                timelineData,
                sourceDocuments,
                sourceConversations,
                diaryData: diaryEntries,
                medicationData: medicationData
            });
            setReport(result.report);
            localStorage.setItem(`personalSummaryReport_${currentUserEmail}`, result.report);
        } catch (err) {
            console.error("Failed to generate report:", err);
            setError("Sorry, there was an error generating your report. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, 100); 
  }

  const handleRefreshCharts = () => {
    setIsChartLoading(true);
    loadPrerequisites();
    setTimeout(() => setIsChartLoading(false), 300);
  }

  const handleDownloadPdf = () => {
    const input = printableRef.current;
    if (!input) {
      console.error("Printable element not found");
      return;
    }
    setIsLoading(true);
    html2canvas(input, {
        scale: 2,
        useCORS: true, 
        logging: false 
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const canvasRatio = canvasWidth / canvasHeight;

      const imgWidth = pdfWidth - 20; // with some margin
      const imgHeight = imgWidth / canvasRatio;
      
      let heightLeft = imgHeight;
      let position = 10; // top margin

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      while (heightLeft > 0) {
        position = -heightLeft + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }
      
      pdf.save("Personal-Summary-Report.pdf");
      setIsLoading(false);
    }).catch(err => {
        console.error("Could not generate PDF", err);
        setIsLoading(false);
    });
  };

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
            <Button onClick={handleDownloadPdf} disabled={isLoading || !report} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
            </Button>
        </div>
      </div>

       <div ref={printableRef} className="space-y-8">
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
            <CardContent>
                {diaryEntries.length > 1 ? (
                    <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
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
                    </div>
                ) : (
                    <div className="text-center py-10 rounded-lg border-2 border-dashed">
                        <h3 className="text-lg font-semibold">Not Enough Data for Charts</h3>
                        <p className="text-muted-foreground mt-1">You need at least two diary entries to see your wellness trends.</p>
                    </div>
                )}
            </CardContent>
         </Card>
      
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
            {report && (
                <div
                    ref={reportRef}
                    className="prose dark:prose-invert max-w-none text-foreground"
                    dangerouslySetInnerHTML={{ __html: reportHtml as string }}
                />
            )}
            </CardContent>
        </Card>
       </div>
    </div>
  )
}
