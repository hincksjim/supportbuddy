"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Zap, Check, Pencil, Save } from "lucide-react"
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

import { generateTreatmentTimeline, GenerateTreatmentTimelineOutput } from "@/ai/flows/generate-treatment-timeline"

interface Message {
  role: "user" | "assistant"
  content: string
}

type TimelineData = GenerateTreatmentTimelineOutput;

export default function TimelinePage() {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadData = () => {
    try {
      // Load conversation history
      const storedHistory = localStorage.getItem("conversationHistory")
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory)
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          setConversationHistory(parsedHistory)
        }
      }
      // Load saved timeline
      const storedTimeline = localStorage.getItem("treatmentTimeline")
      if (storedTimeline) {
        setTimelineData(JSON.parse(storedTimeline))
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e)
      setError("Could not load your saved data. Please try generating a new timeline.")
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  
  const saveTimeline = (data: TimelineData) => {
      try {
          localStorage.setItem("treatmentTimeline", JSON.stringify(data));
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
    setTimelineData(null) // Clear existing timeline

    try {
      const result = await generateTreatmentTimeline({
        conversationHistory: conversationHistory,
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
      
      const newTimelineData = { ...timelineData };
      const step = newTimelineData.timeline[stageIndex].steps[stepIndex];
      
      if (field === 'status') {
          step.status = value ? 'completed' : 'pending';
      } else if (field === 'notes') {
          step.notes = value as string;
      }
      
      setTimelineData(newTimelineData);
      saveTimeline(newTimelineData);
  }

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Interactive Timeline</h1>
          <p className="text-muted-foreground">
            A general guide to your journey. Mark steps complete and add notes.
          </p>
        </div>
        <Button onClick={handleGenerateTimeline} disabled={isLoading || conversationHistory.length < 2}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
          {timelineData ? 'Re-generate Timeline' : 'Generate Timeline'}
        </Button>
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
            <div className="space-y-6">
                 <Alert>
                    <AlertTitle>Disclaimer</AlertTitle>
                    <AlertDescription>{timelineData.disclaimer}</AlertDescription>
                </Alert>
                <Accordion type="multiple" defaultValue={timelineData.timeline.map(s => s.title)} className="w-full">
                    {timelineData.timeline.map((stage, stageIndex) => (
                        <AccordionItem value={stage.title} key={stageIndex}>
                            <AccordionTrigger className="text-lg font-semibold">
                                {stage.title}
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                                <p className="text-muted-foreground">{stage.description}</p>
                                {stage.steps.map((step, stepIndex) => (
                                    <div key={step.id} className="p-4 border rounded-lg space-y-3 bg-secondary/30">
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
                    ))}
                </Accordion>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
