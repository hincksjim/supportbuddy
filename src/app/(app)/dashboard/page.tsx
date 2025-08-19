
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
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, FileText, Mic, PlusCircle, Loader2, StopCircle, X, Bookmark, User, Heart, Landmark, NotebookPen, Handshake, Trash2, Gavel } from "lucide-react"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useToast } from "@/hooks/use-toast"
import { summarizeVoiceNote } from "@/ai/flows/summarize-voice-note"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

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

interface TextNote {
  id: string;
  type: 'textNote';
  title: string;
  content: string;
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

interface ActionItem {
    id: string;
    description: string;
    assignedTo: string[]; // Attendee names
    dueDate: string | null; // ISO date string
    priority: 'low' | 'medium' | 'high';
}

interface MeetingNote {
    id: string;
    type: 'meetingNote';
    date: string; // ISO date string
    location: 'in-person' | 'phone' | 'video-call';
    attendees: string[];
    subject: string;
    notes: string;
    actions: ActionItem[];
}

interface StoredConversation {
    id: string;
    messages: object[];
}

type ActivityItem = 
  | { type: 'conversation', data: ConversationSummary }
  | { type: 'analysis', data: AnalysisResult }
  | { type: 'voiceNote', data: VoiceNote }
  | { type: 'textNote', data: TextNote }
  | { type: 'meetingNote', data: MeetingNote }
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

function AddMeetingNoteDialog({ onNoteAdded }: { onNoteAdded: (note: MeetingNote) => void }) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [location, setLocation] = useState<'in-person' | 'phone' | 'video-call'>('in-person');
    const [attendees, setAttendees] = useState('');
    const [subject, setSubject] = useState('');
    const [notes, setNotes] = useState('');
    const [actions, setActions] = useState<ActionItem[]>([]);
    const { toast } = useToast();

    const attendeesList = attendees.split(',').map(a => a.trim()).filter(Boolean);

    const addAction = () => {
        setActions([...actions, { id: new Date().toISOString(), description: '', assignedTo: [], dueDate: null, priority: 'medium' }]);
    };
    
