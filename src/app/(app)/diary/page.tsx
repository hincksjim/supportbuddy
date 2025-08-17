
"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
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
import { PlusCircle, Loader2, Pill, Trash2, Clock, Plus, AlertCircle, Download, X, Lightbulb, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Medication } from "@/app/(app)/medication/page"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { checkMedicationDose } from "@/ai/flows/check-medication-dose"
import { analyzeSymptomPattern } from "@/ai/flows/analyze-symptom-pattern"
import { marked } from "marked"
import { DiarySummary } from "@/components/diary-summary"

// Data structure for meds taken
export interface MedsTaken {
    id: string; // unique id for this instance
    name: string; // name of med
    time: string; // e.g., '09:00'
    quantity: number;
    isPrescribed: boolean;
}

// Data structure for a diary entry
export interface DiaryEntry {
  id: string; // ISO date string 'YYYY-MM-DD'
  date: string; // ISO date string
  mood: 'great' | 'good' | 'meh' | 'bad' | 'awful' | null;
  diagnosisMood: 'great' | 'good' | 'meh' | 'bad' | 'awful' | null;
  treatmentMood: 'great' | 'good' | 'meh' | 'bad' | 'awful' | null;
  painScore: number | null;
  painLocation: string | null;
  painRemarks: string;
  symptomAnalysis?: string; // To store AI analysis for recurring symptoms
  weight: string;
  sleep: string;
  food: string;
  worriedAbout: string;
  positiveAbout: string;
  notes: string;
  medsTaken: MedsTaken[];
}

interface UserData {
    initialDiagnosis?: string;
}

