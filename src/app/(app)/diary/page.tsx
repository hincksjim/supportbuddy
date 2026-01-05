
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
import { PlusCircle, Loader2, Pill, Trash2, Clock, Plus, AlertCircle, Download, X, Lightbulb, Zap, Camera, Utensils, FileUp, AlertTriangle, MessageSquareText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Medication } from "@/app/(app)/medication/page"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { checkMedicationDose } from "@/ai/flows/check-medication-dose"
import { analyzeSymptomPattern } from "@/ai/flows/analyze-symptom-pattern"
import { marked } from "marked"
import { DiarySummary } from "@/components/diary-summary"
import { analyzeFoodPhoto } from "@/ai/flows/analyze-food-photo"
import { analyzeFoodIngredients } from "@/ai/flows/analyze-food-ingredients"
import { analyzeFoodDescription } from "@/ai/flows/analyze-food-description"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { GenerateDietaryTargetsOutput } from "@/ai/flows/types"


// Data structure for meds taken
export interface MedsTaken {
    id: string; // unique id for this instance
    name: string; // name of med
    time: string; // e.g., '09:00'
    quantity: number;
    isPrescribed: boolean;
}

// Data structure for food intake
export interface FoodIntake {
    id: string;
    title: string;
    photoDataUri: string;
    description: string;
    calories: number;
    ingredients: string[];
    dietaryWarning?: string;
}

// Data structure for a diary entry
export interface DiaryEntry {
  id: string; // ISO date string 'YYYY-MM-DD'
  date: string; // ISO date string
  mood: 'great' | 'good' | 'meh' | 'bad' | 'awful' | null;
  diagnosisMood?: 'great' | 'good' | 'meh' | 'bad' | 'awful' | null;
  treatmentMood?: 'great' | 'good' | 'meh' | 'bad' | 'awful' | null;
  painScore: number | null;
  painLocation: string | null;
  painRemarks?: string | null;
  symptomAnalysis?: string | null;
  weight?: string;
  sleep?: string;
  fluidIntake?: string;
  bloodPressureSystolic?: string;
  bloodPressureDiastolic?: string;
  pulse?: string;
  bloodSugar?: string;
  foodIntake?: FoodIntake[];
  worriedAbout?: string;
  positiveAbout?: string;
  notes?: string;
  medsTaken?: MedsTaken[];
  bloodWBC?: string;
  bloodNeutrophils?: string;
  bloodRBC?: string;
  bloodHemoglobin?: string;
  bloodPlatelets?: string;
  kidneyCreatinine?: string;
  kidneyEGFR?: string;
  liverALT?: string;
}