    const updateAction = (id: string, field: keyof ActionItem, value: any) => {
        setActions(actions.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const deleteAction = (id: string) => {
        setActions(actions.filter(a => a.id !== id));
    }

    const handleSave = () => {
        if (!date || !subject.trim() || !attendees.trim()) {
            toast({
                title: 'Date, Subject, and Attendees are required',
                variant: 'destructive',
            });
            return;
        }

        const newNote: MeetingNote = {
            id: new Date().toISOString(),
            type: 'meetingNote',
            date: date.toISOString(),
            location,
            attendees: attendeesList,
            subject,
            notes,
            actions,
        };

        onNoteAdded(newNote);
        setDate(new Date());
        setLocation('in-person');
        setAttendees('');
        setSubject('');
        setNotes('');
        setActions([]);
        document.getElementById('close-meeting-note-dialog')?.click();
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary">
                    <Handshake className="mr-2" />
                    Log a Meeting
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Log a New Meeting</DialogTitle>
                    <DialogDescription>
                        Record important details and action items from your meeting.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                             <Label>Location</Label>
                             <Select value={location} onValueChange={(v) => setLocation(v as any)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="in-person">In-Person</SelectItem>
                                    <SelectItem value="phone">Phone Call</SelectItem>
                                    <SelectItem value="video-call">Video Call</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="meeting-subject">Subject / Regarding</Label>
                        <Input id="meeting-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., 'MDT Meeting Results'" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="meeting-attendees">Attendees</Label>
                        <Input id="meeting-attendees" value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="Names, separated by commas" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="meeting-notes">Notes</Label>
                        <Textarea id="meeting-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} placeholder="Key discussion points, decisions, etc." />
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-semibold">Action Items</h4>
                        {actions.map(action => (
                            <Card key={action.id} className="p-4 bg-muted/50">
                               <div className="flex justify-end mb-2">
                                     <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteAction(action.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                               </div>
                               <div className="space-y-4">
                                 <Textarea placeholder="Action description..." value={action.description} onChange={(e) => updateAction(action.id, 'description', e.target.value)} />
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                         <Label>Due Date</Label>
                                         <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {action.dueDate ? format(new Date(action.dueDate), "PPP") : "No due date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={action.dueDate ? new Date(action.dueDate) : undefined} onSelect={(d) => updateAction(action.id, 'dueDate', d?.toISOString() || null)} /></PopoverContent>
                                        </Popover>
                                     </div>
                                     <div className="space-y-2">
                                         <Label>Priority</Label>
                                         <Select value={action.priority} onValueChange={(v) => updateAction(action.id, 'priority', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                         </Select>
                                     </div>
                                 </div>
                                  <div className="space-y-2">
                                    <Label>Assigned To</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {attendeesList.map(person => (
                                            <div key={person} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`assign-${action.id}-${person}`}
                                                    checked={action.assignedTo.includes(person)}
                                                    onCheckedChange={(checked) => {
                                                        const newAssigned = checked
                                                            ? [...action.assignedTo, person]
                                                            : action.assignedTo.filter(p => p !== person);
                                                        updateAction(action.id, 'assignedTo', newAssigned);
                                                    }}
                                                />
                                                <label htmlFor={`assign-${action.id}-${person}`} className="text-sm font-medium">{person}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                               </div>
                            </Card>
                        ))}
                         <Button variant="outline" size="sm" onClick={addAction}>
                            <PlusCircle className="mr-2" /> Add Action Item
                        </Button>
                    </div>

                </div>
                <DialogFooter>
                    <DialogClose id="close-meeting-note-dialog" asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSave}>Save Meeting Note</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


function AddTextNoteDialog({ onNoteAdded }: { onNoteAdded: (note: TextNote) => void }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const { toast } = useToast();

    const handleSave = () => {
        if (!title.trim() || !content.trim()) {
            toast({
                title: 'Title and content are required',
                variant: 'destructive',
            });
            return;
        }

        const newNote: TextNote = {
            id: new Date().toISOString(),
            type: 'textNote',
            title,
            content,
            date: new Date().toISOString(),
        };

        onNoteAdded(newNote);
        setTitle('');
        setContent('');
        document.getElementById('close-text-note-dialog')?.click();
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary">
                    <NotebookPen className="mr-2" />
                    Add a Note
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add a New Note</DialogTitle>
                    <DialogDescription>
                        Save a quick note, reminder, or details from a call.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="note-title">Title</Label>
                        <Input id="note-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., 'Call with Macmillan'" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="note-content">Content</Label>
                        <Textarea id="note-content" value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Jot down your notes here..." />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose id="close-text-note-dialog" asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSave}>Save Note</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
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

function ViewTextNoteDialog({ note, children }: { note: TextNote; children: React.ReactNode }) {
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{note.title}</DialogTitle>
                    <DialogDescription>
                        Note from {new Date(note.date).toLocaleDateString()}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ViewMeetingNoteDialog({ note, children }: { note: MeetingNote; children: React.ReactNode }) {
    const priorityColor = {
        low: "text-green-500",
        medium: "text-yellow-500",
        high: "text-red-500",
    };
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{note.subject}</DialogTitle>
                    <DialogDescription>
                        Meeting on {new Date(note.date).toLocaleDateString()} &bull; {note.location}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[70vh] overflow-y-auto space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm">Attendees</h4>
                        <p className="text-sm text-muted-foreground">{note.attendees.join(', ')}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm">Notes</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.notes || "No notes were taken."}</p>
                    </div>
                    {note.actions.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-sm">Action Items</h4>
                            <div className="space-y-2 mt-2">
                                {note.actions.map(action => (
                                    <div key={action.id} className="p-3 border rounded-md bg-muted/50">
                                        <p className="text-sm">{action.description}</p>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                                            <span><strong>To:</strong> {action.assignedTo.join(', ')}</span>
                                            <span className={cn(priorityColor[action.priority])}>
                                                <strong>Priority:</strong> {action.priority.toUpperCase()}
                                            </span>
                                            <span><strong>Due:</strong> {action.dueDate ? new Date(action.dueDate).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="secondary">Close</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function MeetingNoteCard({ note, onDelete }: { note: MeetingNote, onDelete: (id: string, type: ActivityItem['type']) => void }) {
    return (
         <div className="relative group h-full">
            <ViewMeetingNoteDialog note={note}>
                <Card className="flex flex-col h-full cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Handshake className="w-5 h-5 text-primary" />
                            {note.subject}
                        </CardTitle>
                        <CardDescription>{new Date(note.date).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground line-clamp-2"><strong>Attendees:</strong> {note.attendees.join(', ')}</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3 mt-2">{note.notes || "No notes for this meeting."}</p>
                    </CardContent>
                </Card>
            </ViewMeetingNoteDialog>
            <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(note.id, 'meetingNote'); }}
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Delete</span>
            </Button>
        </div>
    );
}


function TextNoteCard({ note, onDelete }: { note: TextNote, onDelete: (id: string, type: ActivityItem['type']) => void }) {
    return (
        <div className="relative group h-full">
            <ViewTextNoteDialog note={note}>
                <Card className="flex flex-col h-full cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <NotebookPen className="w-5 h-5 text-primary" />
                            {note.title}
                        </CardTitle>
                        <CardDescription>{new Date(note.date).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-5">{note.content}</p>
                    </CardContent>
                </Card>
            </ViewTextNoteDialog>
            <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete(note.id, 'textNote');
                }}
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Delete</span>
            </Button>
        </div>
    );
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
                const summaries: (ConversationSummary | SavedMessage | ProfileUpdateActivity | TextNote | MeetingNote)[] = JSON.parse(storedSummaries);
                summaries.forEach(s => {
                    if ('type' in s && s.type === 'savedMessage') {
                         allActivity.push({ type: 'savedMessage', data: s });
                    } else if ('type' in s && s.type === 'profileUpdate') {
                        allActivity.push({ type: 'profileUpdate', data: s });
                    } else if ('type' in s && s.type === 'textNote') {
                        allActivity.push({ type: 'textNote', data: s });
                    } else if ('type' in s && s.type === 'meetingNote') {
                        allActivity.push({ type: 'meetingNote', data: s });
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

    const handleNewTextOrMeetingNote = (newNote: TextNote | MeetingNote) => {
        if (!currentUserEmail) return;
        // Text and meeting notes are stored in the same place as conversation summaries for simplicity
        const storageKey = `conversationSummaries_${currentUserEmail}`;
        const storedItems = localStorage.getItem(storageKey);
        const items = storedItems ? JSON.parse(storedItems) : [];
        items.unshift(newNote);
        localStorage.setItem(storageKey, JSON.stringify(items));
        loadActivity();
    }

    const handleDelete = (id: string, type: ActivityItem['type']) => {
        if (!currentUserEmail) return;

        if (type === 'conversation' || type === 'savedMessage' || type === 'profileUpdate' || type === 'textNote' || type === 'meetingNote') {
            const key = `conversationSummaries_${currentUserEmail}`;
            const stored = localStorage.getItem(key);
            const items: (ConversationSummary | SavedMessage | ProfileUpdateActivity | TextNote | MeetingNote)[] = stored ? JSON.parse(stored) : [];
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
                 <div className="flex items-center gap-2">
                    <AddMeetingNoteDialog onNoteAdded={handleNewTextOrMeetingNote} />
                    <AddTextNoteDialog onNoteAdded={handleNewTextOrMeetingNote} />
                    <RecordVoiceNoteDialog onRecordingComplete={handleNewVoiceNote} />
                 </div>
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
                            if (item.type === 'textNote') {
                                return <TextNoteCard key={`textnote-${item.data.id}-${index}`} note={item.data} onDelete={handleDelete} />;
                            }
                            if (item.type === 'meetingNote') {
                                return <MeetingNoteCard key={`meetingnote-${item.data.id}-${index}`} note={item.data} onDelete={handleDelete} />;
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
                     <div className="mt-6 flex items-center justify-center gap-4">
                        <Link href="/document-analysis">
                             <Button variant="outline">
                                <FileText className="mr-2" />
                                Analyze a Document
                             </Button>
                        </Link>
                         <AddTextNoteDialog onNoteAdded={handleNewTextOrMeetingNote} />
                         <RecordVoiceNoteDialog onRecordingComplete={handleNewVoiceNote} />
                    </div>
                </div>
            )}
        </div>
    )
}
