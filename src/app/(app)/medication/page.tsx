
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Loader2, Pill, Trash2 } from "lucide-react"

// Data structure for a medication entry
export interface Medication {
  id: string; // ISO date string or other unique ID
  name: string;
  strength: string; // e.g., '500mg'
  dose: string; // e.g., 'One tablet twice a day'
  issuedBy: string; // e.g., 'Dr. Smith'
  issuedDate: string; // ISO date string
}

function MedicationDialog({ onSave, existingMedication }: { onSave: (med: Medication) => void; existingMedication?: Medication | null; }) {
    const [name, setName] = useState('');
    const [strength, setStrength] = useState('');
    const [dose, setDose] = useState('');
    const [issuedBy, setIssuedBy] = useState('');
    const [issuedDate, setIssuedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);
    const [id, setId] = useState(new Date().toISOString());

    useEffect(() => {
        if (existingMedication) {
            setId(existingMedication.id);
            setName(existingMedication.name);
            setStrength(existingMedication.strength);
            setDose(existingMedication.dose);
            setIssuedBy(existingMedication.issuedBy);
            setIssuedDate(new Date(existingMedication.issuedDate).toISOString().split('T')[0]);
        } else {
            // Reset for new entry
            setId(new Date().toISOString());
            setName('');
            setStrength('');
            setDose('');
            setIssuedBy('');
            setIssuedDate(new Date().toISOString().split('T')[0]);
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
        };
        onSave(medication);
        setIsSaving(false);
        document.getElementById(`close-med-dialog-${id}`)?.click();
    };
    
    return (
        <Dialog>
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

function MedicationCard({ medication, onSave, onDelete }: { medication: Medication; onSave: (med: Medication) => void; onDelete: (id: string) => void; }) {
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
                setMedications(parsedMeds);
            } else {
                setMedications([]);
            }
        } catch (error) {
            console.error("Could not load medications from localStorage", error);
        }
    }

    useEffect(() => {
        if (currentUserEmail) {
            loadMedications();
        }
    }, [currentUserEmail]);

    const handleSaveMedication = (medication: Medication) => {
        if (!currentUserEmail) return;
        
        const storageKey = `medications_${currentUserEmail}`;
        const storedMeds = localStorage.getItem(storageKey);
        const currentMeds: Medication[] = storedMeds ? JSON.parse(storedMeds) : [];
        
        const existingIndex = currentMeds.findIndex(m => m.id === medication.id);

        if (existingIndex > -1) {
            currentMeds[existingIndex] = medication;
        } else {
            currentMeds.push(medication);
        }
        
        localStorage.setItem(storageKey, JSON.stringify(currentMeds));
        loadMedications();
    };

    const handleDeleteMedication = (id: string) => {
        if (!currentUserEmail) return;
        const storageKey = `medications_${currentUserEmail}`;
        const storedMeds = localStorage.getItem(storageKey);
        const currentMeds: Medication[] = storedMeds ? JSON.parse(storedMeds) : [];
        const updatedMeds = currentMeds.filter(m => m.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(updatedMeds));
        loadMedications();
    }

    return (
        <div className="p-4 md:p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">My Medications</h1>
                    <p className="text-muted-foreground">A list of your current and past prescriptions.</p>
                </div>
            </div>

            {medications.length > 0 ? (
                <div className="space-y-6">
                    {medications.map(med => (
                        <MedicationCard key={med.id} medication={med} onSave={handleSaveMedication} onDelete={handleDeleteMedication} />
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
