
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { marked } from "marked"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { MessageSquare, FileText, Mic, PlusCircle, Loader2, StopCircle, X, Bookmark, User, Heart, Landmark } from "lucide-react"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useToast } from "@/hooks/use-toast"
import { summarizeVoiceNote } from "@/ai/flows/summarize-voice-note"

type Specialist = "medical" | "mental_health" | "financial";

const specialistConfig = {
    medical: { name: "Medical Expert", icon: User },
    mental_health: { name: "Mental Health Nurse", icon: Heart },
    financial: { name: "Financial Support Specialist", icon: Landmark },
}

// Interfaces matching the data stored in localStorage
interface ConversationSummary {
  id: string;
  title: string;
  summary: string;
  date: string; // ISO String
  specialist?: Specialist;
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

interface SavedMessage {
    id: string;
    type: 'savedMessage'; // To distinguish from other activity types
    title: string;
    content: string;
    date: string;
}

interface ProfileUpdateActivity {
  id: string;
  type: 'profileUpdate';
  title: string;
  content: string;
  date: string;
}

interface StoredConversation {
    id: string;
    messages: object[];
}

type ActivityItem = 
  | { type: 'conversation', data: ConversationSummary }
  | { type: 'analysis', data: AnalysisResult }
  | { type: 'voiceNote', data: VoiceNote }
  | { type: 'savedMessage', data: SavedMessage }
  | { type: 'profileUpdate', data: ProfileUpdateActivity };


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
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const audioChunks = useRef<Blob[]>([]);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const finalTranscriptRef = useRef(transcript);

  // Keep a ref to the latest transcript
  useEffect(() => {
    finalTranscriptRef.current = transcript;
  }, [transcript]);


  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      
      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };
      
      mediaRecorder.current.onstop = async () => {
        setIsProcessing(true);
        const currentTranscript = finalTranscriptRef.current;

        if (!currentTranscript.trim()) {
           toast({ title: "No speech detected", description: "Please try recording again.", variant: "destructive" });
           setIsProcessing(false);
           return;
        }

        try {
            const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const result = await summarizeVoiceNote({ transcript: currentTranscript });

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
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({ title: "Microphone access denied", description: "Please allow microphone access in your browser settings.", variant: "destructive" });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop(); // This triggers the onstop handler
    }
  };

  const resetState = () => {
      setTitle("");
      setTranscript("");
      setIsProcessing(false);
      audioChunks.current = [];
      if (mediaRecorder.current) {
         mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
         mediaRecorder.current = null;
      }
      finalTranscriptRef.current = "";
  }

  const { isListening, startListening, stopListening } = useSpeechRecognition({
      onTranscript: setTranscript,
      onComplete: handleStopRecording, // Call media recorder stop when speech recognition completes
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
  
  const handleSummarizeClick = () => {
    if (isListening) {
      stopListening(); // This should trigger the full completion chain
    }
  };


  return (
    <Dialog onOpenChange={(open) => { if (!open) { if (isListening) stopListening(); resetState(); } }}>
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
                <Input id="note-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., 'Meeting with Dr. Smith'" disabled={isListening || isProcessing} />
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
                <Button variant="ghost" onClick={() => { if(isListening) stopListening(); }}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleSummarizeClick} disabled={!isListening || isProcessing}>
                 {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : <StopCircle className="mr-2" />}
                Stop & Summarize
            </Button>
        </DialogFooter>
        <DialogClose id="close-record-dialog" className="hidden" />
      </DialogContent>
    </Dialog>
  );
}

function ConversationCard({ summary, onDelete }: { summary: ConversationSummary, onDelete: (id: string, type: ActivityItem['type']) => void }) {
    const specialistInfo = summary.specialist ? specialistConfig[summary.specialist] : { name: "Conversation", icon: MessageSquare };
    const SpecialistIcon = specialistInfo.icon;
    
    return (
        <Card className="flex flex-col h-full relative group">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <SpecialistIcon className="w-5 h-5 text-primary" />
                    {summary.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-xs">
                  <span>{new Date(summary.date).toLocaleDateString()}</span>
                  <span className="text-muted-foreground/80">&bull;</span>
                  <span>{specialistInfo.name}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
                 <p className="text-sm text-muted-foreground line-clamp-4">{summary.summary}</p>
                 <Link href={`/support-chat?id=${summary.id}`} className="mt-4">
                    <Button variant="link" className="px-0 pt-2">View conversation &rarr;</Button>
                 </Link>
            </CardContent>
            <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete(summary.id, 'conversation');
                }}
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Delete</span>
            </Button>
        </Card>
    )
}

function AnalysisCard({ result, onDelete }: { result: AnalysisResult, onDelete: (id: string, type: ActivityItem['type']) => void }) {
    return (
        <div className="relative group h-full">
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
         <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete(result.id, 'analysis');
                }}
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Delete</span>
            </Button>
        </div>
    )
}

function VoiceNoteCard({ note, onDelete }: { note: VoiceNote, onDelete: (id: string, type: ActivityItem['type']) => void }) {
    return (
        <Card className="flex flex-col h-full relative group">
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
            <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete(note.id, 'voiceNote');
                }}
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Delete</span>
            </Button>
        </Card>
    );
}

function SavedMessageCard({ message, onDelete }: { message: SavedMessage, onDelete: (id: string, type: ActivityItem['type']) => void }) {
    return (
        <Card className="flex flex-col h-full relative group">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Bookmark className="w-5 h-5 text-primary" />
                    {message.title}
                </CardTitle>
                <CardDescription>Saved on {new Date(message.date).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                 <p className="text-sm text-muted-foreground whitespace-pre-wrap">{message.content}</p>
            </CardContent>
             <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete(message.id, 'savedMessage');
                }}
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Delete</span>
            </Button>
        </Card>
    );
}

