
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, RefreshCw, Download } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { marked } from "marked"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"


import { generatePersonalSummary, PersonalSummaryOutput, SourceConversation, SourceDocument } from "@/ai/flows/generate-personal-summary"
import type { GenerateTreatmentTimelineOutput } from "@/app/(app)/timeline/page"
import { DiaryEntry } from "@/app/(app)/diary/page"
import { Medication } from "@/app/(app)/medication/page"
import { DiaryChart } from "@/components/diary-chart"
import { lookupPostcode } from "@/services/postcode-lookup"
import { MeetingNote, TextNote, ReportSectionData } from "@/ai/flows/types"

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
  files: { fileDataUri: string; fileType: string; fileName: string }[]
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

type ReportData = Partial<ReportSectionData & { updatedDiagnosis: string }>;
type FingerprintData = Partial<Record<keyof ReportSectionData, string>>;

const createFingerprint = (data: any): string => {
    if (!data) {
        return "no-data";
    }

    if (Array.isArray(data)) {
        if (data.length === 0) return "count:0-lastModified:none";
        
        const latestDate = data.reduce((latest, item) => {
            const itemDateStr = item.date || item.issuedDate;
            if (itemDateStr) {
                const itemDate = new Date(itemDateStr);
                if (!isNaN(itemDate.getTime()) && itemDate > latest) {
                    return itemDate;
                }
            }
            return latest;
        }, new Date(0));

        return `count:${data.length}-lastModified:${latestDate.toISOString()}`;
    }

    if (typeof data === 'object' && data !== null) {
        if ('timeline' in data && Array.isArray(data.timeline)) {
            const stepCount = data.timeline.reduce((acc: number, stage: any) => acc + (stage.steps?.length || 0), 0);
            return `stages:${data.timeline.length}-steps:${stepCount}`;
        }
        return `keys:${Object.keys(data).length}-values:${Object.values(data).map(v => String(v).slice(0, 10)).join(',')}`;
    }
    
    return String(data);
};

