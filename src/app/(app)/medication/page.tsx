
"use client"

import { useState, useEffect, useRef } from "react"
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
import { PlusCircle, Loader2, Pill, Trash2, Download, Bot, AlertCircle, RefreshCw, Camera, Edit, CalendarClock, AlertTriangle, Tablets, Repeat } from "lucide-react"
import { analyzeMedication } from "@/ai/flows/analyze-medication"
import { analyzeMedicationPhoto, AnalyzeMedicationPhotoOutput } from "@/ai/flows/analyze-medication-photo"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"


// Data structure for a medication entry
export interface Medication {
  id: string; // ISO date string or other unique ID
  name: string;
  strength: string; // e.g., '500mg'
  dose: string; // e.g., 'One tablet twice a day'
  issuedBy: string; // e.g., 'Dr. Smith'
  issuedDate: string; // ISO date string
  summary?: string;
  interactionWarning?: string;
  sideEffects?: string;
  disclaimer?: string;
  isAnalyzing?: boolean;
  maxDosePerDay?: number;
  dosePerIntake?: number;
  frequency?: string;
}

function AddMedicationByPhotoDialog({ onPhotoAnalyzed, onOpenChange, open }: { onPhotoAnalyzed: (details: AnalyzeMedicationPhotoOutput) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        const getCameraPermission = async () => {
            if (!open) return; // Only run when dialog is open
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
        getCameraPermission();

        return () => {
            // Cleanup: stop video stream when component unmounts or dialog closes
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        }
    }, [toast, open]);

    const handleCaptureAndAnalyze = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setIsAnalyzing(true);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

        const photoDataUri = canvas.toDataURL('image/jpeg');

        try {
            const result = await analyzeMedicationPhoto({ photoDataUri });
            onPhotoAnalyzed(result);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to analyze medication photo:", error);
            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: 'Could not read details from the photo. Please try again or enter manually.',
            });
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add Medication with Photo</DialogTitle>
                <DialogDescription>
                    Point your camera at the medication box. Ensure the text is clear and well-lit.
                </DialogDescription>
            </DialogHeader>
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
            <DialogFooter>
                 <DialogClose asChild>
                    <Button id="close-photo-dialog" variant="ghost">Cancel</Button>
                 </DialogClose>
                <Button onClick={handleCaptureAndAnalyze} disabled={!hasCameraPermission || isAnalyzing}>
                    {isAnalyzing ? <Loader2 className="animate-spin mr-2"/> : <Camera className="mr-2"/>}
                    Capture & Analyze
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    )
}