interface UserData {
    initialDiagnosis?: string;
    height?: string;
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

const moodOptions: { [key in NonNullable<DiaryEntry['mood']>] : string } = {
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


function LogFoodDialog({ onLog, open, onOpenChange, userDiagnosis }: { onLog: (food: FoodIntake) => void, open: boolean, onOpenChange: (open: boolean) => void, userDiagnosis: string }) {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [view, setView] = useState<'chooser' | 'camera' | 'upload' | 'confirm' | 'manual'>('chooser');
    const [analyzedData, setAnalyzedData] = useState<Omit<FoodIntake, 'id' | 'title'> | null>(null);
    const [title, setTitle] = useState('');
    const [manualDescription, setManualDescription] = useState('');

    const resetDialog = () => {
        setView('chooser');
        setIsAnalyzing(false);
        setAnalyzedData(null);
        setTitle('');
        setManualDescription('');
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
    
    // Image resize function
    const resizeImage = (imageSrc: string, maxWidth: number = 800, maxHeight: number = 800): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = document.createElement('img');
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8)); // Use JPEG with 80% quality
            };
            img.onerror = reject;
            img.src = imageSrc;
        });
    };

    const startCamera = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setHasCameraPermission(false);
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setHasCameraPermission(true);
            setView('camera');
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
                variant: 'destructive',
                title: 'Camera Access Denied',
                description: 'Please enable camera permissions in your browser settings to use this feature.',
            });
        }
    };
    
    useEffect(() => {
        if (!open) {
            resetDialog();
        }
    }, [open]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const originalDataUri = e.target?.result as string;
                setIsAnalyzing(true);
                setView('chooser'); // Show loader
                try {
                    const resizedDataUri = await resizeImage(originalDataUri);
                    handleAnalyzePhoto(resizedDataUri);
                } catch (error) {
                    console.error('Image resize failed:', error);
                    toast({ title: 'Image Processing Failed', variant: 'destructive' });
                    setIsAnalyzing(false);
                    setView('chooser');
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyzePhoto = async (photoDataUri: string) => {
        if (!photoDataUri) return;
        setIsAnalyzing(true);
        setView('chooser'); // Show loader in chooser view
        try {
            const photoResult = await analyzeFoodPhoto({ photoDataUri });
            const ingredientResult = await analyzeFoodIngredients({ diagnosis: userDiagnosis, ingredients: photoResult.ingredients });
            
            setAnalyzedData({
                photoDataUri,
                description: photoResult.description,
                calories: photoResult.calories,
                ingredients: photoResult.ingredients,
                dietaryWarning: ingredientResult.warning,
            });
            setTitle(photoResult.description);
            setView('confirm');
        } catch (error) {
            console.error("Failed to analyze food photo:", error);
            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: 'Could not analyze the photo. Please try again or enter manually.',
            });
            setView('chooser');
        } finally {
            setIsAnalyzing(false);
        }
    }

    const handleAnalyzeDescription = async () => {
        if (!manualDescription.trim()) return;
        setIsAnalyzing(true);
        setView('chooser');
        try {
            const descriptionResult = await analyzeFoodDescription({ description: manualDescription });
            const ingredientResult = await analyzeFoodIngredients({ diagnosis: userDiagnosis, ingredients: descriptionResult.ingredients });

            setAnalyzedData({
                photoDataUri: '', // No photo for manual entry
                description: manualDescription,
                calories: descriptionResult.calories,
                ingredients: descriptionResult.ingredients,
                dietaryWarning: ingredientResult.warning,
            });
            setTitle(manualDescription.split(' ')[0] || "Meal"); // Use first word as default title
            setView('confirm');
        } catch (error) {
            console.error("Failed to analyze food description:", error);
            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: 'Could not analyze the description. Please try again.',
            });
            setView('chooser');
        } finally {
            setIsAnalyzing(false);
        }
    }

    const handleCaptureAndAnalyze = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        
        setIsAnalyzing(true);
        setView('chooser');
        try {
             // Use a temporary canvas to capture the full frame first
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = video.videoWidth;
            tempCanvas.height = video.videoHeight;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            
            const originalDataUri = tempCanvas.toDataURL('image/jpeg');
            const resizedDataUri = await resizeImage(originalDataUri);
            
            await handleAnalyzePhoto(resizedDataUri);
        } catch(e) {
             console.error("Capture or analysis failed", e);
             toast({ title: 'Capture Failed', description: 'Could not capture or analyze the image.', variant: 'destructive'});
             setIsAnalyzing(false);
             setView('camera');
        }
    };

    const handleConfirmAndLog = () => {
        if (!analyzedData || !title.trim()) {
            toast({
                variant: 'destructive',
                title: 'Title is required',
            });
            return;
        }
        const foodLog: FoodIntake = {
            id: new Date().toISOString(),
            title: title,
            ...analyzedData
        };
        onLog(foodLog);
        onOpenChange(false);
    }
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log a Meal</DialogTitle>
                    <DialogDescription>
                        {view === 'chooser' && "Add a meal to your diary using your camera, a photo, or by typing a description."}
                        {view === 'camera' && "Point your camera at your meal. Ensure it is clear and well-lit."}
                        {view === 'upload' && "Select a photo of your meal from your device."}
                        {view === 'manual' && "Describe the meal you ate in as much detail as possible."}
                        {view === 'confirm' && "Confirm the details and add a title for your meal."}
                    </DialogDescription>
                </DialogHeader>

                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground">Analyzing your meal...</p>
                    </div>
                ) : (
                    <>
                        {view === 'chooser' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                                <Button variant="outline" className="h-28 flex-col gap-2" onClick={startCamera}>
                                    <Camera className="h-8 w-8" />
                                    <span>Use Camera</span>
                                </Button>
                                <Button variant="outline" className="h-28 flex-col gap-2" onClick={() => fileInputRef.current?.click()}>
                                    <FileUp className="h-8 w-8" />
                                    <span>Upload Photo</span>
                                </Button>
                                <Button variant="outline" className="h-28 flex-col gap-2" onClick={() => setView('manual')}>
                                    <MessageSquareText className="h-8 w-8" />
                                    <span>Enter Manually</span>
                                </Button>
                                <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                        )}
                        {view === 'camera' && (
                             <div className="py-4">
                                 <div className="relative">
                                    <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                                    <canvas ref={canvasRef} className="hidden" />
                                    {!hasCameraPermission && (
                                         <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                                            <p className="text-white text-center">Camera access is required.</p>
                                         </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {view === 'manual' && (
                            <div className="space-y-4 py-4">
                                <Label htmlFor="manual-description">Meal Description</Label>
                                <Textarea
                                    id="manual-description"
                                    value={manualDescription}
                                    onChange={(e) => setManualDescription(e.target.value)}
                                    placeholder="e.g., A large bowl of chicken noodle soup with a side of whole wheat bread."
                                    rows={5}
                                />
                            </div>
                        )}
                        {view === 'confirm' && analyzedData && (
                            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                                 {analyzedData.photoDataUri && (
                                    <Image src={analyzedData.photoDataUri} alt="Logged meal" width={400} height={225} className="rounded-md object-cover w-full aspect-video"/>
                                 )}
                                 <div className="space-y-2">
                                     <Label htmlFor="meal-title">Meal Title</Label>
                                     <Input id="meal-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Breakfast, Lunch..." />
                                 </div>
                                 <p><strong>Description:</strong> {analyzedData.description}</p>
                                 <p><strong>Estimated Calories:</strong> {analyzedData.calories}</p>
                                 <div>
                                     <h4 className="font-semibold mb-2">Identified Ingredients:</h4>
                                     <div className="flex flex-wrap gap-2">
                                        {analyzedData.ingredients.map((ing, i) => (
                                            <Badge key={i} variant="secondary">{ing}</Badge>
                                        ))}
                                     </div>
                                 </div>
                                 {analyzedData.dietaryWarning && (
                                     <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Dietary Note</AlertTitle>
                                        <AlertDescription>{analyzedData.dietaryWarning}</AlertDescription>
                                     </Alert>
                                 )}
                            </div>
                        )}
                    </>
                )}

                <DialogFooter>
                    {view === 'camera' && (
                        <>
                             <Button variant="ghost" onClick={() => setView('chooser')}>Back</Button>
                            <Button onClick={handleCaptureAndAnalyze} disabled={!hasCameraPermission || isAnalyzing}>
                                <Camera className="mr-2"/>
                                Capture & Analyze
                            </Button>
                        </>
                    )}
                    {view === 'manual' && (
                        <>
                            <Button variant="ghost" onClick={() => setView('chooser')}>Back</Button>
                            <Button onClick={handleAnalyzeDescription} disabled={!manualDescription.trim() || isAnalyzing}>
                                Analyze Description
                            </Button>
                        </>
                    )}
                    {view === 'confirm' && (
                         <>
                            <Button variant="ghost" onClick={() => setView('chooser')}>Back</Button>
                            <Button onClick={handleConfirmAndLog} disabled={!title.trim()}>
                                Log Meal
                            </Button>
                        </>
                    )}
                    {view === 'chooser' && (
                         <DialogClose asChild>
                            <Button variant="ghost">Cancel</Button>
                         </DialogClose>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


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
    const [symptomAnalysis, setSymptomAnalysis] = useState<string | null>(null);
    const [weight, setWeight] = useState('');
    const [sleep, setSleep] = useState('');
    const [fluidIntake, setFluidIntake] = useState('');
    const [bloodPressureSystolic, setBloodPressureSystolic] = useState('');
    const [bloodPressureDiastolic, setBloodPressureDiastolic] = useState('');
    const [pulse, setPulse] = useState('');
    const [bloodSugar, setBloodSugar] = useState('');
    const [foodIntake, setFoodIntake] = useState<FoodIntake[]>([]);
    const [isFoodDialogOpen, setIsFoodDialogOpen] = useState(false);
    const [worriedAbout, setWorriedAbout] = useState('');
    const [positiveAbout, setPositiveAbout] = useState('');
    const [notes, setNotes] = useState('');
    const [medsTaken, setMedsTaken] = useState<MedsTaken[]>([]);
    const [prescribedMeds, setPrescribedMeds] = useState<Medication[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isCheckingSymptom, setIsCheckingSymptom] = useState(false);

    // New state for test results
    const [bloodWBC, setBloodWBC] = useState('');
    const [bloodNeutrophils, setBloodNeutrophils] = useState('');
    const [bloodRBC, setBloodRBC] = useState('');
    const [bloodHemoglobin, setBloodHemoglobin] = useState('');
    const [bloodPlatelets, setBloodPlatelets] = useState('');
    const [kidneyCreatinine, setKidneyCreatinine] = useState('');
    const [kidneyEGFR, setKidneyEGFR] = useState('');
    const [liverALT, setLiverALT] = useState('');

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
            fluidIntake: '',
            bloodPressureSystolic: '',
            bloodPressureDiastolic: '',
            pulse: '',
            bloodSugar: '',
            foodIntake: [],
            worriedAbout: '',
            positiveAbout: '',
            notes: '',
            medsTaken: [],
            bloodWBC: '',
            bloodNeutrophils: '',
            bloodRBC: '',
            bloodHemoglobin: '',
            bloodPlatelets: '',
            kidneyCreatinine: '',
            kidneyEGFR: '',
            liverALT: '',
        };

        setDate(new Date(entryToEdit.date).toISOString().split('T')[0]);
        setMood(entryToEdit.mood);
        setDiagnosisMood(entryToEdit.diagnosisMood);
        setTreatmentMood(entryToEdit.treatmentMood);
        setPainScore(entryToEdit.painScore);
        setPainLocation(entryToEdit.painLocation || null);
        setPainRemarks(entryToEdit.painRemarks || '');
        setSymptomAnalysis(entryToEdit.symptomAnalysis || null);
        setWeight(entryToEdit.weight || '');
        setSleep(entryToEdit.sleep || '');
        setFluidIntake(entryToEdit.fluidIntake || '');
        setBloodPressureSystolic(entryToEdit.bloodPressureSystolic || '');
        setBloodPressureDiastolic(entryToEdit.bloodPressureDiastolic || '');
        setPulse(entryToEdit.pulse || '');
        setBloodSugar(entryToEdit.bloodSugar || '');
        setFoodIntake(entryToEdit.foodIntake || []);
        setWorriedAbout(entryToEdit.worriedAbout || '');
        setPositiveAbout(entryToEdit.positiveAbout || '');
        setNotes(entryToEdit.notes || '');
        setMedsTaken(entryToEdit.medsTaken || []);
        setBloodWBC(entryToEdit.bloodWBC || '');
        setBloodNeutrophils(entryToEdit.bloodNeutrophils || '');
        setBloodRBC(entryToEdit.bloodRBC || '');
        setBloodHemoglobin(entryToEdit.bloodHemoglobin || '');
        setBloodPlatelets(entryToEdit.bloodPlatelets || '');
        setKidneyCreatinine(entryToEdit.kidneyCreatinine || '');
        setKidneyEGFR(entryToEdit.kidneyEGFR || '');
        setLiverALT(entryToEdit.liverALT || '');
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
            painRemarks: painRemarks || undefined,
            symptomAnalysis: symptomAnalysis || undefined,
            weight,
            sleep,
            fluidIntake,
            bloodPressureSystolic,
            bloodPressureDiastolic,
            pulse,
            bloodSugar,
            foodIntake,
            worriedAbout,
            positiveAbout,
            notes,
            medsTaken,
            bloodWBC,
            bloodNeutrophils,
            bloodRBC,
            bloodHemoglobin,
            bloodPlatelets,
            kidneyCreatinine,
            kidneyEGFR,
            liverALT,
        };
        onSave(entry);
        setIsSaving(false);
        document.getElementById(`close-diary-dialog-${existingEntry?.id || 'new'}`)?.click();
    };
    
    const handleLogMedication = (medLog: MedsTaken) => {
        setMedsTaken(prev => [...prev, medLog].sort((a,b) => a.time.localeCompare(b.time)));
    }
    
    const handleLogFood = (foodLog: FoodIntake) => {
        setFoodIntake(prev => [...prev, foodLog]);
    }

    const handleRemoveFood = (foodId: string) => {
        setFoodIntake(prev => prev.filter(f => f.id !== foodId));
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
            const painRemarksForSymptom = relevantEntries.map(e => e.painRemarks || '').filter(Boolean);
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

    const diagnosis = contextData.userData?.initialDiagnosis?.toLowerCase() || "";
    const showChemoFields = diagnosis.includes("cancer");
    const showKidneyFields = diagnosis.includes("kidney") || diagnosis.includes("renal");
    const showHeartFields = diagnosis.includes("heart") || diagnosis.includes("cardiac") || diagnosis.includes("stroke") || diagnosis.includes("vascular") || diagnosis.includes("hypertension");
    const showDiabetesFields = diagnosis.includes("diabetes");
    const showBloodPressureFields = showHeartFields || showKidneyFields;
    
    return (
        <>
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
                                        <Textarea id="pain-remarks" placeholder="Describe the pain (e.g., sharp, dull, aching)..." value={painRemarks || ''} onChange={(e) => setPainRemarks(e.target.value)} />
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

                         {(showKidneyFields || showBloodPressureFields || showDiabetesFields || showChemoFields) && (
                            <div className="space-y-4 pt-4 border-t">
                                <Label className="font-semibold">Condition-Specific Tracking</Label>
                                
                                {showChemoFields && (
                                    <div className="p-4 border rounded-md">
                                        <h4 className="font-medium text-sm mb-2">Blood Test Results</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="blood-wbc" className="text-xs">WBC (x10⁹/L)</Label>
                                                <Input id="blood-wbc" type="number" placeholder="4.0-11.0" step="0.1" value={bloodWBC} onChange={(e) => setBloodWBC(e.target.value)} />
                                            </div>
                                             <div className="space-y-2">
                                                <Label htmlFor="blood-neutrophils" className="text-xs">Neutrophils (x10⁹/L)</Label>
                                                <Input id="blood-neutrophils" type="number" placeholder="2.0-7.5" step="0.1" value={bloodNeutrophils} onChange={(e) => setBloodNeutrophils(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="blood-rbc" className="text-xs">RBC (x10¹²/L)</Label>
                                                <Input id="blood-rbc" type="number" placeholder="4.5-5.5" step="0.1" value={bloodRBC} onChange={(e) => setBloodRBC(e.target.value)} />
                                            </div>
                                             <div className="space-y-2">
                                                <Label htmlFor="blood-hemoglobin" className="text-xs">Hemoglobin (g/dL)</Label>
                                                <Input id="blood-hemoglobin" type="number" placeholder="13.5-17.5" step="0.1" value={bloodHemoglobin} onChange={(e) => setBloodHemoglobin(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="blood-platelets" className="text-xs">Platelets (x10⁹/L)</Label>
                                                <Input id="blood-platelets" type="number" placeholder="150-450" value={bloodPlatelets} onChange={(e) => setBloodPlatelets(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {showKidneyFields && (
                                        <div className="p-4 border rounded-md space-y-4">
                                            <h4 className="font-medium text-sm">Kidney Function</h4>
                                            <div className="space-y-2">
                                                <Label htmlFor="fluid-intake">Fluid Intake (ml)</Label>
                                                <Input id="fluid-intake" type="number" placeholder="e.g., 2000" value={fluidIntake} onChange={(e) => setFluidIntake(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="kidney-creatinine">Creatinine (mg/dL)</Label>
                                                <Input id="kidney-creatinine" type="number" placeholder="0.7-1.3" step="0.1" value={kidneyCreatinine} onChange={(e) => setKidneyCreatinine(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="kidney-egfr">eGFR</Label>
                                                <Input id="kidney-egfr" type="number" placeholder="e.g. >60" value={kidneyEGFR} onChange={(e) => setKidneyEGFR(e.target.value)} />
                                            </div>
                                        </div>
                                    )}
                                    {showBloodPressureFields && (
                                         <div className="space-y-2 p-4 border rounded-md">
                                            <h4 className="font-medium text-sm mb-4">Cardiovascular</h4>
                                            <Label>Blood Pressure & Pulse</Label>
                                            <div className="flex items-center gap-2">
                                                <Input id="bp-systolic" type="number" placeholder="Sys" value={bloodPressureSystolic} onChange={(e) => setBloodPressureSystolic(e.target.value)} />
                                                <span>/</span>
                                                <Input id="bp-diastolic" type="number" placeholder="Dia" value={bloodPressureDiastolic} onChange={(e) => setBloodPressureDiastolic(e.target.value)} />
                                                 <Input id="pulse" type="number" placeholder="BPM" value={pulse} onChange={(e) => setPulse(e.target.value)} />
                                            </div>
                                        </div>
                                    )}
                                    {showDiabetesFields && (
                                        <div className="space-y-2 p-4 border rounded-md">
                                             <h4 className="font-medium text-sm mb-4">Diabetes</h4>
                                            <Label htmlFor="blood-sugar">Blood Sugar (mmol/L)</Label>
                                            <Input id="blood-sugar" type="number" placeholder="e.g., 5.5" step="0.1" value={bloodSugar} onChange={(e) => setBloodSugar(e.target.value)} />
                                        </div>
                                    )}
                                     <div className="p-4 border rounded-md space-y-4">
                                        <h4 className="font-medium text-sm">Liver Function</h4>
                                        <div className="space-y-2">
                                            <Label htmlFor="liver-alt">ALT (U/L)</Label>
                                            <Input id="liver-alt" type="number" placeholder="7-56" value={liverALT} onChange={(e) => setLiverALT(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <Label>Food Intake</Label>
                            <Card className="p-4 space-y-4">
                               {foodIntake.length > 0 && (
                                   <div className="space-y-3">
                                       {foodIntake.map(meal => (
                                           <div key={meal.id} className="flex items-start gap-4 relative pr-8">
                                                {meal.photoDataUri ? (
                                                    <Image src={meal.photoDataUri} alt="Logged meal" width={64} height={64} className="rounded-md object-cover aspect-square"/>
                                                ) : (
                                                    <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                                                        <MessageSquareText className="w-8 h-8 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div className="flex-1 space-y-1">
                                                    <p className="font-semibold text-sm">{meal.title}</p>
                                                    <p className="text-xs text-muted-foreground">~{meal.calories} calories</p>
                                                     {meal.dietaryWarning && (
                                                        <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {meal.dietaryWarning}</p>
                                                    )}
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 absolute top-0 right-0 text-destructive" onClick={() => handleRemoveFood(meal.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                       ))}
                                   </div>
                               )}
                                <Button variant="outline" className="w-full" onClick={() => setIsFoodDialogOpen(true)}>
                                    <Utensils className="mr-2"/> Add a Meal
                                </Button>
                            </Card>
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
            <LogFoodDialog open={isFoodDialogOpen} onOpenChange={setIsFoodDialogOpen} onLog={handleLogFood} userDiagnosis={contextData.userData?.initialDiagnosis || "Not specified"}/>
        </>
    )
}

function DiaryEntryCard({ entry, onSave, currentUserEmail, onDelete, allEntries, healthTargets }: { entry: DiaryEntry; onSave: (entry: DiaryEntry) => void; currentUserEmail: string | null; onDelete: (id: string) => void; allEntries: DiaryEntry[]; healthTargets: GenerateDietaryTargetsOutput | null }) {
    const hasPainDetails = (entry.painScore ?? 0) > 0 && (entry.painLocation || entry.painRemarks);
    const dailyTotalCalories = entry.foodIntake?.reduce((acc, meal) => acc + (meal.calories || 0), 0) || 0;
    const overCalorieTarget = healthTargets && dailyTotalCalories > healthTargets.targetCalories;

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
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {entry.weight && <div><strong>Weight:</strong> {entry.weight} kg</div>}
                    {entry.sleep && <div><strong>Sleep:</strong> {entry.sleep} hours</div>}
                    {entry.fluidIntake && <div><strong>Fluid Intake:</strong> {entry.fluidIntake} ml</div>}
                    {entry.bloodSugar && <div><strong>Blood Sugar:</strong> {entry.bloodSugar} mmol/L</div>}
                    {(entry.bloodPressureSystolic && entry.bloodPressureDiastolic) && <div><strong>Blood Pressure:</strong> {entry.bloodPressureSystolic}/{entry.bloodPressureDiastolic}</div>}
                    {entry.pulse && <div><strong>Pulse:</strong> {entry.pulse} BPM</div>}
                    {/* New test results display */}
                    {entry.bloodWBC && <div><strong>WBC:</strong> {entry.bloodWBC} x10⁹/L</div>}
                    {entry.bloodNeutrophils && <div><strong>Neutrophils:</strong> {entry.bloodNeutrophils} x10⁹/L</div>}
                    {entry.bloodRBC && <div><strong>RBC:</strong> {entry.bloodRBC} x10¹²/L</div>}
                    {entry.bloodHemoglobin && <div><strong>Hemoglobin:</strong> {entry.bloodHemoglobin} g/dL</div>}
                    {entry.bloodPlatelets && <div><strong>Platelets:</strong> {entry.bloodPlatelets} x10⁹/L</div>}
                    {entry.kidneyCreatinine && <div><strong>Creatinine:</strong> {entry.kidneyCreatinine} mg/dL</div>}
                    {entry.kidneyEGFR && <div><strong>eGFR:</strong> {entry.kidneyEGFR}</div>}
                    {entry.liverALT && <div><strong>ALT:</strong> {entry.liverALT} U/L</div>}
                </div>
                {hasPainDetails && (
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Pain Details</h4>
                         <div className="text-sm text-muted-foreground">
                            {entry.painLocation && <p><strong>Location:</strong> {entry.painLocation}</p>}
                            {entry.painRemarks && <p className="whitespace-pre-wrap mt-1"><strong>Remarks:</strong> {entry.painRemarks}</p>}
                        </div>
                    </div>
                )}
                
                {entry.foodIntake && entry.foodIntake.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                            <h4 className="font-semibold text-sm">Food Intake</h4>
                            {dailyTotalCalories > 0 && 
                                <p className={cn("font-bold text-sm", overCalorieTarget && "text-destructive")}>
                                    Daily Total: ~{dailyTotalCalories} calories
                                </p>
                            }
                        </div>
                        {overCalorieTarget && (
                             <Alert variant="destructive" className="text-xs">
                                <AlertTriangle className="w-3 h-3" />
                                <AlertTitle className="font-semibold">Over Calorie Target</AlertTitle>
                                <AlertDescription>You've exceeded your daily goal of {healthTargets?.targetCalories} kcal.</AlertDescription>
                             </Alert>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {entry.foodIntake.map(meal => (
                                <Card key={meal.id} className="p-4 bg-muted/30">
                                   {meal.photoDataUri ? (
                                        <Image src={meal.photoDataUri} alt={meal.title} width={200} height={150} className="rounded-md object-cover aspect-video border w-full" />
                                    ) : (
                                        <div className="w-full aspect-video rounded-md bg-muted flex items-center justify-center">
                                            <MessageSquareText className="w-12 h-12 text-muted-foreground" />
                                        </div>
                                    )}
                                   <div className="mt-2">
                                       <h5 className="font-semibold">{meal.title}</h5>
                                       <p className="text-xs text-muted-foreground">{meal.description}</p>
                                       {meal.calories > 0 && <p className="text-sm font-bold text-primary mt-1">~{meal.calories} calories</p>}
                                       <div className="mt-2">
                                            {meal.ingredients.length > 0 && <h6 className="text-xs font-semibold">Ingredients:</h6>}
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {meal.ingredients.map((ing, i) => (
                                                    <Badge key={i} variant="secondary" className="text-xs">{ing}</Badge>
                                                ))}
                                            </div>
                                       </div>
                                       {meal.dietaryWarning && (
                                            <Alert variant="destructive" className="mt-2 text-xs">
                                                <AlertTriangle className="w-3 h-3" />
                                                <AlertTitle className="font-semibold">Dietary Note</AlertTitle>
                                                <AlertDescription>{meal.dietaryWarning}</AlertDescription>
                                            </Alert>
                                        )}
                                   </div>
                                </Card>
                            ))}
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
    const [healthTargets, setHealthTargets] = useState<GenerateDietaryTargetsOutput | null>(null);
    const entriesRef = useRef<DiaryEntry[]>([]);
    const diaryContainerRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

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
            if ((error as any).name === 'QuotaExceededError') {
                 toast({
                    variant: 'destructive',
                    title: 'Storage Full',
                    description: 'Could not save your diary. The browser storage is full. Please try deleting older entries or food photos.',
                    duration: 10000,
                });
            }
        }
    }

    const loadEntries = useCallback(() => {
        if (!currentUserEmail) return;
        try {
            const storedEntries = localStorage.getItem(`diaryEntries_${currentUserEmail}`);
            const parsedEntries: DiaryEntry[] = storedEntries ? JSON.parse(storedEntries) : [];
            parsedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setEntries(parsedEntries);

            const storedTargets = localStorage.getItem(`healthTargets_${currentUserEmail}`);
            if(storedTargets) {
                setHealthTargets(JSON.parse(storedTargets));
            }

        } catch (error) {
            console.error("Could not load diary entries from localStorage", error);
        }
    }, [currentUserEmail]);

    useEffect(() => {
        loadEntries();

        const handleSaveOnExit = () => {
            if (entriesRef.current.length > 0) {
                saveEntries(entriesRef.current);
            }
        }
        window.addEventListener('beforeunload', handleSaveOnExit);

        return () => {
            handleSaveOnExit();
            window.removeEventListener('beforeunload', handleSaveOnExit);
        }
    }, [loadEntries]);

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
        saveEntries(updatedEntries);
    };

    const handleDeleteEntry = (id: string) => {
        if (!currentUserEmail) return;
        const updatedEntries = entries.filter(e => e.id !== id);
        setEntries(updatedEntries);
        saveEntries(updatedEntries);
    };

    const handleDownloadPdf = async () => {
        const container = diaryContainerRef.current;
        if (!container) return;
        setIsDownloading(true);

        const { default: jsPDF } = await import('jspdf');
        const { default: html2canvas } = await import('html2canvas');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        
        // Title Page
        pdf.setFontSize(28);
        pdf.text("My Diary Report", pdfWidth / 2, pdfHeight / 2, { align: 'center' });

        const cardsToRender = Array.from(container.querySelectorAll('.diary-summary-card, .diary-entry-card')) as HTMLElement[];
        
        for (let i = 0; i < cardsToRender.length; i++) {
            pdf.addPage();
            const card = cardsToRender[i];
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
            
            <div ref={diaryContainerRef} className="space-y-6">
                <DiarySummary entries={entries} currentUserEmail={currentUserEmail} />

                {entries.length > 0 ? (
                    <div className="space-y-6">
                        {entries.map(entry => (
                            <DiaryEntryCard key={entry.id} entry={entry} onSave={handleSaveEntry} currentUserEmail={currentUserEmail} onDelete={handleDeleteEntry} allEntries={entries} healthTargets={healthTargets} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 rounded-lg border-2 border-dashed">
                        <h2 className="text-xl font-semibold">No entries yet</h2>
                        <p className="text-muted-foreground mt-2">Click the '+' button to add your first diary entry.</p>
                    </div>
                )}
            </div>
            
            <DiaryEntryDialog onSave={handleSaveEntry} currentUserEmail={currentUserEmail} allEntries={entries}/>
        </div>
    )
}