interface TimelineData {
    timeline: {
        title: string;
        steps: {
            title: string;
            status: 'pending' | 'completed';
        }[];
    }[];
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

const bodyParts = [
    "Head", "Neck", "Chest",
    "Back (Upper)", "Back (Lower)",
    "Abdomen (General)", 
    "Abdomen (Upper Left)", "Abdomen (Upper Right)",
    "Abdomen (Lower Left)", "Abdomen (Lower Right)",
    "Left Shoulder", "Right Shoulder",
    "Left Arm (Upper)", "Right Arm (Upper)",
    "Left Elbow", "Right Elbow",
    "Left Forearm", "Right Forearm",
    "Left Wrist", "Right Wrist",
    "Left Hand", "Right Hand",
    "Left Hip", "Right Hip",
    "Left Thigh", "Right Thigh",
    "Left Knee", "Right Knee",
    "Left Shin", "Right Shin",
    "Left Calf", "Right Calf",
    "Left Ankle", "Right Ankle",
    "Left Foot", "Right Foot"
];


function LogMedicationDialog({ onLog, prescribedMeds, existingMedsTaken, onDoseWarning }: { onLog: (med: MedsTaken) => void; prescribedMeds: Medication[]; existingMedsTaken: MedsTaken[], onDoseWarning: (warning: string) => void; }) {
    const [medName, setMedName] = useState("");
    const [isPrescribed, setIsPrescribed] = useState<boolean | null>(null);
    const [time, setTime] = useState(new Date().toTimeString().substring(0,5));
    const [quantity, setQuantity] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    const handleLog = async () => {
        if (!medName || quantity <= 0) return;
        setIsSaving(true);
        
        // --- AI Dose Checking Logic ---
        const dosesTakenToday = existingMedsTaken
            .filter(m => m.name === medName)
            .map(m => ({ time: m.time, quantity: m.quantity }));

        try {
            const checkResult = await checkMedicationDose({
                medicationName: medName,
                dosesTakenToday: dosesTakenToday,
                newDoseQuantity: quantity,
            });

            if (checkResult.isOverdose && checkResult.warning) {
                onDoseWarning(checkResult.warning);
                // We still log the med but show a warning. The user can then remove it.
            }
        } catch (error) {
            console.error("AI Dose Check failed:", error);
            // Non-fatal error, we can still log the medication
        }
        // --- End AI Dose Checking ---

        const newMedLog: MedsTaken = {
            id: new Date().toISOString(),
            name: medName,
            time,
            quantity,
            isPrescribed: !!isPrescribed
        };

        onLog(newMedLog);
        setIsSaving(false);
        document.getElementById('close-log-med-dialog')?.click();
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Plus className="mr-2" /> Log Med Taken</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log a Medication</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <div className="space-y-2">
                        <Label>Medication Type</Label>
                        <RadioGroup onValueChange={(val) => setIsPrescribed(val === 'true')} className="flex gap-4 pt-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="prescribed" />
                                <Label htmlFor="prescribed">Prescribed</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="otc" />
                                <Label htmlFor="otc">Over-the-Counter</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {isPrescribed !== null && (
                        <>
                           <div className="space-y-2">
                                <Label htmlFor="med-name">Medication Name</Label>
                                {isPrescribed ? (
                                    <Select onValueChange={setMedName}>
                                        <SelectTrigger id="med-name">
                                            <SelectValue placeholder="Select from your list" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {prescribedMeds.map(med => (
                                                <SelectItem key={med.id} value={med.name}>{med.name} ({med.strength})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input id="med-name" placeholder="e.g., Ibuprofen" value={medName} onChange={(e) => setMedName(e.target.value)} />
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="time">Time Taken</Label>
                                    <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input id="quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose id="close-log-med-dialog" asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleLog} disabled={isSaving || isPrescribed === null || !medName}>
                        {isSaving && <Loader2 className="animate-spin mr-2" />}
                        Log Medication
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


function DiaryEntryDialog({ onSave, existingEntry, currentUserEmail, allEntries }: { onSave: (entry: DiaryEntry) => void; existingEntry?: DiaryEntry | null; currentUserEmail: string | null; allEntries: DiaryEntry[]; }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [mood, setMood] = useState<DiaryEntry['mood']>('meh');
    const [diagnosisMood, setDiagnosisMood] = useState<DiaryEntry['diagnosisMood']>('meh');
    const [treatmentMood, setTreatmentMood] = useState<DiaryEntry['treatmentMood']>('meh');
    const [painScore, setPainScore] = useState<DiaryEntry['painScore']>(0);
    const [painLocation, setPainLocation] = useState<DiaryEntry['painLocation']>(null);
    const [painRemarks, setPainRemarks] = useState('');
    const [weight, setWeight] = useState('');
    const [sleep, setSleep] = useState('');
    const [food, setFood] = useState('');
    const [worriedAbout, setWorriedAbout] = useState('');
    const [positiveAbout, setPositiveAbout] = useState('');
    const [notes, setNotes] = useState('');
    const [medsTaken, setMedsTaken] = useState<MedsTaken[]>([]);
    const [prescribedMeds, setPrescribedMeds] = useState<Medication[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isCheckingSymptom, setIsCheckingSymptom] = useState(false);
    const [symptomAnalysis, setSymptomAnalysis] = useState<string | null>(null);

    const [contextData, setContextData] = useState<{
        userData: UserData | null;
        timelineData: TimelineData | null;
    }>({ userData: null, timelineData: null });
    
    const { toast } = useToast();

    // Load prescribed meds and other context for the dropdown and symptom analysis
    useEffect(() => {
        if (!currentUserEmail) return;
        try {
            const storedMeds = localStorage.getItem(`medications_${currentUserEmail}`);
            if (storedMeds) setPrescribedMeds(JSON.parse(storedMeds));

            const storedUser = localStorage.getItem(`userData_${currentUserEmail}`);
            if (storedUser) setContextData(prev => ({...prev, userData: JSON.parse(storedUser)}));
            
            const storedTimeline = localStorage.getItem(`treatmentTimeline_${currentUserEmail}`);
            if(storedTimeline) setContextData(prev => ({...prev, timelineData: JSON.parse(storedTimeline)}));

        } catch(e) {
            console.error("Could not load context data", e);
        }
    }, [currentUserEmail]);


    useEffect(() => {
        const entryToEdit = existingEntry || {
            id: new Date().toISOString().split('T')[0],
            date: new Date().toISOString(),
            mood: 'meh',
            diagnosisMood: 'meh',
            treatmentMood: 'meh',
            painScore: 0,
            painLocation: null,
            painRemarks: '',
            symptomAnalysis: '',
            weight: '',
            sleep: '',
            food: '',
            worriedAbout: '',
            positiveAbout: '',
            notes: '',
            medsTaken: [],
        };

        setDate(new Date(entryToEdit.date).toISOString().split('T')[0]);
        setMood(entryToEdit.mood);
        setDiagnosisMood(entryToEdit.diagnosisMood);
        setTreatmentMood(entryToEdit.treatmentMood);
        setPainScore(entryToEdit.painScore);
        setPainLocation(entryToEdit.painLocation || null);
        setPainRemarks(entryToEdit.painRemarks || '');
        setSymptomAnalysis(entryToEdit.symptomAnalysis || null);
        setWeight(entryToEdit.weight);
        setSleep(entryToEdit.sleep);
        setFood(entryToEdit.food);
        setWorriedAbout(entryToEdit.worriedAbout);
        setPositiveAbout(entryToEdit.positiveAbout);
        setNotes(entryToEdit.notes);
        setMedsTaken(entryToEdit.medsTaken || []);
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
            painLocation,
            painRemarks,
            symptomAnalysis: symptomAnalysis || undefined,
            weight,
            sleep,
            food,
            worriedAbout,
            positiveAbout,
            notes,
            medsTaken,
        };
        onSave(entry);
        setIsSaving(false);
        document.getElementById(`close-diary-dialog-${existingEntry?.id || 'new'}`)?.click();
    };
    
    const handleLogMedication = (medLog: MedsTaken) => {
        setMedsTaken(prev => [...prev, medLog].sort((a,b) => a.time.localeCompare(b.time)));
    }

    const handleRemoveMedication = (medId: string) => {
        setMedsTaken(prev => prev.filter(m => m.id !== medId));
    }

    const handleDoseWarning = (warning: string) => {
        toast({
            variant: "destructive",
            title: "Dose Warning",
            description: warning,
            duration: 10000,
        })
    }

    // --- Symptom Analysis Logic ---
    const handleSymptomAnalysis = useCallback(async () => {
        if (!painLocation) return;
        
        setIsCheckingSymptom(true);
        setSymptomAnalysis(null);
        
        try {
            const activeTreatments = contextData.timelineData?.timeline.flatMap(stage => 
                stage.steps.filter(step => step.status === 'completed').map(step => step.title)
            ) || [];
            
            const relevantEntries = allEntries.filter(e => e.painLocation === painLocation);
            const painRemarksForSymptom = relevantEntries.map(e => e.painRemarks).filter(Boolean);
            if(painRemarks) {
                painRemarksForSymptom.push(painRemarks);
            }
            
            const result = await analyzeSymptomPattern({
                symptom: painLocation,
                diagnosis: contextData.userData?.initialDiagnosis || "Not specified",
                medications: prescribedMeds.map(m => ({ name: m.name })),
                treatments: activeTreatments,
                painRemarks: painRemarksForSymptom,
            });

            setSymptomAnalysis(result.analysis);

        } catch (error) {
            console.error("Symptom analysis failed:", error);
            // Don't show an error to the user, just fail silently.
        } finally {
            setIsCheckingSymptom(false);
        }
    }, [allEntries, contextData, prescribedMeds, painLocation, painRemarks]);
    
    const isSymptomRecurring = useMemo(() => {
        if (!painLocation) return false;
        // Count how many OTHER entries have the same pain location
        const count = allEntries.filter(e => e.id !== date && e.painLocation === painLocation).length;
        return count >= 1;
    }, [allEntries, painLocation, date]);
    

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
            <DialogContent className="max-w-3xl">
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

                    {(painScore ?? 0) > 0 && (
                         <div className="space-y-4 pt-4 border-t">
                            <Label className="font-semibold">Pain Details</Label>
                             <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pain-location">Pain Location</Label>
                                    <Select value={painLocation || ""} onValueChange={(val) => { setPainLocation(val); setSymptomAnalysis(null); }}>
                                        <SelectTrigger id="pain-location">
                                            <SelectValue placeholder="Select where it hurts" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bodyParts.map(part => (
                                                <SelectItem key={part} value={part}>{part}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pain-remarks">Pain Remarks</Label>
                                    <Textarea id="pain-remarks" placeholder="Describe the pain (e.g., sharp, dull, aching)..." value={painRemarks} onChange={(e) => setPainRemarks(e.target.value)} />
                                </div>
                                
                                {isSymptomRecurring && (
                                     <div className="flex flex-col items-start gap-2">
                                         <Button onClick={handleSymptomAnalysis} disabled={isCheckingSymptom || !painLocation} size="sm" variant="outline">
                                             {isCheckingSymptom ? <Loader2 className="animate-spin mr-2"/> : <Zap className="mr-2"/>}
                                             Check Symptom
                                         </Button>
                                         <p className="text-xs text-muted-foreground">This seems to be a recurring symptom. Click to check for possible connections.</p>
                                     </div>
                                )}
                                
                                {symptomAnalysis && !isCheckingSymptom && (
                                    <Alert>
                                        <Lightbulb className="h-4 w-4" />
                                        <AlertTitle>Possible Causes Analysis</AlertTitle>
                                        <AlertDescription>
                                            <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked(symptomAnalysis) as string }} />
                                            <p className="text-xs italic mt-2">This is an AI-generated analysis, not medical advice. Always consult your doctor.</p>
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </div>
                    )}


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
                        <Label>Medications Taken Today</Label>
                        <div className="space-y-2 rounded-md border p-4">
                           {medsTaken.length > 0 ? (
                            <ul className="space-y-2">
                               {medsTaken.map(med => (
                                   <li key={med.id} className="flex items-center justify-between text-sm">
                                       <div>
                                            <span className="font-semibold">{med.name}</span>
                                            <span className="text-muted-foreground"> (x{med.quantity})</span>
                                       </div>
                                       <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground text-xs flex items-center gap-1"><Clock className="w-3 h-3"/>{med.time}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveMedication(med.id)}>
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                       </div>
                                   </li>
                               ))}
                            </ul>
                           ) : (
                               <p className="text-sm text-muted-foreground">No medications logged for today.</p>
                           )}
                           <div className="pt-2">
                             <LogMedicationDialog 
                                onLog={handleLogMedication} 
                                prescribedMeds={prescribedMeds} 
                                existingMedsTaken={medsTaken} 
                                onDoseWarning={handleDoseWarning}
                             />
                           </div>
                        </div>
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

function DiaryEntryCard({ entry, onSave, currentUserEmail, onDelete, allEntries }: { entry: DiaryEntry; onSave: (entry: DiaryEntry) => void; currentUserEmail: string | null; onDelete: (id: string) => void; allEntries: DiaryEntry[]; }) {
    const hasPainDetails = (entry.painScore ?? 0) > 0 && (entry.painLocation || entry.painRemarks);
    
    return (
        <Card className="diary-entry-card relative group">
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
                {hasPainDetails && (
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Pain Details</h4>
                         <div className="text-sm text-muted-foreground">
                            {entry.painLocation && <p><strong>Location:</strong> {entry.painLocation}</p>}
                            {entry.painRemarks && <p className="whitespace-pre-wrap mt-1"><strong>Remarks:</strong> {entry.painRemarks}</p>}
                        </div>
                    </div>
                )}
                 {entry.medsTaken && entry.medsTaken.length > 0 && (
                     <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Medications Taken</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {entry.medsTaken.map(med => (
                                <li key={med.id}>
                                    {med.name} (x{med.quantity}) at {med.time}
                                </li>
                            ))}
                        </ul>
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
                {entry.symptomAnalysis && (
                     <div className="space-y-1 pt-4 border-t">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><Lightbulb className="w-4 h-4 text-primary"/> AI Symptom Analysis</h4>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: marked(entry.symptomAnalysis) as string }} />
                    </div>
                )}
            </CardContent>
             <CardFooter className="flex justify-between items-center">
                 <DiaryEntryDialog onSave={onSave} existingEntry={entry} currentUserEmail={currentUserEmail} allEntries={allEntries}/>
                 <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onDelete(entry.id)}
                 >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Entry</span>
                 </Button>
             </CardFooter>
        </Card>
    );
}

export default function DiaryPage() {
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const entriesRef = useRef<DiaryEntry[]>([]);
    const diaryContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        entriesRef.current = entries;
    }, [entries]);

     useEffect(() => {
        const email = localStorage.getItem("currentUserEmail");
        setCurrentUserEmail(email);
    }, []);

    const saveEntries = (updatedEntries: DiaryEntry[]) => {
        if (!currentUserEmail) return;
        try {
             localStorage.setItem(`diaryEntries_${currentUserEmail}`, JSON.stringify(updatedEntries));
        } catch (error) {
            console.error("Could not save diary entries to localStorage", error);
        }
    }

    useEffect(() => {
        if (currentUserEmail) {
            try {
                const storedEntries = localStorage.getItem(`diaryEntries_${currentUserEmail}`);
                if (storedEntries) {
                    const parsedEntries: DiaryEntry[] = JSON.parse(storedEntries);
                    parsedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setEntries(parsedEntries);
                } else {
                    setEntries([]);
                }
            } catch (error) {
                console.error("Could not load diary entries from localStorage", error);
            }
        }
        
        const handleSaveOnExit = () => {
            if (currentUserEmail && entriesRef.current) {
                saveEntries(entriesRef.current);
            }
        };

        window.addEventListener('beforeunload', handleSaveOnExit);

        return () => {
            handleSaveOnExit();
            window.removeEventListener('beforeunload', handleSaveOnExit);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserEmail]);

    const handleSaveEntry = (entry: DiaryEntry) => {
        if (!currentUserEmail) return;
        
        let updatedEntries;
        const existingIndex = entries.findIndex(e => e.id === entry.id);

        if (existingIndex > -1) {
            // Update existing entry
            updatedEntries = [...entries];
            updatedEntries[existingIndex] = entry;
        } else {
            // Add new entry
            updatedEntries = [...entries, entry];
        }
        
        updatedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEntries(updatedEntries);
        // Data is saved on exit, or when the component unmounts.
    };

    const handleDeleteEntry = (id: string) => {
        if (!currentUserEmail) return;
        const updatedEntries = entries.filter(e => e.id !== id);
        setEntries(updatedEntries);
        // Data is saved on exit, or when the component unmounts.
    };

    const handleDownloadPdf = async () => {
        const container = diaryContainerRef.current;
        if (!container) return;
        setIsDownloading(true);

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        
        // Title Page
        pdf.setFontSize(28);
        pdf.text("My Diary Report", pdfWidth / 2, pdfHeight / 2, { align: 'center' });

        const entryCards = Array.from(container.querySelectorAll('.diary-entry-card')) as HTMLElement[];
        
        for (let i = 0; i < entryCards.length; i++) {
            pdf.addPage();
            const card = entryCards[i];
            const canvas = await html2canvas(card, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / imgHeight;

            let finalImgWidth = pdfWidth - margin * 2;
            let finalImgHeight = finalImgWidth / ratio;
            
            if (finalImgHeight > pdfHeight - margin * 2) {
                finalImgHeight = pdfHeight - margin * 2;
                finalImgWidth = finalImgHeight * ratio;
            }

            const xPos = (pdfWidth - finalImgWidth) / 2;

            pdf.addImage(imgData, 'PNG', xPos, margin, finalImgWidth, finalImgHeight);
        }

        pdf.save('My-Diary.pdf');
        setIsDownloading(false);
    };


    return (
        <div className="p-4 md:p-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">My Diary</h1>
                    <p className="text-muted-foreground">A daily log of your wellness journey.</p>
                </div>
                 <Button onClick={handleDownloadPdf} disabled={isDownloading || entries.length === 0} variant="outline">
                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Download PDF
                </Button>
            </div>

            <DiarySummary entries={entries} currentUserEmail={currentUserEmail} />

            {entries.length > 0 ? (
                <div className="space-y-6" ref={diaryContainerRef}>
                    {entries.map(entry => (
                        <DiaryEntryCard key={entry.id} entry={entry} onSave={handleSaveEntry} currentUserEmail={currentUserEmail} onDelete={handleDeleteEntry} allEntries={entries} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 rounded-lg border-2 border-dashed">
                    <h2 className="text-xl font-semibold">No entries yet</h2>
                    <p className="text-muted-foreground mt-2">Click the '+' button to add your first diary entry.</p>
                </div>
            )}
            
            <DiaryEntryDialog onSave={handleSaveEntry} currentUserEmail={currentUserEmail} allEntries={entries}/>
        </div>
    )
}
