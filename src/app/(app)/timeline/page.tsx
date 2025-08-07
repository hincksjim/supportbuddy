
"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Zap, Check, Pencil, Save, Download } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

import { generateTreatmentTimeline, GenerateTreatmentTimelineOutput } from "@/ai/flows/generate-treatment-timeline"

interface Message {
  role: "user" | "assistant"
  content: string
}

type TimelineData = GenerateTreatmentTimelineOutput;

export default function TimelinePage() {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);
  const timelineDataRef = useRef(timelineData);
  const timelineCardRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    timelineDataRef.current = timelineData;
    if (timelineData && openAccordionItems.length === 0) {
        // Automatically open stages that are not fully completed on initial load
        const activeStages = timelineData.timeline
            .filter(stage => stage.steps.some(step => step.status !== 'completed'))
            .map(stage => stage.title);
        if(activeStages.length > 0) {
          setOpenAccordionItems(activeStages);
        } else if (timelineData.timeline.length > 0) {
          // if all are completed, open the first one
          setOpenAccordionItems([timelineData.timeline[0].title]);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineData]);

  useEffect(() => {
    const email = localStorage.getItem("currentUserEmail");
    setCurrentUserEmail(email);
  }, []);

  const loadData = () => {
    if (!currentUserEmail) return;
    try {
      // Load conversation history
      const storedHistory = localStorage.getItem(`conversationHistory_${currentUserEmail}`)
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory)
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          setConversationHistory(parsedHistory)
        }
      }
      // Load saved timeline
      const storedTimeline = localStorage.getItem(`treatmentTimeline_${currentUserEmail}`)
      if (storedTimeline) {
        setTimelineData(JSON.parse(storedTimeline))
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e)
      setError("Could not load your saved data. Please try generating a new timeline.")
    }
  }

  useEffect(() => {
    if (currentUserEmail) {
        loadData()
    }
    
    return () => {
        if (currentUserEmail && timelineDataRef.current) {
            saveTimeline(timelineDataRef.current);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserEmail])
  
  const saveTimeline = (data: TimelineData | null) => {
      if (!currentUserEmail || !data) return;
      try {
          localStorage.setItem(`treatmentTimeline_${currentUserEmail}`, JSON.stringify(data));
      } catch (e) {
          console.error("Failed to save timeline to localStorage", e);
          setError("Could not save your timeline progress.");
      }
  }

  const handleGenerateTimeline = async () => {
    if (conversationHistory.length < 2) {
      setError("You need to have a conversation with your support buddy first to generate a timeline.")
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const result = await generateTreatmentTimeline({
        conversationHistory: conversationHistory,
        existingTimeline: timelineData, // Pass the current timeline to the AI
      })
      setTimelineData(result)
      saveTimeline(result);
    } catch (err) {
      console.error("Failed to generate timeline:", err)
      setError("Sorry, there was an error generating your timeline. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleStepChange = (stageIndex: number, stepIndex: number, field: 'status' | 'notes', value: string | boolean) => {
      if (!timelineData) return;
      
      // Create a deep copy to avoid direct mutation
      const newTimelineData = JSON.parse(JSON.stringify(timelineData));
      const step = newTimelineData.timeline[stageIndex].steps[stepIndex];
      
      if (field === 'status') {
          step.status = value ? 'completed' : 'pending';
      } else if (field === 'notes') {
          step.notes = value as string;
      }
      
      setTimelineData(newTimelineData);
      // Changes are saved on component unmount
  }
  
  const handleDownloadPdf = async () => {
    const input = timelineCardRef.current;
    if (!input || !timelineData) {
        return;
    }
    setIsDownloading(true);

    // Save the original state of open accordion items
    const originalOpenItems = openAccordionItems;
    // Set all items to be open
    setOpenAccordionItems(timelineData.timeline.map(stage => stage.title));

    // Wait for the DOM to update with all accordions open
    setTimeout(async () => {
        try {
            const canvas = await html2canvas(input, {
                scale: 2,
                // Ensure it captures the full scroll height
                windowHeight: input.scrollHeight,
                windowWidth: input.scrollWidth, 
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgProps= pdf.getImageProperties(imgData);
            const imgWidth = imgProps.width;
            const imgHeight = imgProps.height;

            const ratio = imgWidth / imgHeight;
            let finalImgHeight = pdfHeight - 20; // with margin
            let finalImgWidth = finalImgHeight * ratio;

            if (finalImgWidth > pdfWidth) {
                finalImgWidth = pdfWidth - 20; // with margin
                finalImgHeight = finalImgWidth / ratio;
            }

            let heightLeft = imgHeight;
            let position = 0;
            const pageMargin = 10;

            pdf.addImage(imgData, 'PNG', pageMargin, position + pageMargin, finalImgWidth, finalImgHeight);
            heightLeft -= imgHeight;

            while (heightLeft > 0) {
                position -= (pdfHeight - (pageMargin * 2));
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', pageMargin, position + pageMargin, finalImgWidth, finalImgHeight);
                heightLeft -= imgHeight;
            }
            
            pdf.save('My-Treatment-Timeline.pdf');

        } catch (err) {
            console.error("PDF generation failed:", err);
            setError("Sorry, there was an error creating the PDF.");
        } finally {
            // Restore the original state of open accordion items
            setOpenAccordionItems(originalOpenItems);
            setIsDownloading(false);
        }
    }, 500); // A small delay to allow for re-rendering
};

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Interactive Timeline</h1>
          <p className="text-muted-foreground">
            A general guide to your journey. Mark steps complete and add notes.
          </p>
        </div>
         <div className="flex items-center gap-2">
            <Button onClick={handleGenerateTimeline} disabled={isLoading || conversationHistory.length < 2}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                {timelineData ? 'Re-generate Timeline' : 'Generate Timeline'}
            </Button>
             <Button onClick={handleDownloadPdf} disabled={isDownloading || !timelineData} variant="outline">
                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download PDF
            </Button>
         </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Generating your timeline...</p>
            </div>
          )}
          {error && (
            <div className="text-center py-20 text-destructive">
              <p>{error}</p>
            </div>
          )}
          {!isLoading && !error && !timelineData && (
            <div className="text-center py-20 rounded-lg border-2 border-dashed">
              <h2 className="text-xl font-semibold">Ready when you are</h2>
              <p className="text-muted-foreground mt-2">Have a chat with your Support Buddy, then click "Generate Timeline".</p>
            </div>
          )}
          {timelineData && (
            <div className="space-y-6" ref={timelineCardRef}>
                 <Alert>
                    <AlertTitle>Disclaimer</AlertTitle>
                    <AlertDescription>{timelineData.disclaimer}</AlertDescription>
                </Alert>
                <Accordion type="multiple" value={openAccordionItems} onValueChange={setOpenAccordionItems} className="w-full">
                    {timelineData.timeline.map((stage, stageIndex) => {
                        const isCompleted = stage.steps.every(step => step.status === 'completed');
                        return (
                            <AccordionItem value={stage.title} key={stageIndex} className={cn(isCompleted && "bg-muted/40 border-b-0 rounded-lg")}>
                                <AccordionTrigger className={cn("text-lg font-semibold px-4", isCompleted && "text-muted-foreground hover:no-underline")}>
                                   <div className="flex items-center gap-3">
                                     {isCompleted && <Check className="w-5 h-5 text-green-600" />}
                                     {stage.title}
                                   </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 px-4">
                                    <p className="text-muted-foreground">{stage.description}</p>
                                    {stage.steps.map((step, stepIndex) => (
                                        <div key={step.id} className="p-4 border rounded-lg space-y-3 bg-background">
                                           <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3">
                                                    <Checkbox 
                                                        id={`step-${step.id}`} 
                                                        className="mt-1"
                                                        checked={step.status === 'completed'}
                                                        onCheckedChange={(checked) => handleStepChange(stageIndex, stepIndex, 'status', !!checked)}
                                                    />
                                                    <div className="grid gap-0.5">
                                                        <label htmlFor={`step-${step.id}`} className="font-medium text-sm cursor-pointer">{step.title}</label>
                                                        <p className="text-xs text-muted-foreground">{step.description}</p>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-right text-muted-foreground shrink-0">{step.target}</div>
                                           </div>
                                           <div className="pl-7 space-y-2">
                                                <Label htmlFor={`notes-${step.id}`} className="text-xs font-semibold">My Notes</Label>
                                                <Textarea 
                                                    id={`notes-${step.id}`}
                                                    placeholder="Add notes about appointments, questions, etc..."
                                                    value={step.notes}
                                                    onChange={(e) => handleStepChange(stageIndex, stepIndex, 'notes', e.target.value)}
                                                    className="text-xs bg-background"
                                                />
                                           </div>
                                        </div>
                                    ))}
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
