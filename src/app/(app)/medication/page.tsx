
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Loader2, Pill, Trash2, Download, Bot, AlertCircle, RefreshCw } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from 'jspdf-autotable'
import { analyzeMedication } from "@/ai/flows/analyze-medication"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"


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
}

function MedicationDialog({ onSave, existingMedication }: { onSave: (med: Medication, isNew: boolean) => void; existingMedication?: Medication | null; }) {
    const [name, setName] = useState('');
    const [strength, setStrength] = useState('');
    const [dose, setDose] = useState('');
    const [issuedBy, setIssuedBy] = useState('');
    const [issuedDate, setIssuedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);
    const [id, setId] = useState(new Date().toISOString());

    const isNew = !existingMedication;

    const resetForm = () => {
        setId(new Date().toISOString());
        setName('');
        setStrength('');
        setDose('');
        setIssuedBy('');
        setIssuedDate(new Date().toISOString().split('T')[0]);
    }

    useEffect(() => {
        if (existingMedication) {
            setId(existingMedication.id);
            setName(existingMedication.name);
            setStrength(existingMedication.strength);
            setDose(existingMedication.dose);
            setIssuedBy(existingMedication.issuedBy);
            setIssuedDate(new Date(existingMedication.issuedDate).toISOString().split('T')[0]);
        } else {
            resetForm();
        }
    }, [existingMedication]);

    const handleSave = () => {
        setIsSaving(true);
        const medication: Medication = {
            id,
            name,
            strength,
            dose,
            issuedBy,
            issuedDate: new Date(issuedDate).toISOString(),
            isAnalyzing: isNew, // Only set analyzing flag for new meds
        };
        onSave(medication, isNew);
        setIsSaving(false);
        document.getElementById(`close-med-dialog-${id}`)?.click();
    };

    const onOpenChange = (open: boolean) => {
        if (open) {
            if (existingMedication) {
                // Pre-fill form for editing
                setId(existingMedication.id);
                setName(existingMedication.name);
                setStrength(existingMedication.strength);
                setDose(existingMedication.dose);
                setIssuedBy(existingMedication.issuedBy);
                setIssuedDate(new Date(existingMedication.issuedDate).toISOString().split('T')[0]);
            } else {
                // Reset form for new entry
                resetForm();
            }
        }
    }
    
    return (
        <Dialog onOpenChange={onOpenChange}>
             <DialogTrigger asChild>
                {existingMedication ? (
                     <Button variant="outline" size="sm">Edit</Button>
                ) : (
                    <Button size="lg" className="fixed bottom-24 right-6 h-16 w-16 rounded-full shadow-lg md:bottom-8 md:right-8">
                        <PlusCircle className="h-8 w-8" />
                        <span className="sr-only">Add New Medication</span>
                    </Button>
                )}
            </DialogTrigger>
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
                        <Label htmlFor="med-dose">Dose</Label>
                        <Textarea id="med-dose" placeholder="e.g., One tablet twice a day" value={dose} onChange={(e) => setDose(e.target.value)} />
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
                    <DialogClose id={`close-med-dialog-${id}`} asChild>
                         <Button variant="ghost">Cancel</Button>
                    </DialogClose>
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
                {medication.isAnalyzing ? (
                     <div className="flex items-center gap-2 text-muted-foreground pt-4">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <p>Generating AI summary...</p>
                    </div>
                ) : (
                    medication.summary && (
                        <div className="space-y-4 pt-4 border-t mt-4">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-sm flex items-center gap-2"><Bot className="w-4 h-4 text-primary"/> AI Summary</h4>
                                <Button variant="ghost" size="sm" onClick={() => onRecheck(medication.id)} disabled={isAnalyzingAny}>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Re-check
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">{medication.summary}</p>
                            
                            {medication.interactionWarning && (
                                 <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Potential Interaction</AlertTitle>
                                    <AlertDescription>{medication.interactionWarning}</AlertDescription>
                                </Alert>
                            )}
                            
                            {medication.sideEffects && (
                                <div className="space-y-1">
                                    <h5 className="font-semibold text-xs">Common Side Effects</h5>
                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{medication.sideEffects}</p>
                                </div>
                            )}

                             {medication.disclaimer && (
                                <p className="text-xs text-muted-foreground/80 italic">{medication.disclaimer}</p>
                            )}
                        </div>
                    )
                )}
            </CardContent>
             <CardFooter className="flex justify-between">
                 <MedicationDialog onSave={onSave} existingMedication={medication} />
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
    const [isDownloading, setIsDownloading] = useState(false);
    const medicationsRef = useRef(medications);

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
        
        return () => {
            if (currentUserEmail) {
                saveMedications(medicationsRef.current);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserEmail]);

    const handleSaveMedication = (medication: Medication, isNew: boolean) => {
        if (!currentUserEmail) return;
        
        let updatedMeds: Medication[];
        const existingIndex = medications.findIndex(m => m.id === medication.id);

        if (existingIndex > -1) {
            updatedMeds = [...medications];
            updatedMeds[existingIndex] = medication;
        } else {
            updatedMeds = [medication, ...medications];
        }
        
        updatedMeds.sort((a, b) => new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime());
        setMedications(updatedMeds);
        saveMedications(updatedMeds);

        if (isNew) {
            triggerMedicationAnalysis(medication.id);
        }
    };

    const triggerMedicationAnalysis = async (medicationId: string) => {
        const currentMeds = medicationsRef.current;
        const medIndex = currentMeds.findIndex(m => m.id === medicationId);
        if (medIndex === -1) return;

        const medicationToAnalyze = currentMeds[medIndex];
        const existingMedications = currentMeds
            .filter(m => m.id !== medicationId)
            .map(m => m.name);

        try {
            const result = await analyzeMedication({
                medicationName: medicationToAnalyze.name,
                existingMedications,
            });

            setMedications(prevMeds => {
                const updatedMeds = prevMeds.map(m => {
                    if (m.id === medicationId) {
                        return {
                            ...m,
                            summary: result.summary,
                            interactionWarning: result.interactionWarning,
                            sideEffects: result.sideEffects,
                            disclaimer: result.disclaimer,
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
            // Update the UI to remove the loading state and show an error if desired
             setMedications(prevMeds => {
                const updatedMeds = prevMeds.map(m => m.id === medicationId ? { ...m, isAnalyzing: false } : m)
                saveMedications(updatedMeds);
                return updatedMeds;
             });
        }
    };

    const handleRecheckAnalysis = (medicationId: string) => {
        setMedications(prevMeds => 
            prevMeds.map(m => m.id === medicationId ? { ...m, isAnalyzing: true } : m)
        );
        // The state update is async, so we pass the *next* state to the trigger function.
        // It's safer to just call the trigger which will use the ref to get the latest state.
        triggerMedicationAnalysis(medicationId);
    };

    const handleDeleteMedication = (id: string) => {
        if (!currentUserEmail) return;
        const updatedMeds = medications.filter(m => m.id !== id);
        setMedications(updatedMeds);
        saveMedications(updatedMeds);
    }

    const handleDownloadPdf = async () => {
        if (medications.length === 0) return;
        setIsDownloading(true);

        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.text("My Medication List", 105, 20, { align: 'center' });

        const tableColumn = ["Medication Name", "Strength", "Dose Instructions", "Issued By", "Date Issued"];
        const tableRows = medications.map(med => [
            med.name,
            med.strength,
            med.dose,
            med.issuedBy,
            new Date(med.issuedDate).toLocaleDateString('en-GB')
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'grid',
            styles: {
                halign: 'center'
            },
            headStyles: {
                fillColor: [22, 163, 74],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 25 },
                2: { cellWidth: 'auto' },
                3: { cellWidth: 30 },
                4: { cellWidth: 30 },
            }
        });

        doc.save('My-Medications.pdf');
        
        setIsDownloading(false);
    }

    const isAnyMedAnalyzing = medications.some(m => m.isAnalyzing);

    return (
        <div className="p-4 md:p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">My Medications</h1>
                    <p className="text-muted-foreground">A list of your current and past prescriptions.</p>
                </div>
                 <Button onClick={handleDownloadPdf} disabled={isDownloading || medications.length === 0} variant="outline">
                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Download PDF
                </Button>
            </div>

            {medications.length > 0 ? (
                <div className="space-y-6 w-full">
                    {medications.map(med => (
                        <MedicationCard 
                            key={med.id} 
                            medication={med} 
                            onSave={handleSaveMedication} 
                            onDelete={handleDeleteMedication}
                            onRecheck={handleRecheckAnalysis}
                            isAnalyzingAny={isAnyMedAnalyzing}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 rounded-lg border-2 border-dashed">
                    <h2 className="text-xl font-semibold">No medications added yet</h2>
                    <p className="text-muted-foreground mt-2">Click the '+' button to add your first prescription.</p>
                </div>
            )}
            
            <MedicationDialog onSave={handleSaveMedication} />
        </div>
    )
}

    

    