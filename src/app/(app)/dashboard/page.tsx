"use client"

import { useState, useEffect, useRef } from "react"
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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { MessageSquare, FileText, Mic, PlusCircle, Loader2, StopCircle } from "lucide-react"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useToast } from "@/hooks/use-toast"
import { summarizeVoiceNote } from "@/ai/flows/summarize-voice-note"

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

interface VoiceNote {
  id: string;
  title: string;
  summary: string;
  audioUrl: string;
  date: string;
}

type ActivityItem = 
  | { type: 'conversation', data: ConversationSummary }
  | { type: 'analysis', data: AnalysisResult }
  | { type: 'voiceNote', data: VoiceNote };


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

function RecordVoiceNoteDialog({ onRecordingComplete }: { onRecordingComplete: (newNote: VoiceNote) => void }) {
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const audioChunks = useRef<Blob[]>([]);
  const mediaRecorder = useRef<MediaRecorder | null>(null);

  const handleStartRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      
      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };
      
      mediaRecorder.current.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // The final transcript state is used here for summarization
        if (!transcript.trim()) {
           toast({ title: "No speech detected", description: "Please try recording again.", variant: "destructive" });
           setIsProcessing(false);
           setIsRecording(false);
           return;
        }

        try {
            const result = await summarizeVoiceNote({ transcript });

            const newNote: VoiceNote = {
              id: new Date().toISOString(),
              title,
              summary: result.summary,
              audioUrl,
              date: new Date().toISOString(),
            };
            
            onRecordingComplete(newNote);
            document.getElementById('close-record-dialog')?.click();
            resetState();

        } catch(error) {
            console.error("Failed to summarize voice note:", error);
            toast({ title: "Summarization Failed", description: "Could not summarize the voice note.", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
      };
      
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({ title: "Microphone access denied", description: "Please allow microphone access in your browser settings.", variant: "destructive" });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop(); // This triggers the onstop handler
      setIsRecording(false);
    }
  };

  const resetState = () => {
      setTitle("");
      setTranscript("");
      setIsRecording(false);
      setIsProcessing(false);
      audioChunks.current = [];
      if (mediaRecorder.current) {
         mediaRecorder.current.onstop = null;
         mediaRecorder.current = null;
      }
  }

  const { isListening, startListening, stopListening } = useSpeechRecognition({
      onTranscript: setTranscript,
      onComplete: handleStopRecording,
  });

  const toggleRecording = () => {
      if (isListening) {
          stopListening(); // This will trigger onComplete -> handleStopRecording
      } else {
          if (!title.trim()) {
              toast({ title: "Title Required", description: "Please enter a title for your voice note first.", variant: "destructive"});
              return;
          }
          setTranscript("");
          handleStartRecording(); // Manages MediaRecorder
          startListening();     // Manages SpeechRecognition
      }
  }

  return (
    <Dialog onOpenChange={(open) => !open && resetState()}>
      <DialogTrigger asChild>
         <Button>
            <Mic className="mr-2" />
            Record a Voice Note
         </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a Voice Note</DialogTitle>
          <DialogDescription>
            Record a memo, meeting, or phone call. It will be transcribed and summarized for you.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="note-title">Title</Label>
                <Input id="note-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., 'Meeting with Dr. Smith'" />
            </div>
            <div className="space-y-2">
                <Label>Recording</Label>
                <Card className="flex flex-col items-center justify-center p-6 bg-secondary/50">
                     <Button 
                        size="lg" 
                        variant={isListening ? "destructive" : "default"}
                        className="h-16 w-16 rounded-full shadow-lg"
                        onClick={toggleRecording}
                        disabled={!title.trim() || isProcessing}
                     >
                        {isListening ? <StopCircle className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                     </Button>
                     <p className="text-sm text-muted-foreground mt-4">
                        {isProcessing ? "Processing..." : (isListening ? "Listening..." : "Tap to record")}
                     </p>
                </Card>
                {transcript && <p className="text-xs text-muted-foreground p-2 border rounded-md h-20 overflow-y-auto">{transcript}</p>}
            </div>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={toggleRecording} disabled={!isListening && !isRecording || isProcessing}>
                 {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : <StopCircle className="mr-2" />}
                Stop & Summarize
            </Button>
        </DialogFooter>
        <DialogClose id="close-record-dialog" className="hidden" />
      </DialogContent>
    </Dialog>
  );
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
                 <Link href={`/support-chat?id=${summary.id}`} className="mt-4">
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

function VoiceNoteCard({ note }: { note: VoiceNote }) {
    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Mic className="w-5 h-5 text-primary" />
                    {note.title}
                </CardTitle>
                <CardDescription>{new Date(note.date).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
                 <p className="text-sm text-muted-foreground line-clamp-3">{note.summary}</p>
                 <div className="mt-4">
                    <audio src={note.audioUrl} controls className="w-full h-10" />
                 </div>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
    const [activity, setActivity] = useState<ActivityItem[]>([]);

    const loadActivity = () => {
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
            
            const storedVoiceNotes = localStorage.getItem("voiceNotes");
            if (storedVoiceNotes) {
                const notes: VoiceNote[] = JSON.parse(storedVoiceNotes);
                allActivity.push(...notes.map(n => ({ type: 'voiceNote' as const, data: n })));
            }

            // Sort all activities by date, most recent first
            allActivity.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
            
            setActivity(allActivity);
        } catch (error) {
            console.error("Could not load activity from localStorage", error);
        }
    }

    useEffect(() => {
        loadActivity();
    }, []);

    const handleNewVoiceNote = (newNote: VoiceNote) => {
        const storedNotes = localStorage.getItem("voiceNotes");
        const notes: VoiceNote[] = storedNotes ? JSON.parse(storedNotes) : [];
        notes.unshift(newNote);
        localStorage.setItem("voiceNotes", JSON.stringify(notes));
        loadActivity(); // Reload all activity to display the new note
    };


    return (
        <div className="p-4 md:p-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Activity Overview</h1>
                    <p className="text-muted-foreground">
                        Here&apos;s a summary of your recent conversations and document analyses.
                    </p>
                </div>
                <RecordVoiceNoteDialog onRecordingComplete={handleNewVoiceNote} />
            </div>

            {activity.length > 0 ? (
                 <section>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {activity.map((item, index) => {
                            if (item.type === 'conversation') {
                                return <ConversationCard key={`convo-${item.data.id}`} summary={item.data} />;
                            }
                            if (item.type === 'analysis') {
                                return <AnalysisCard key={`analysis-${item.data.id}`} result={item.data} />;
                            }
                            if (item.type === 'voiceNote') {
                                return <VoiceNoteCard key={`note-${item.data.id}`} note={item.data} />;
                            }
                            return null;
                        })}
                    </div>
                </section>
            ) : (
                 <div className="text-center py-20 rounded-lg border-2 border-dashed">
                    <h2 className="text-xl font-semibold">No Activity Yet</h2>
                    <p className="text-muted-foreground mt-2">Your recent activity will appear here.</p>
                     <div className="mt-6">
                        <Link href="/document-analysis">
                             <Button variant="outline" className="mr-4">
                                <FileText className="mr-2" />
                                Analyze a Document
                             </Button>
                        </Link>
                         <RecordVoiceNoteDialog onRecordingComplete={handleNewVoiceNote} />
                    </div>
                </div>
            )}
        </div>
    )
}

    