function ProfileUpdateCard({ activity, onDelete }: { activity: ProfileUpdateActivity, onDelete: (id: string, type: ActivityItem['type']) => void }) {
    return (
        <Card className="flex flex-col h-full relative group">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="w-5 h-5 text-primary" />
                    {activity.title}
                </CardTitle>
                <CardDescription>On {new Date(activity.date).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
                 <p className="text-sm text-muted-foreground">{activity.content}</p>
                 <Link href="/profile" className="mt-4">
                    <Button variant="link" className="px-0 pt-2">View profile &rarr;</Button>
                 </Link>
            </CardContent>
            <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete(activity.id, 'profileUpdate');
                }}
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Delete</span>
            </Button>
        </Card>
    )
}

export default function DashboardPage() {
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

    const loadActivity = useCallback(() => {
        if (!currentUserEmail) return;

        let allActivity: ActivityItem[] = [];

        try {
            const storedSummaries = localStorage.getItem(`conversationSummaries_${currentUserEmail}`);
            if (storedSummaries) {
                const summaries: (ConversationSummary | SavedMessage | ProfileUpdateActivity)[] = JSON.parse(storedSummaries);
                summaries.forEach(s => {
                    if ('type' in s && s.type === 'savedMessage') {
                         allActivity.push({ type: 'savedMessage', data: s });
                    } else if ('type' in s && s.type === 'profileUpdate') {
                        allActivity.push({ type: 'profileUpdate', data: s });
                    } else if (!('type' in s)) {
                         // This is a conversation summary
                        allActivity.push({ type: 'conversation', data: s as ConversationSummary });
                    }
                });
            }

            const storedAnalyses = localStorage.getItem(`analysisResults_${currentUserEmail}`);
            if (storedAnalyses) {
                const analyses: AnalysisResult[] = JSON.parse(storedAnalyses);
                allActivity.push(...analyses.map(a => ({ type: 'analysis' as const, data: a })));
            }
            
            const storedVoiceNotes = localStorage.getItem(`voiceNotes_${currentUserEmail}`);
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
    }, [currentUserEmail]);

    useEffect(() => {
        const email = localStorage.getItem("currentUserEmail");
        setCurrentUserEmail(email);

        // Add event listener to refresh data on focus
        // This helps when data changes in another tab
        const handleFocus = () => {
            loadActivity();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [loadActivity]);

    useEffect(() => {
        if(currentUserEmail) {
            loadActivity();
        }
    }, [currentUserEmail, loadActivity]);

    const handleNewVoiceNote = (newNote: VoiceNote) => {
        if (!currentUserEmail) return;
        const storageKey = `voiceNotes_${currentUserEmail}`;
        const storedNotes = localStorage.getItem(storageKey);
        const notes: VoiceNote[] = storedNotes ? JSON.parse(storedNotes) : [];
        notes.unshift(newNote);
        localStorage.setItem(storageKey, JSON.stringify(notes));
        loadActivity(); // Reload all activity to display the new note
    };

    const handleDelete = (id: string, type: ActivityItem['type']) => {
        if (!currentUserEmail) return;

        if (type === 'conversation' || type === 'savedMessage' || type === 'profileUpdate') {
            const key = `conversationSummaries_${currentUserEmail}`;
            const stored = localStorage.getItem(key);
            const items: (ConversationSummary | SavedMessage | ProfileUpdateActivity)[] = stored ? JSON.parse(stored) : [];
            const updatedItems = items.filter(item => item.id !== id);
            localStorage.setItem(key, JSON.stringify(updatedItems));

            if (type === 'conversation') {
                const allConvosKey = `allConversations_${currentUserEmail}`;
                const storedConvos = localStorage.getItem(allConvosKey);
                const convos: StoredConversation[] = storedConvos ? JSON.parse(storedConvos) : [];
                const updatedConvos = convos.filter(c => c.id !== id);
                localStorage.setItem(allConvosKey, JSON.stringify(updatedConvos));
            }
        } else if (type === 'analysis') {
            const key = `analysisResults_${currentUserEmail}`;
            const stored = localStorage.getItem(key);
            const items: AnalysisResult[] = stored ? JSON.parse(stored) : [];
            const updatedItems = items.filter(item => item.id !== id);
            localStorage.setItem(key, JSON.stringify(updatedItems));
        } else if (type === 'voiceNote') {
            const key = `voiceNotes_${currentUserEmail}`;
            const stored = localStorage.getItem(key);
            const items: VoiceNote[] = stored ? JSON.parse(stored) : [];
            const updatedItems = items.filter(item => item.id !== id);
            localStorage.setItem(key, JSON.stringify(updatedItems));
        }
        loadActivity(); // Refresh the list
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
                                return <ConversationCard key={`convo-${item.data.id}-${index}`} summary={item.data} onDelete={handleDelete} />;
                            }
                            if (item.type === 'analysis') {
                                return <AnalysisCard key={`analysis-${item.data.id}-${index}`} result={item.data} onDelete={handleDelete} />;
                            }
                            if (item.type === 'voiceNote') {
                                return <VoiceNoteCard key={`note-${item.data.id}-${index}`} note={item.data} onDelete={handleDelete} />;
                            }
                            if (item.type === 'savedMessage') {
                                return <SavedMessageCard key={`saved-${item.data.id}-${index}`} message={item.data} onDelete={handleDelete} />;
                            }
                            if (item.type === 'profileUpdate') {
                                return <ProfileUpdateCard key={`profile-${item.data.id}-${index}`} activity={item.data} onDelete={handleDelete} />;
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
