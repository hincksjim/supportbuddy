"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Zap } from "lucide-react"
import { marked } from "marked"

import { generateTreatmentTimeline } from "@/ai/flows/generate-treatment-timeline"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function TimelinePage() {
  const [timelineHtml, setTimelineHtml] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem("conversationHistory")
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory)
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          setConversationHistory(parsedHistory)
        }
      }
    } catch (e) {
      console.error("Failed to load conversation history from localStorage", e)
      setError("Could not load your conversation history. Please start a new chat.")
    }
  }, [])

  const handleGenerateTimeline = async () => {
    if (conversationHistory.length < 2) {
      setError("You need to have a conversation with your support buddy first to generate a timeline.")
      return
    }

    setIsLoading(true)
    setError(null)
    setTimelineHtml(null)

    try {
      const result = await generateTreatmentTimeline({
        conversationHistory: conversationHistory,
      })
      const html = marked.parse(result.timeline)
      setTimelineHtml(html as string)
    } catch (err) {
      console.error("Failed to generate timeline:", err)
      setError("Sorry, there was an error generating your timeline. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Illustrative Timeline</h1>
          <p className="text-muted-foreground">
            Generate a general timeline of a typical treatment journey based on your conversation.
          </p>
        </div>
        <Button onClick={handleGenerateTimeline} disabled={isLoading || conversationHistory.length < 2}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Zap className="mr-2 h-4 w-4" />
          )}
          Generate Timeline
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Journey Overview</CardTitle>
          <CardDescription>
            This is a general guide. Your actual path may vary. Always consult your medical team for personal advice.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
          {!isLoading && !error && !timelineHtml && (
            <div className="text-center py-20 rounded-lg border-2 border-dashed">
              <h2 className="text-xl font-semibold">Ready when you are</h2>
              <p className="text-muted-foreground mt-2">Click the "Generate Timeline" button to see an example journey.</p>
            </div>
          )}
          {timelineHtml && (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: timelineHtml }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
