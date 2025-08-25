
"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, RefreshCw, Download } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { marked } from "marked"
import jsPDF from "jspdf"
import "jspdf-autotable"
import html2canvas from "html2canvas"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"


import { generatePersonalSummary, GeneratePersonalSummaryOutput, SourceConversation, SourceDocument, MeetingNote } from "@/ai/flows/generate-personal-summary"
import type { GenerateTreatmentTimelineOutput } from "@/app/(app)/timeline/page"
import { DiaryEntry } from "@/app/(app)/diary/page"
import { Medication } from "@/app/(app)/medication/page"
import { DiaryChart } from "@/components/diary-chart"
import { lookupPostcode } from "@/services/postcode-lookup"
import { TextNote } from "@/ai/flows/types"

interface Message {
  role: "user" | "assistant"
  content: string;
   metadata?: {
      specialist: any;
  }
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
  specialist?: any;
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
  initialDiagnosis?: string;
  address1?: string;
  address2?: string;
  townCity?: string;
  countyState?: string;
  country?: string;
}

interface CachedLocationInfo {
    postcode: string;
    data: {
        city: string;
        nhs_ha: string;
    }
}

interface BenefitSuggestion {
    name: string;
    reason: string;
    url: string;
    potentialAmount?: string;
}


export default function SummaryPage() {
  const [report, setReport] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  const chartsRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [hideFinancialInfo, setHideFinancialInfo] = useState(false);
  const [hideWellnessInfo, setHideWellnessInfo] = useState(false);

  const [userData, setUserData] = useState<UserData>({});
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null)
  const [analysisData, setAnalysisData] = useState<AnalysisResult[]>([])
  const [sourceConversationsData, setSourceConversationsData] = useState<StoredConversation[]>([])
  const [textNotes, setTextNotes] = useState<TextNote[]>([])
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([])
  const [medicationData, setMedicationData] = useState<Medication[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem("currentUserEmail");
    setCurrentUserEmail(email);
  }, []);

  const loadPrerequisites = () => {
    if (!currentUserEmail) return;
    try {
      const storedUserData = localStorage.getItem(`userData_${currentUserEmail}`);
      if (storedUserData) {
          setUserData(JSON.parse(storedUserData));
      }
      
      const storedTimeline = localStorage.getItem(`treatmentTimeline_${currentUserEmail}`);
      if (storedTimeline) {
        setTimelineData(JSON.parse(storedTimeline));
      }

      const storedAnalyses = localStorage.getItem(`analysisResults_${currentUserEmail}`);
      if (storedAnalyses) {
        setAnalysisData(JSON.parse(storedAnalyses));
      }
      
      const storedSummaries = localStorage.getItem(`conversationSummaries_${currentUserEmail}`);
      const summariesAndNotes = storedSummaries ? JSON.parse(storedSummaries) : [];
      setTextNotes(summariesAndNotes.filter((item: any) => item.type === 'textNote'));
      setMeetingNotes(summariesAndNotes.filter((item: any) => item.type === 'meetingNote'));

      const storedConversations = localStorage.getItem(`allConversations_${currentUserEmail}`);
      if (storedConversations) {
        setSourceConversationsData(JSON.parse(storedConversations));
      } else {
        setSourceConversationsData([]);
      }

      const storedDiaryEntries = localStorage.getItem(`diaryEntries_${currentUserEmail}`);
      if (storedDiaryEntries) {
          const parsedEntries = JSON.parse(storedDiaryEntries);
          setDiaryEntries(parsedEntries);
      } else {
          setDiaryEntries([]);
      }

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
        loadPrerequisites();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserEmail]);


  useEffect(() => {
    if (hasLoaded && !report) {
      const hasContent = analysisData.length > 0 || sourceConversationsData.length > 0;
      if (!hasContent) {
        setError("You need to have a conversation or analyze a document first to generate a summary report.");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoaded, report]);


  const handleGenerateReport = async () => {
    if (!currentUserEmail || !userData.postcode) {
        setError("Please ensure your postcode is set in your profile.");
        return;
    };

    loadPrerequisites();
    
    setTimeout(async () => {
        const hasContent = analysisData.length > 0 || sourceConversationsData.length > 0 || diaryEntries.length > 0;
        if (!hasContent) {
            setError("You need to have a conversation, analyze a document, or make a diary entry first to generate a summary report.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            let locationInfo;
            const locationCacheKey = `locationInfo_${currentUserEmail}`;
            const cachedLocation = localStorage.getItem(locationCacheKey);
            if (cachedLocation) {
                const parsedCache: CachedLocationInfo = JSON.parse(cachedLocation);
                if (parsedCache.postcode === userData.postcode) {
                    locationInfo = parsedCache.data;
                }
            }
            
            if (!locationInfo) {
                locationInfo = await lookupPostcode({ postcode: userData.postcode! });
                const newCache: CachedLocationInfo = { postcode: userData.postcode!, data: locationInfo };
                localStorage.setItem(locationCacheKey, JSON.stringify(newCache));
            }
            
            let potentialBenefitsText = "*   No additional benefits were identified at this time. Visit the Finance page to check.";
            const benefitsCacheKey = `financialSuggestionsCache_${currentUserEmail}`;
            const cachedBenefits = localStorage.getItem(benefitsCacheKey);
            if(cachedBenefits) {
                 const parsedCache = JSON.parse(cachedBenefits);
                 if (parsedCache && parsedCache.suggestions && parsedCache.suggestions.length > 0) {
                     potentialBenefitsText = parsedCache.suggestions
                        .map((b: BenefitSuggestion) => `*   **${b.name}:** ${b.reason}`)
                        .join('\n');
                }
            }

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

            const dataToFingerprint = {
                userData, timelineData, analysisData, sourceConversationsData, textNotes, meetingNotes, diaryEntries, medicationData, locationInfo, potentialBenefitsText
            };
            const currentFingerprint = JSON.stringify(dataToFingerprint);
            const fingerprintKey = `personalSummaryFingerprint_${currentUserEmail}`;
            const savedFingerprint = localStorage.getItem(fingerprintKey);

            if (savedFingerprint === currentFingerprint && report) {
                toast({ title: "Report is up-to-date", description: "No new information was found to add to the report." });
                setIsLoading(false);
                return;
            }

            const result: GeneratePersonalSummaryOutput = await generatePersonalSummary({
                userName: userData.name || "User",
                initialDiagnosis: userData.initialDiagnosis || 'Not specified',
                age: userData.age || "",
                gender: userData.gender || "",
                address1: userData.address1 || "",
                address2: userData.address2 || "",
                townCity: userData.townCity || "",
                countyState: userData.countyState || "",
                country: userData.country || "",
                postcode: userData.postcode || "",
                employmentStatus: userData.employmentStatus || "",
                income: userData.income || "",
                savings: userData.savings || "",
                existingBenefits: userData.benefits || [],
                timelineData,
                sourceDocuments,
                sourceConversations,
                textNotes: textNotes.map(n => ({ id: n.id, title: n.title, content: n.content, date: new Date(n.date).toLocaleDateString() })),
                meetingNotes: meetingNotes,
                diaryData: diaryEntries,
                medicationData: medicationData,
                locationInfo: locationInfo,
                potentialBenefitsText: potentialBenefitsText,
            });

            setReport(result.report);
            localStorage.setItem(`personalSummaryReport_${currentUserEmail}`, result.report);
            localStorage.setItem(fingerprintKey, currentFingerprint);

            if (result.updatedDiagnosis && result.updatedDiagnosis !== userData.initialDiagnosis) {
                const updatedUserData = { ...userData, initialDiagnosis: result.updatedDiagnosis };
                setUserData(updatedUserData);
                localStorage.setItem(`userData_${currentUserEmail}`, JSON.stringify(updatedUserData));
            }

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

  const handleDownloadPdf = async () => {
    const reportElement = reportRef.current;
    const chartsContainer = chartsRef.current;
    if (!reportElement || !chartsContainer) return;

    setIsLoading(true);
    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const contentWidth = pdfWidth - margin * 2;

        // --- 1. Add Charts ---
        const chartElements = Array.from(chartsContainer.querySelectorAll('.chart-card-pdf')) as HTMLElement[];
        if (chartElements.length > 0) {
            pdf.setFontSize(22);
            pdf.text("Wellness Trends", pdfWidth / 2, 20, { align: 'center' });
            
            const chartCanvasPromises = chartElements.map(el => html2canvas(el, { scale: 2 }));
            const chartCanvases = await Promise.all(chartCanvasPromises);

            let yPos = 30;
            for (const canvas of chartCanvases) {
                const imgData = canvas.toDataURL('image/png');
                const imgHeight = (canvas.height * contentWidth) / canvas.width;
                if (yPos + imgHeight > pdfHeight - margin) {
                    pdf.addPage();
                    yPos = margin;
                }
                pdf.addImage(imgData, 'PNG', margin, yPos, contentWidth, imgHeight);
                yPos += imgHeight + 10;
            }
        }

        // --- 2. Add Report ---
        pdf.addPage();
        
        const reportCanvas = await html2canvas(reportElement, { scale: 2, windowWidth: reportElement.scrollWidth });
        const reportImgData = reportCanvas.toDataURL('image/png');
        const reportImgHeight = (reportCanvas.height * contentWidth) / reportCanvas.width;
        let reportYPos = 0;
        let remainingHeight = reportImgHeight;

        while (remainingHeight > 0) {
            const pageHeight = pdfHeight - (margin * 2);
            pdf.addImage(
                reportImgData, 
                'PNG', 
                margin, 
                margin - reportYPos, // Start drawing from the correct vertical slice
                contentWidth, 
                reportImgHeight
            );
            
            remainingHeight -= pageHeight;
            reportYPos += pageHeight;
            
            if (remainingHeight > 0) {
                pdf.addPage();
            }
        }
        
        pdf.save("Personal-Summary-Report.pdf");

    } catch (err) {
        console.error("Could not generate PDF", err);
        setError("There was an error creating the PDF file.");
    } finally {
        setIsLoading(false);
    }
  };

  const reportHtml = report ? marked.parse(report, {
    // This allows links to open in a new tab if needed, but for internal links, this is not required.
    // It's here for completeness if external links were ever added.
    renderer: new marked.Renderer(),
  }) : "";
  
  useEffect(() => {
    if (report && reportRef.current) {
      const headings = reportRef.current.querySelectorAll('h3');
      headings.forEach(h => {
        const text = h.textContent || '';
        if (text.includes('Financial Summary')) {
          h.id = 'financial-summary-heading';
        } else if (text.includes('Wellness & Diary Insights')) {
          h.id = 'wellness-summary-heading';
        } else if (text.includes('Potential Additional Benefits')) {
          h.id = 'benefits-summary-heading';
        }
      });
    }
  }, [report, hideFinancialInfo, hideWellnessInfo]);

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
            <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh Report
            </Button>
            <Button onClick={handleDownloadPdf} disabled={isLoading || !report} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
            </Button>
        </div>
      </div>

      <div className="space-y-8">
         <Card ref={chartsRef}>
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
                <div className="space-y-6">
                    {diaryEntries.length > 1 ? (
                        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                           <div className="chart-card-pdf">
                              <DiaryChart data={diaryEntries} chartType="mood" />
                           </div>
                           <div className="chart-card-pdf">
                              <DiaryChart data={diaryEntries} chartType="pain" />
                           </div>
                           <div className="chart-card-pdf">
                              <DiaryChart data={diaryEntries} chartType="weight" />
                           </div>
                           <div className="chart-card-pdf">
                               <DiaryChart data={diaryEntries} chartType="sleep" />
                           </div>
                           <div className="chart-card-pdf">
                               <DiaryChart data={diaryEntries} chartType="diagnosis" />
                           </div>
                           <div className="chart-card-pdf">
                               <DiaryChart data={diaryEntries} chartType="treatment" />
                           </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 rounded-lg border-2 border-dashed">
                            <h3 className="text-lg font-semibold">Not Enough Data for Charts</h3>
                            <p className="text-muted-foreground mt-1">You need at least two diary entries to see your wellness trends.</p>
                        </div>
                    )}
                </div>
            </CardContent>
         </Card>
      
        <div className={cn(hideFinancialInfo && "hide-financial", hideWellnessInfo && "hide-wellness")}>
            <Card>
                <CardHeader>
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>AI Generated Report</CardTitle>
                            <CardDescription>This report is generated from your conversations, documents, and timeline.</CardDescription>
                        </div>
                         <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="hide-financial" checked={hideFinancialInfo} onCheckedChange={(checked) => setHideFinancialInfo(!!checked)} />
                                <Label htmlFor="hide-financial" className="text-sm font-medium">Hide Financial Info</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="hide-wellness" checked={hideWellnessInfo} onCheckedChange={(checked) => setHideWellnessInfo(!!checked)} />
                                <Label htmlFor="hide-wellness" className="text-sm font-medium">Hide Wellness Info</Label>
                            </div>
                        </div>
                    </div>
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
                    <div ref={reportRef}>
                        <div
                            className="prose dark:prose-invert max-w-none text-foreground"
                            dangerouslySetInnerHTML={{ __html: reportHtml as string }}
                        />
                    </div>
                )}
                </CardContent>
            </Card>
        </div>
       </div>
    </div>
  )
}

    