function MedicationDialog({ onSave, existingMedication, initialValues, open, onOpenChange }: { onSave: (med: Medication, isNew: boolean) => void; existingMedication?: Medication | null; initialValues?: Partial<Medication> | null, open: boolean, onOpenChange: (open: boolean) => void; }) {
    const [name, setName] = useState('');
    const [strength, setStrength] = useState('');
    const [dose, setDose] = useState('');
    const [dosePerIntake, setDosePerIntake] = useState<number | undefined>();
    const [frequency, setFrequency] = useState<string | undefined>();
    const [maxDosePerDay, setMaxDosePerDay] = useState<number | undefined>();
    const [issuedBy, setIssuedBy] = useState('');
    const [issuedDate, setIssuedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);
    const [id, setId] = useState(new Date().toISOString());

    const isNew = !existingMedication;

    const resetForm = () => {
        setId(new Date().toISOString());
        setName(initialValues?.name || '');
        setStrength(initialValues?.strength || '');
        setDose(initialValues?.dose || '');
        setDosePerIntake(initialValues?.dosePerIntake || undefined);
        setFrequency(initialValues?.frequency || undefined);
        setMaxDosePerDay(initialValues?.maxDosePerDay || undefined);
        setIssuedBy(initialValues?.issuedBy || '');
        setIssuedDate(initialValues?.issuedDate || new Date().toISOString().split('T')[0]);
    }
    
    useEffect(() => {
        if(open && initialValues) {
             setName(initialValues.name || '');
             setStrength(initialValues.strength || '');
             setDose(initialValues.dose || '');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialValues]);

    useEffect(() => {
        if (open && existingMedication) {
            setId(existingMedication.id);
            setName(existingMedication.name);
            setStrength(existingMedication.strength);
            setDose(existingMedication.dose);
            setDosePerIntake(existingMedication.dosePerIntake);
            setFrequency(existingMedication.frequency);
            setMaxDosePerDay(existingMedication.maxDosePerDay);
            setIssuedBy(existingMedication.issuedBy);
            setIssuedDate(new Date(existingMedication.issuedDate).toISOString().split('T')[0]);
        } else if (open) {
            resetForm();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, existingMedication]);

    const handleSave = () => {
        setIsSaving(true);
        const medication: Medication = {
            id: initialValues?.id || id,
            name,
            strength,
            dose,
            dosePerIntake,
            frequency,
            maxDosePerDay,
            issuedBy,
            issuedDate: new Date(issuedDate).toISOString(),
            isAnalyzing: isNew, // Only set analyzing flag for new meds
        };
        onSave(medication, isNew);
        setIsSaving(false);
        onOpenChange(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{existingMedication ? 'Edit' : 'Add'} Medication</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="space-y-2">
                        <Label htmlFor="med-name">Medication Name</Label>
                        <Input id="med-name" placeholder="e.g., Paracetamol" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="med-strength">Strength</Label>
                        <Input id="med-strength" placeholder="e.g., 500mg" value={strength} onChange={(e) => setStrength(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="med-dose">Dose Instructions</Label>
                        <Textarea id="med-dose" placeholder="e.g., One tablet twice a day" value={dose} onChange={(e) => setDose(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="med-dose-per-intake">Dose Per Intake</Label>
                            <Input id="med-dose-per-intake" type="number" placeholder="e.g., 2" value={dosePerIntake || ''} onChange={(e) => setDosePerIntake(e.target.value ? parseInt(e.target.value) : undefined)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="med-max-dose">Max Dose Per Day</Label>
                            <Input id="med-max-dose" type="number" placeholder="e.g., 8" value={maxDosePerDay || ''} onChange={(e) => setMaxDosePerDay(e.target.value ? parseInt(e.target.value) : undefined)} />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="med-frequency">Frequency</Label>
                        <Input id="med-frequency" placeholder="e.g., Every 4-6 hours" value={frequency || ''} onChange={(e) => setFrequency(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="med-issued-by">Issued By</Label>
                        <Input id="med-issued-by" placeholder="e.g., Dr. Smith" value={issuedBy} onChange={(e) => setIssuedBy(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="med-issued-date">Date Issued</Label>
                        <Input id="med-issued-date" type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} />
                    </div>
                </div>
                 <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving || !name}>
                        {isSaving && <Loader2 className="animate-spin mr-2" />}
                        Save Medication
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function MedicationCard({ medication, onSave, onDelete, onRecheck, isAnalyzingAny }: { medication: Medication; onSave: (med: Medication, isNew: boolean) => void; onDelete: (id: string) => void; onRecheck: (id: string) => void; isAnalyzingAny: boolean; }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-xl flex items-center gap-2">
                            <Pill className="w-5 h-5 text-primary" />
                            {medication.name}
                        </CardTitle>
                        <CardDescription>
                            Issued on {new Date(medication.issuedDate).toLocaleDateString('en-GB')}
                        </CardDescription>
                    </div>
                     <div className="text-right">
                         {medication.strength && <div className="font-bold">{medication.strength}</div>}
                     </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {medication.dose && (
                    <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Dose</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{medication.dose}</p>
                    </div>
                )}
                 {medication.issuedBy && (
                    <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Issued By</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{medication.issuedBy}</p>
                    </div>
                )}

                {/* AI Analysis Section */}
                <div className="space-y-4 pt-4 border-t mt-4">
                     <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><Bot className="w-4 h-4 text-primary"/> AI Summary</h4>
                        <Button variant="ghost" size="sm" onClick={() => onRecheck(medication.id)} disabled={isAnalyzingAny}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {medication.summary ? 'Re-check' : 'Check'}
                        </Button>
                    </div>
                    {medication.isAnalyzing ? (
                         <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <p>Generating AI summary...</p>
                        </div>
                    ) : medication.summary ? (
                        <>
                            <p className="text-sm text-muted-foreground">{medication.summary}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-xs flex items-center gap-2"><Tablets className="w-4 h-4 text-primary"/> Dose Per Intake</h4>
                                    <p className="text-sm text-muted-foreground">{medication.dosePerIntake ? `${medication.dosePerIntake} units` : 'Not specified'}</p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-xs flex items-center gap-2"><Repeat className="w-4 h-4 text-primary"/> Frequency</h4>
                                    <p className="text-sm text-muted-foreground">{medication.frequency || 'Not specified'}</p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-xs flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /> Max Daily Dose</h4>
                                    <p className="text-sm text-muted-foreground">{medication.maxDosePerDay ? `${medication.maxDosePerDay} units` : 'Not specified'}</p>
                                </div>
                            </div>
                            
                            {medication.interactionWarning && (
                                 <Alert variant="destructive" className="mt-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Potential Interaction</AlertTitle>
                                    <AlertDescription>{medication.interactionWarning}</AlertDescription>
                                </Alert>
                            )}
                            
                            {medication.sideEffects && (
                                <div className="space-y-1 mt-4">
                                    <h5 className="font-semibold text-xs">Common Side Effects</h5>
                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{medication.sideEffects}</p>
                                </div>
                            )}

                             {medication.disclaimer && (
                                <p className="text-xs text-muted-foreground/80 italic mt-4">{medication.disclaimer}</p>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground">Click 'Check' to get an AI summary and interaction check for this medication.</p>
                    )}
                </div>
            </CardContent>
             <CardFooter className="flex justify-between">
                 <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>Edit</Button>
                 <MedicationDialog onSave={onSave} existingMedication={medication} open={isEditOpen} onOpenChange={setIsEditOpen} />
                 <Button variant="destructive" size="sm" onClick={() => onDelete(medication.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                 </Button>
             </CardFooter>
        </Card>
    );
}

export default function MedicationPage() {
    const [medications, setMedications] = useState<Medication[]>([]);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const medicationsRef = useRef(medications);
    const [medToAnalyze, setMedToAnalyze] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // State for dialogs
    const [isManualOpen, setIsManualOpen] = useState(false);
    const [isPhotoOpen, setIsPhotoOpen] = useState(false);
    const [isChooserOpen, setIsChooserOpen] = useState(false);
    const [initialValues, setInitialValues] = useState<Partial<Medication> | null>(null);

    useEffect(() => {
        medicationsRef.current = medications;
    }, [medications]);

    useEffect(() => {
        const email = localStorage.getItem("currentUserEmail");
        setCurrentUserEmail(email);
    }, []);

    const loadMedications = () => {
        if (!currentUserEmail) return;
        try {
            const storedMeds = localStorage.getItem(`medications_${currentUserEmail}`);
            if (storedMeds) {
                const parsedMeds: Medication[] = JSON.parse(storedMeds);
                parsedMeds.sort((a, b) => new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime());
                setMedications(parsedMeds.map(m => ({ ...m, isAnalyzing: false })));
            } else {
                setMedications([]);
            }
        } catch (error) {
            console.error("Could not load medications from localStorage", error);
        }
    }
    
    const saveMedications = (meds: Medication[]) => {
        if (!currentUserEmail) return;
        try {
            localStorage.setItem(`medications_${currentUserEmail}`, JSON.stringify(meds));
        } catch (error) {
            console.error("Could not save medications to localStorage", error);
        }
    }
    
    useEffect(() => {
        if (currentUserEmail) {
            loadMedications();
        }
        
        const saveOnExit = () => {
            if (medicationsRef.current.length > 0) {
              saveMedications(medicationsRef.current);
            }
        };

        window.addEventListener('beforeunload', saveOnExit);

        return () => {
            saveOnExit();
            window.removeEventListener('beforeunload', saveOnExit);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserEmail]);

    const triggerMedicationAnalysis = async (medicationId: string) => {
        const currentMeds = medicationsRef.current;
        const medIndex = currentMeds.findIndex(m => m.id === medicationId);
        if (medIndex === -1) return;

        const medicationToAnalyze = currentMeds[medIndex];
        const existingMedications = currentMeds
            .filter(m => m.id !== medicationId)
            .map(m => m.name);

        try {
            const analysisResult = await analyzeMedication({
                medicationName: medicationToAnalyze.name,
                existingMedications,
            });

            setMedications(prevMeds => {
                const updatedMeds = prevMeds.map(m => {
                    if (m.id === medicationId) {
                        return {
                            ...m,
                            summary: analysisResult.summary,
                            interactionWarning: analysisResult.interactionWarning,
                            sideEffects: analysisResult.sideEffects,
                            disclaimer: analysisResult.disclaimer,
                            isAnalyzing: false,
                        };
                    }
                    return m;
                });
                saveMedications(updatedMeds);
                return updatedMeds;
            });
        } catch (error) {
            console.error("Failed to analyze medication:", error);
             setMedications(prevMeds => {
                const updatedMeds = prevMeds.map(m => m.id === medicationId ? { ...m, isAnalyzing: false } : m)
                saveMedications(updatedMeds);
                return updatedMeds;
             });
        }
    };
    
    useEffect(() => {
        if (medToAnalyze) {
            triggerMedicationAnalysis(medToAnalyze);
            setMedToAnalyze(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [medToAnalyze]);

    const handleSaveMedication = (medication: Medication, isNew: boolean) => {
        if (!currentUserEmail) return;
        
        let updatedMeds: Medication[];
        const existingIndex = medications.findIndex(m => m.id === medication.id);

        if (existingIndex > -1) {
            updatedMeds = [...medications];
            updatedMeds[existingIndex] = { ...updatedMeds[existingIndex], ...medication, isAnalyzing: false };
        } else {
            updatedMeds = [medication, ...medications];
        }
        
        updatedMeds.sort((a, b) => new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime());
        setMedications(updatedMeds);
        saveMedications(updatedMeds);

        if (isNew) {
            setMedToAnalyze(medication.id);
        }
    };

    const handleRecheckAnalysis = (medicationId: string) => {
        setMedications(prevMeds => {
            const medToRecheck = prevMeds.find(m => m.id === medicationId);
            if (medToRecheck) {
                setMedToAnalyze(medicationId);
            }
            return prevMeds.map(m => m.id === medicationId ? { ...m, isAnalyzing: true } : m)
        });
    };

    const handleDeleteMedication = (id: string) => {
        if (!currentUserEmail) return;
        const updatedMeds = medications.filter(m => m.id !== id);
        setMedications(updatedMeds);
        saveMedications(updatedMeds);
    };

    const handlePhotoAnalyzed = (details: AnalyzeMedicationPhotoOutput) => {
        setInitialValues({
            id: new Date().toISOString(),
            ...details
        });
        setIsPhotoOpen(false);
        setIsManualOpen(true);
    };

    const handleManualOpenChange = (open: boolean) => {
        setIsManualOpen(open);
        if (!open) {
            setInitialValues(null);
        }
    };
    
    const handleDownloadPdf = async () => {
        if (!medications || medications.length === 0) return;
        setIsDownloading(true);

        const { default: jsPDF } = await import('jspdf');
        await import('jspdf-autotable');

        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("My Medications List", 14, 22);

        const tableColumn = ["Name", "Strength", "Dose", "Issued By", "Date Issued"];
        const tableRows: (string | null | undefined)[][] = [];

        medications.forEach(med => {
            const medData = [
                med.name,
                med.strength,
                med.dose,
                med.issuedBy,
                new Date(med.issuedDate).toLocaleDateString(),
            ];
            tableRows.push(medData);
        });

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
        });
        
        doc.save("Medication_List.pdf");
        setIsDownloading(false);
    };

    const isAnyMedAnalyzing = medications.some(m => m.isAnalyzing);

    return (
        <div className="p-4 md:p-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">My Medications</h1>
                    <p className="text-muted-foreground">A list of your current and past prescriptions.</p>
                </div>
                 <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <Button onClick={handleDownloadPdf} disabled={isDownloading || medications.length === 0} variant="outline">
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Download PDF
                    </Button>
                </div>
            </div>

            <div className="space-y-6 w-full">
                {medications.length > 0 ? (
                    medications.map(med => (
                        <MedicationCard 
                            key={med.id} 
                            medication={med} 
                            onSave={handleSaveMedication} 
                            onDelete={handleDeleteMedication}
                            onRecheck={handleRecheckAnalysis}
                            isAnalyzingAny={isAnyMedAnalyzing}
                        />
                    ))
                ) : (
                    <div className="text-center py-20 rounded-lg border-2 border-dashed">
                        <h2 className="text-xl font-semibold">No medications added yet</h2>
                        <p className="text-muted-foreground mt-2">Click the '+' button to add your first prescription.</p>
                    </div>
                )}
            </div>
            
            <Dialog open={isChooserOpen} onOpenChange={setIsChooserOpen}>
                <DialogTrigger asChild>
                    <Button size="lg" className="fixed bottom-24 right-6 h-16 w-16 rounded-full shadow-lg md:bottom-8 md:right-8">
                        <PlusCircle className="h-8 w-8" />
                        <span className="sr-only">Add New Medication</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add a New Medication</DialogTitle>
                        <DialogDescription>
                            How would you like to add your medication?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-around py-4">
                        <Button
                            variant="outline"
                            className="h-24 w-32 flex-col gap-2"
                            onClick={() => { setIsChooserOpen(false); setIsManualOpen(true); }}
                        >
                            <Edit className="h-8 w-8" />
                            <span>Add Manually</span>
                        </Button>
                        <Button
                            variant="outline"
                             className="h-24 w-32 flex-col gap-2"
                            onClick={() => { setIsChooserOpen(false); setIsPhotoOpen(true); }}
                        >
                             <Camera className="h-8 w-8" />
                             <span>Use Camera</span>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <MedicationDialog 
                onSave={handleSaveMedication} 
                initialValues={initialValues}
                open={isManualOpen}
                onOpenChange={handleManualOpenChange}
            />
            <AddMedicationByPhotoDialog
                open={isPhotoOpen}
                onOpenChange={setIsPhotoOpen}
                onPhotoAnalyzed={handlePhotoAnalyzed}
            />
        </div>
    );
}