export default function SummaryPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false)
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  const chartsRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [hideFinancialInfo, setHideFinancialInfo] = useState(false);
  const [hideWellnessInfo, setHideWellnessInfo] = useState(false);
  
  const [prereqData, setPrereqData] = useState<{
      userData: UserData,
      timelineData: TimelineData | null,
      analysisData: AnalysisResult[],
      sourceConversationsData: StoredConversation[],
      textNotes: TextNote[],
      meetingNotes: MeetingNote[],
      diaryEntries: DiaryEntry[],
      medicationData: Medication[],
  }>({
      userData: {},
      timelineData: null,
      analysisData: [],
      sourceConversationsData: [],
      textNotes: [],
      meetingNotes: [],
      diaryEntries: [],
      medicationData: [],
  });

  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem("currentUserEmail");
    setCurrentUserEmail(email);
  }, []);
  
  const getStorageKey = useCallback((type: 'report' | 'fingerprints') => {
      if (!currentUserEmail) return null;
      return type === 'report' ? `personalSummaryReport_${currentUserEmail}` : `personalSummaryFingerprints_${currentUserEmail}`;
  }, [currentUserEmail]);

  useEffect(() => {
    if (!currentUserEmail) return;

    try {
        console.log("Summary Page: Loading all prerequisite data from localStorage.");
        
        const storedUserData = localStorage.getItem(`userData_${currentUserEmail}`);
        const storedTimeline = localStorage.getItem(`treatmentTimeline_${currentUserEmail}`);
        const storedAnalyses = localStorage.getItem(`analysisResults_${currentUserEmail}`);
        const storedSummariesAndNotes = localStorage.getItem(`conversationSummaries_${currentUserEmail}`);
        const storedConversations = localStorage.getItem(`allConversations_${currentUserEmail}`);
        const storedDiaryEntries = localStorage.getItem(`diaryEntries_${currentUserEmail}`);
        const storedMedications = localStorage.getItem(`medications_${currentUserEmail}`);
        
        const summariesAndNotes = storedSummariesAndNotes ? JSON.parse(storedSummariesAndNotes) : [];

        setPrereqData({
            userData: storedUserData ? JSON.parse(storedUserData) : {},
            timelineData: storedTimeline ? JSON.parse(storedTimeline) : null,
            analysisData: storedAnalyses ? JSON.parse(storedAnalyses) : [],
            sourceConversationsData: storedConversations ? JSON.parse(storedConversations) : [],
            textNotes: summariesAndNotes.filter((item: any) => item.type === 'textNote'),
            meetingNotes: summariesAndNotes.filter((item: any) => item.type === 'meetingNote'),
            diaryEntries: storedDiaryEntries ? JSON.parse(storedDiaryEntries) : [],
            medicationData: storedMedications ? JSON.parse(storedMedications) : [],
        });
        
        const savedReportKey = getStorageKey('report');
        if (savedReportKey) {
            const savedReport = localStorage.getItem(savedReportKey);
            if (savedReport) {
                try {
                    const parsedReport = JSON.parse(savedReport);
                    if (typeof parsedReport === 'object' && parsedReport !== null) {
                        setReportData(parsedReport);
                    } else {
                        throw new Error("Report is not a valid object.");
                    }
                } catch (e) {
                    console.warn("Could not parse saved report as JSON. It might be in the old format. Clearing it.");
                    localStorage.removeItem(savedReportKey);
                    setReportData(null);
                }
            }
        }

        setHasLoaded(true);
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
      setError("Could not load your saved data. Some information may be missing from the report.");
    }
  }, [currentUserEmail, getStorageKey]);

  const handleGenerateReport = async () => {
    const { userData, timelineData, analysisData, sourceConversationsData, textNotes, meetingNotes, diaryEntries, medicationData } = prereqData;
    
    if (!currentUserEmail || !userData.postcode) {
        setError("Please ensure your postcode is set in your profile.");
        return;
    };

    const hasContent = analysisData.length > 0 || sourceConversationsData.length > 0 || diaryEntries.length > 0;
    if (!hasContent) {
        setError("You need to have a conversation, analyze a document, or make a diary entry first to generate a summary report.");
        return;
    }

    setIsLoading(true);
    setError(null);
    console.log("Summary Page: Starting report generation process.");

    try {
        const fingerprints: FingerprintData = {
            personalDetails: createFingerprint({ ...userData, timelineData }),
            medicalTeam: createFingerprint({ sourceDocuments: analysisData, sourceConversations: sourceConversationsData, meetingNotes }),
            diagnosisSummary: createFingerprint({ sourceDocuments: analysisData, sourceConversations: sourceConversationsData }),
            currentMedications: createFingerprint(medicationData),
            wellnessInsights: createFingerprint(diaryEntries),
            timelineMilestones: createFingerprint({ timelineData, sourceConversations: sourceConversationsData }),
            financialSummary: createFingerprint({ userData }),
            potentialBenefits: createFingerprint({ userData }),
            sources: createFingerprint({ analysisData, sourceConversationsData, textNotes, meetingNotes })
        };
        
        const reportKey = getStorageKey('report');
        const fingerprintsKey = getStorageKey('fingerprints');

        const savedReport: ReportData = reportKey ? JSON.parse(localStorage.getItem(reportKey) || '{}') : {};
        const savedFingerprints: FingerprintData = fingerprintsKey ? JSON.parse(localStorage.getItem(fingerprintsKey) || '{}') : {};

        const sectionsToGenerate: Partial<Record<keyof ReportSectionData, boolean>> = {};
        let needsGeneration = false;
        
        const keys = Object.keys(fingerprints) as Array<keyof FingerprintData>;
        for (const key of keys) {
            if (fingerprints[key] !== savedFingerprints[key]) {
                sectionsToGenerate[key] = true;
                needsGeneration = true;
            }
        }
        
        const savedReportKey = getStorageKey('report');
        const isReportEmpty = !savedReportKey || !localStorage.getItem(savedReportKey);


        if (!needsGeneration && !isReportEmpty) {
             toast({ title: "Report is up-to-date", description: "No new information was found to add to the report." });
             setIsLoading(false);
             return;
        }
        
        if (Object.keys(sectionsToGenerate).length > 0) {
            console.log("Summary Page: Regenerating sections:", Object.keys(sectionsToGenerate));
        } else if (isReportEmpty) {
            console.log("Summary Page: No sections need regeneration, but report is empty. Generating all.");
            keys.forEach(key => sectionsToGenerate[key] = true);
        }

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
            localStorage.setItem(locationCacheKey, JSON.stringify({ postcode: userData.postcode!, data: locationInfo }));
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

        const sourceDocuments: SourceDocument[] = analysisData.map(a => ({ id: a.id, title: a.title, date: new Date(a.date).toLocaleDateString(), analysis: a.analysis }));
        const allSummariesStr = localStorage.getItem(`conversationSummaries_${currentUserEmail}`);
        const allSummaries: ConversationSummary[] = allSummariesStr ? JSON.parse(allSummariesStr) : [];
        const sourceConversations: SourceConversation[] = sourceConversationsData.map(c => {
            const summary = allSummaries.find(s => s.id === c.id);
            return { id: c.id, title: summary?.title || "Conversation", date: summary ? new Date(summary.date).toLocaleDateString() : 'N/A', summary: summary?.summary || "No summary available.", fullConversation: c.messages };
        });

        const result: PersonalSummaryOutput = await generatePersonalSummary({
            sectionsToGenerate: sectionsToGenerate,
            userName: userData.name || "User",
            initialDiagnosis: userData.initialDiagnosis || 'Not specified',
            age: userData.age || "",
            gender: userData.gender || "",
            address1: userData.address1 || "", address2: userData.address2 || "", townCity: userData.townCity || "", countyState: userData.countyState || "", country: userData.country || "",
            postcode: userData.postcode || "",
            employmentStatus: userData.employmentStatus || "", income: userData.income || "", savings: userData.savings || "",
            existingBenefits: userData.benefits || [],
            timelineData,
            sourceDocuments,
            sourceConversations,
            textNotes: textNotes.map(n => ({ id: n.id, title: n.title, content: n.content, date: new Date(n.date).toLocaleDateString() })),
            meetingNotes,
            diaryData: diaryEntries,
            medicationData,
            locationInfo: locationInfo,
            potentialBenefitsText: potentialBenefitsText,
        });

        const finalReportData = { ...savedReport, ...result };
        setReportData(finalReportData);
        if (reportKey) localStorage.setItem(reportKey, JSON.stringify(finalReportData));

        const finalFingerprints = { ...savedFingerprints, ...fingerprints };
        if (fingerprintsKey) localStorage.setItem(fingerprintsKey, JSON.stringify(finalFingerprints));

        if (result.updatedDiagnosis && result.updatedDiagnosis !== userData.initialDiagnosis) {
            const updatedUserData = { ...userData, initialDiagnosis: result.updatedDiagnosis };
            setPrereqData(prev => ({ ...prev, userData: updatedUserData }));
            localStorage.setItem(`userData_${currentUserEmail}`, JSON.stringify(updatedUserData));
        }

    } catch (err) {
      console.error("Failed to generate report:", err);
      setError("Sorry, there was an error generating your report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleRefreshCharts = () => {
    setIsChartLoading(true);
    setTimeout(() => setIsChartLoading(false), 300);
  }

  const handleDownloadPdf = async () => {
    const reportElement = reportRef.current?.querySelector('.prose') as HTMLElement;
    if (!reportElement) return;

    setIsLoading(true);
    try {
        const { default: jsPDF } = await import('jspdf');
        const { default: html2canvas } = await import('html2canvas');

        reportElement.classList.add('pdf-render');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        await pdf.html(reportElement, {
            callback: function(doc) {
                doc.save('Personal-Summary-Report.pdf');
            },
            x: 10,
            y: 10,
            width: 190,
            windowWidth: reportElement.scrollWidth
        });
        
        reportElement.classList.remove('pdf-render');
    } catch (err) {
        console.error("Could not generate PDF", err);
        setError("There was an error creating the PDF file.");
    } finally {
        setIsLoading(false);
    }
  };

  const renderSection = (content: string | undefined) => {
    if (!content) return null;
    return <div dangerouslySetInnerHTML={{ __html: marked.parse(content) as string }} />;
  }

  const reportSections = [
        { key: 'personalDetails', content: reportData?.personalDetails, hideToggle: false },
        { key: 'medicalTeam', content: reportData?.medicalTeam, hideToggle: false },
        { key: 'diagnosisSummary', content: reportData?.diagnosisSummary, hideToggle: false },
        { key: 'currentMedications', content: reportData?.currentMedications, hideToggle: false },
        { key: 'wellnessInsights', content: reportData?.wellnessInsights, hideToggle: hideWellnessInfo },
        { key: 'timelineMilestones', content: reportData?.timelineMilestones, hideToggle: false },
        { key: 'financialSummary', content: reportData?.financialSummary, hideToggle: hideFinancialInfo },
        { key: 'potentialBenefits', content: reportData?.potentialBenefits, hideToggle: hideFinancialInfo },
        { key: 'sources', content: reportData?.sources, hideToggle: false },
    ];
    
    const diagnosis = prereqData.userData?.initialDiagnosis?.toLowerCase() || "";
    const showFluidChart = diagnosis.includes("kidney") || diagnosis.includes("renal");
    const showBloodPressureCharts = diagnosis.includes("heart") || diagnosis.includes("cardiac") || diagnosis.includes("stroke") || diagnosis.includes("vascular") || diagnosis.includes("hypertension") || diagnosis.includes("kidney") || diagnosis.includes("renal");
    const showBloodSugarChart = diagnosis.includes("diabetes");


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
            <Button onClick={handleDownloadPdf} disabled={isLoading || !reportData} variant="outline">
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
                    {prereqData.diaryEntries.length > 1 ? (
                        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                           <div className="chart-card-pdf">
                              <h3 className="text-sm font-semibold mb-2 text-center">Overall Mood</h3>
                              <DiaryChart data={prereqData.diaryEntries} chartType="mood" />
                           </div>
                           <div className="chart-card-pdf">
                               <h3 className="text-sm font-semibold mb-2 text-center">Pain Score</h3>
                               <DiaryChart data={prereqData.diaryEntries} chartType="pain" />
                           </div>
                           <div className="chart-card-pdf">
                               <h3 className="text-sm font-semibold mb-2 text-center">Weight (kg)</h3>
                               <DiaryChart data={prereqData.diaryEntries} chartType="weight" />
                           </div>
                           <div className="chart-card-pdf">
                               <h3 className="text-sm font-semibold mb-2 text-center">Sleep (hours)</h3>
                               <DiaryChart data={prereqData.diaryEntries} chartType="sleep" />
                           </div>
                           <div className="chart-card-pdf">
                               <h3 className="text-sm font-semibold mb-2 text-center">Diagnosis Mood</h3>
                               <DiaryChart data={prereqData.diaryEntries} chartType="diagnosis" />
                           </div>
                           <div className="chart-card-pdf">
                               <h3 className="text-sm font-semibold mb-2 text-center">Treatment Mood</h3>
                               <DiaryChart data={prereqData.diaryEntries} chartType="treatment" />
                           </div>
                           <div className="chart-card-pdf">
                               <h3 className="text-sm font-semibold mb-2 text-center">Calorie Intake (kcal)</h3>
                               <DiaryChart data={prereqData.diaryEntries} chartType="calories" />
                           </div>
                           {showFluidChart && <div className="chart-card-pdf">
                               <h3 className="text-sm font-semibold mb-2 text-center">Fluid Intake (ml)</h3>
                               <DiaryChart data={prereqData.diaryEntries} chartType="fluid" />
                           </div>}
                           {showBloodPressureCharts && <>
                           <div className="chart-card-pdf">
                               <h3 className="text-sm font-semibold mb-2 text-center">Systolic Blood Pressure (mmHg)</h3>
                               <DiaryChart data={prereqData.diaryEntries} chartType="systolic" />
                           </div>
                           <div className="chart-card-pdf">
                               <h3 className="text-sm font-semibold mb-2 text-center">Diastolic Blood Pressure (mmHg)</h3>
                               <DiaryChart data={prereqData.diaryEntries} chartType="diastolic" />
                           </div>
                           <div className="chart-card-pdf">
                               <h3 className="text-sm font-semibold mb-2 text-center">Pulse (BPM)</h3>
                               <DiaryChart data={prereqData.diaryEntries} chartType="pulse" />
                           </div>
                           </>}
                           {showBloodSugarChart && <div className="chart-card-pdf">
                               <h3 className="text-sm font-semibold mb-2 text-center">Blood Sugar (mmol/L)</h3>
                               <DiaryChart data={prereqData.diaryEntries} chartType="bloodSugar" />
                           </div>}
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
      
        <div >
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
                {isLoading && !reportData && (
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
                {!isLoading && !error && !reportData && (
                    <div className="text-center py-20 rounded-lg border-2 border-dashed">
                    <h2 className="text-xl font-semibold">No report generated yet</h2>
                    <p className="text-muted-foreground mt-2">Have a chat or analyze a document, then click "Refresh Report".</p>
                    </div>
                )}
                {reportData && (
                    <div ref={reportRef}>
                        <article className="prose dark:prose-invert max-w-none text-foreground">
                            <h3>Personal Summary Report for {prereqData.userData.name || 'User'} on {new Date().toLocaleDateString()}</h3>
                            <blockquote>
                                **Disclaimer:** This report is a summary of the information you have provided. It is for personal reference only and should not be considered a medical document. Always consult with your healthcare provider for official information and advice.
                            </blockquote>
                            {reportSections.map(section => (
                                !section.hideToggle && section.content ? (
                                    <div key={section.key}>{renderSection(section.content)}</div>
                                ) : null
                            ))}
                        </article>
                    </div>
                )}
                </CardContent>
            </Card>
        </div>
       </div>
       <style jsx global>{`
          .pdf-render {
            font-size: 10px;
          }
          .pdf-render h1, .pdf-render h2, .pdf-render h3 {
            font-size: 18px;
            margin-top: 1.2em;
            margin-bottom: 0.6em;
          }
          .pdf-render h4 {
            font-size: 14px;
          }
           .pdf-render p, .pdf-render li {
            font-size: 10px;
          }
        `}</style>
    </div>
  )
}
