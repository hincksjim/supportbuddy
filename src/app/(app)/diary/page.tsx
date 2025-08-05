
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Slider } from "@/components/ui/slider"
import { PlusCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Data structure for a diary entry
export interface DiaryEntry {
  id: string; // ISO date string 'YYYY-MM-DD'
  date: string; // ISO date string
  mood: 'great' | 'good' | 'meh' | 'bad' | 'awful' | null;
  diagnosisMood: 'great' | 'good' | 'meh' | 'bad' | 'awful' | null;
  treatmentMood: 'great' | 'good' | 'meh' | 'bad' | 'awful' | null;
  painScore: number | null;
  weight: string;
  sleep: string;
  food: string;
  worriedAbout: string;
  positiveAbout: string;
  notes: string;
}

const moodOptions: { [key in NonNullable<DiaryEntry['mood']>]: string } = {
    great: '😊',
    good: '🙂',
    meh: '😐',
    bad: '😟',
    awful: '😢'
}

const moodValueMap: { [key: number]: DiaryEntry['mood'] } = {
    1: 'awful',
    2: 'bad',
    3: 'meh',
    4: 'good',
    5: 'great'
}

const moodToValue = (mood: DiaryEntry['mood']): number => {
    if (mood === 'awful') return 1;
    if (mood === 'bad') return 2;
    if (mood === 'meh') return 3;
    if (mood === 'good') return 4;
    if (mood === 'great') return 5;
    return 3; // Default to 'meh'
}


const painEmojis = [
    '🙂', // 0
    '😊', // 1
    '😕', // 2
    '😐', // 3
    '😟', // 4
    '🙁', // 5
    '😣', // 6
    '😖', // 7
    '😫', // 8
    '😩', // 9
    '😭'  // 10
];


function DiaryEntryDialog({ onSave, existingEntry }: { onSave: (entry: DiaryEntry) => void; existingEntry?: DiaryEntry | null; }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [mood, setMood] = useState<DiaryEntry['mood']>('meh');
    const [diagnosisMood, setDiagnosisMood] = useState<DiaryEntry['diagnosisMood']>('meh');
    const [treatmentMood, setTreatmentMood] = useState<DiaryEntry['treatmentMood']>('meh');
    const [painScore, setPainScore] = useState<DiaryEntry['painScore']>(0);
    const [weight, setWeight] = useState('');
    const [sleep, setSleep] = useState('');
    const [food, setFood] = useState('');
    const [worriedAbout, setWorriedAbout] = useState('');
    const [positiveAbout, setPositiveAbout] = useState('');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const entryToEdit = existingEntry || {
            id: new Date().toISOString().split('T')[0],
            date: new Date().toISOString(),
            mood: 'meh',
            diagnosisMood: 'meh',
            treatmentMood: 'meh',
            painScore: 0,
            weight: '',
            sleep: '',
            food: '',
            worriedAbout: '',
            positiveAbout: '',
            notes: ''
        };

        setDate(new Date(entryToEdit.date).toISOString().split('T')[0]);
        setMood(entryToEdit.mood);
        setDiagnosisMood(entryToEdit.diagnosisMood);
        setTreatmentMood(entryToEdit.treatmentMood);
        setPainScore(entryToEdit.painScore);
        setWeight(entryToEdit.weight);
        setSleep(entryToEdit.sleep);
        setFood(entryToEdit.food);
        setWorriedAbout(entryToEdit.worriedAbout);
        setPositiveAbout(entryToEdit.positiveAbout);
        setNotes(entryToEdit.notes);
    }, [existingEntry]);

    const handleSave = () => {
        setIsSaving(true);
        const entry: DiaryEntry = {
            id: date,
            date: new Date(date).toISOString(),
            mood,
            diagnosisMood,
            treatmentMood,
            painScore,
            weight,
            sleep,
            food,
            worriedAbout,
            positiveAbout,
            notes
        };
        onSave(entry);
        setIsSaving(false);
        document.getElementById(`close-diary-dialog-${existingEntry?.id || 'new'}`)?.click();
    };
    
    return (
        <Dialog>
             <DialogTrigger asChild>
                {existingEntry ? (
                     <Button variant="outline" size="sm">Edit</Button>
                ) : (
                    <Button size="lg" className="fixed bottom-24 right-6 h-16 w-16 rounded-full shadow-lg md:bottom-8 md:right-8">
                        <PlusCircle className="h-8 w-8" />
                        <span className="sr-only">Add New Diary Entry</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{existingEntry ? 'Edit' : 'New'} Diary Entry</DialogTitle>
                    <DialogDescription>Log how you're feeling and other key factors for today.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                   <div className="space-y-2">
                        <Label>How are you feeling overall?</Label>
                        <div className="flex items-center gap-4">
                           <span className="text-4xl">{moodOptions[mood ?? 'meh']}</span>
                           <Slider 
                            value={[moodToValue(mood)]} 
                            onValueChange={(value) => setMood(moodValueMap[value[0]])}
                            max={5}
                            min={1}
                            step={1}
                           />
                           <span className="font-bold w-6 text-center">{moodToValue(mood)}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>How are you feeling about your diagnosis?</Label>
                        <div className="flex items-center gap-4">
                           <span className="text-4xl">{moodOptions[diagnosisMood ?? 'meh']}</span>
                           <Slider 
                            value={[moodToValue(diagnosisMood)]} 
                            onValueChange={(value) => setDiagnosisMood(moodValueMap[value[0]])}
                            max={5}
                            min={1}
                            step={1}
                           />
                            <span className="font-bold w-6 text-center">{moodToValue(diagnosisMood)}</span>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>How are you feeling about your treatment?</Label>
                        <div className="flex items-center gap-4">
                           <span className="text-4xl">{moodOptions[treatmentMood ?? 'meh']}</span>
                           <Slider 
                            value={[moodToValue(treatmentMood)]} 
                            onValueChange={(value) => setTreatmentMood(moodValueMap[value[0]])}
                            max={5}
                            min={1}
                            step={1}
                           />
                           <span className="font-bold w-6 text-center">{moodToValue(treatmentMood)}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Pain Score (0=No Pain, 10=Severe)</Label>
                        <div className="flex items-center gap-4">
                           <span className="text-4xl">{painEmojis[painScore ?? 0]}</span>
                           <Slider 
                            value={[painScore ?? 0]} 
                            onValueChange={(value) => setPainScore(value[0])}
                            max={10}
                            step={1}
                           />
                           <span className="font-bold w-6 text-center">{painScore ?? 0}</span>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="weight">Weight (kg)</Label>
                            <Input id="weight" type="number" placeholder="e.g., 70.5" value={weight} onChange={(e) => setWeight(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="sleep">Sleep (hours)</Label>
                            <Input id="sleep" type="number" placeholder="e.g., 7.5" value={sleep} onChange={(e) => setSleep(e.target.value)} />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="food">Food Intake</Label>
                        <Textarea id="food" placeholder="e.g., Breakfast: Porridge, Lunch: Soup..." value={food} onChange={(e) => setFood(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="worried-about">Worried About</Label>
                        <Textarea id="worried-about" placeholder="What's on your mind? Any specific fears or concerns?" value={worriedAbout} onChange={(e) => setWorriedAbout(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="positive-about">Feeling Positive About</Label>
                        <Textarea id="positive-about" placeholder="What went well today? Any small wins or things you're grateful for?" value={positiveAbout} onChange={(e) => setPositiveAbout(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Other Notes</Label>
                        <Textarea id="notes" placeholder="Any other symptoms, thoughts, or medical facts to note?" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                </div>
                 <DialogFooter>
                    <DialogClose id={`close-diary-dialog-${existingEntry?.id || 'new'}`} asChild>
                         <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="animate-spin mr-2" />}
                        Save Entry
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function DiaryEntryCard({ entry, onSave }: { entry: DiaryEntry; onSave: (entry: DiaryEntry) => void; }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-xl">{new Date(entry.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardTitle>
                        <CardDescription>Your log for this day</CardDescription>
                    </div>
                     <div className="flex flex-col items-end gap-2 text-sm text-muted-foreground">
                        {entry.mood && (
                            <div className="flex items-center gap-2" title={`Overall Mood: ${entry.mood}`}>
                                <span>Overall:</span>
                                <span className="text-xl">{moodOptions[entry.mood]}</span>
                                <span className="font-semibold">{moodToValue(entry.mood)}/5</span>
                            </div>
                        )}
                        {entry.diagnosisMood && (
                             <div className="flex items-center gap-2" title={`Diagnosis Mood: ${entry.diagnosisMood}`}>
                                <span>Diagnosis:</span>
                                <span className="text-xl">{moodOptions[entry.diagnosisMood]}</span>
                                 <span className="font-semibold">{moodToValue(entry.diagnosisMood)}/5</span>
                            </div>
                        )}
                        {entry.treatmentMood && (
                            <div className="flex items-center gap-2" title={`Treatment Mood: ${entry.treatmentMood}`}>
                                <span>Treatment:</span>
                                <span className="text-xl">{moodOptions[entry.treatmentMood]}</span>
                                 <span className="font-semibold">{moodToValue(entry.treatmentMood)}/5</span>
                            </div>
                        )}
                        {entry.painScore !== null && typeof entry.painScore !== 'undefined' && (
                             <div className="flex items-center gap-2" title={`Pain Score: ${entry.painScore}`}>
                                <span>Pain:</span>
                                <span className="text-xl">{painEmojis[entry.painScore]}</span>
                                <span className="font-semibold">{entry.painScore}/10</span>
                            </div>
                        )}
                     </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {(entry.weight || entry.sleep) && (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        {entry.weight && <div><strong>Weight:</strong> {entry.weight} kg</div>}
                        {entry.sleep && <div><strong>Sleep:</strong> {entry.sleep} hours</div>}
                    </div>
                )}
                 {entry.food && (
                    <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Food Intake</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.food}</p>
                    </div>
                )}
                 {entry.worriedAbout && (
                    <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Worried About</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.worriedAbout}</p>
                    </div>
                )}
                 {entry.positiveAbout && (
                    <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Feeling Positive About</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.positiveAbout}</p>
                    </div>
                )}
                 {entry.notes && (
                    <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Other Notes</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.notes}</p>
                    </div>
                )}
            </CardContent>
             <CardFooter>
                 <DiaryEntryDialog onSave={onSave} existingEntry={entry} />
             </CardFooter>
        </Card>
    );
}

export default function DiaryPage() {
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

     useEffect(() => {
        const email = localStorage.getItem("currentUserEmail");
        setCurrentUserEmail(email);
    }, []);

    const loadEntries = () => {
        if (!currentUserEmail) return;
        try {
            const storedEntries = localStorage.getItem(`diaryEntries_${currentUserEmail}`);
            if (storedEntries) {
                const parsedEntries: DiaryEntry[] = JSON.parse(storedEntries);
                // Sort by date descending
                parsedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setEntries(parsedEntries);
            } else {
                setEntries([]);
            }
        } catch (error) {
            console.error("Could not load diary entries from localStorage", error);
        }
    }

    useEffect(() => {
        if (currentUserEmail) {
            loadEntries();
        }
    }, [currentUserEmail]);

    const handleSaveEntry = (entry: DiaryEntry) => {
        if (!currentUserEmail) return;
        
        const storageKey = `diaryEntries_${currentUserEmail}`;
        const storedEntries = localStorage.getItem(storageKey);
        const currentEntries: DiaryEntry[] = storedEntries ? JSON.parse(storedEntries) : [];
        
        const existingIndex = currentEntries.findIndex(e => e.id === entry.id);

        if (existingIndex > -1) {
            // Update existing entry
            currentEntries[existingIndex] = entry;
        } else {
            // Add new entry
            currentEntries.push(entry);
        }
        
        localStorage.setItem(storageKey, JSON.stringify(currentEntries));
        loadEntries(); // Reload and sort entries
    };

    return (
        <div className="p-4 md:p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">My Diary</h1>
                    <p className="text-muted-foreground">A daily log of your wellness journey.</p>
                </div>
            </div>

            {entries.length > 0 ? (
                <div className="space-y-6">
                    {entries.map(entry => (
                        <DiaryEntryCard key={entry.id} entry={entry} onSave={handleSaveEntry} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 rounded-lg border-2 border-dashed">
                    <h2 className="text-xl font-semibold">No entries yet</h2>
                    <p className="text-muted-foreground mt-2">Click the '+' button to add your first diary entry.</p>
                </div>
            )}
            
            <DiaryEntryDialog onSave={handleSaveEntry} />
        </div>
    )
}
