
"use client"

import { useState, useEffect, useCallback, ChangeEvent, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { IndeterminateCheckbox } from "@/components/ui/indeterminate-checkbox"
import { useToast } from "@/hooks/use-toast"
import { User, Save, Mail, Camera, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


const benefitsList = [
    { id: 'uc', label: 'Universal Credit (UC)' },
    { id: 'jsa', label: 'Jobseeker\'s Allowance (JSA)' },
    { id: 'esa', label: 'Employment and Support Allowance (ESA)' },
    { id: 'pension_credit', label: 'Pension Credit' },
    { id: 'housing_benefit', label: 'Housing Benefit' },
    { id: 'council_tax_support', label: 'Council Tax Support' },
    { id: 'pip', label: 'Personal Independence Payment (PIP)' },
    { id: 'attendance_allowance', label: 'Attendance Allowance' },
    { id: 'carer_allowance', label: 'Carer\'s Allowance' },
    { id: 'child_benefit', label: 'Child Benefit' },
    { id: 'maternity_allowance', label: 'Maternity Allowance' },
    { id: 'state_pension', label: 'State Pension' },
    { id: 'dla', label: 'Disability Living Allowance (DLA)' },
    { id: 'income_support', label: 'Income Support' },
] as const

const initialDiagnosisOptions = [
    "Cancer (All Types)",
    "Heart Disease and Cardiac Arrhythmias",
    "Stroke and Cerebrovascular Disease",
    "Neurological Disorders (Multiple Sclerosis, Epilepsy, Parkinson's)",
    "Kidney Disease and Renal Failure",
    "Liver Disease and Cirrhosis",
    "Inflammatory Bowel Disease",
    "Rheumatoid Arthritis and Autoimmune Diseases",
    "Diabetes with Complications",
    "Chronic Obstructive Pulmonary Disease (Severe)",
    "Asthma (Severe/Brittle)",
    "Mental Health Conditions (Severe/Complex)",
    "Spinal Disorders Requiring Surgery",
    "Joint Replacement Surgery",
    "Cataracts and Glaucoma",
    "Thyroid Cancer and Complex Thyroid Disorders",
    "Endometriosis (Severe)",
    "Uterine Fibroids Requiring Surgery",
    "Prostate Disease (Benign and Malignant)",
    "Breast Disease and Cancer",
    "Gastroesophageal Reflux Disease (Severe)",
    "Peptic Ulcer Disease (Complicated)",
    "Gallbladder Disease",
    "Hernias Requiring Surgery",
    "Peripheral Vascular Disease",
    "Aortic Aneurysm",
    "Heart Valve Disease",
    "Coronary Artery Disease",
    "Chronic Pain Syndromes",
    "Sleep Apnea (Severe)"
];

interface UserData {
    name?: string;
    lastName?: string;
    age?: string;
    gender?: string;
    height?: string;
    address1?: string;
    address2?: string;
    townCity?: string;
    countyState?: string;
    country?: string;
    postcode?: string;
    dob?: string;
    employmentStatus?: string;
    income?: string;
    savings?: string;
    benefits?: string[];
    initialDiagnosis?: string;
    profilePicture?: string; // data URI
}

interface ProfileUpdateActivity {
  id: string;
  type: 'profileUpdate';
  title: string;
  content: string;
  date: string;
}

function ProfilePictureCameraDialog({ onCapture, open, onOpenChange }: { onCapture: (dataUri: string) => void; open: boolean; onOpenChange: (open: boolean) => void; }) {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState(true);
    const [isCapturing, setIsCapturing] = useState(false);

    useEffect(() => {
        const getCameraPermission = async () => {
            if (!open) return;
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
                    description: 'Please enable camera permissions in your browser settings.',
                });
            }
        };

        getCameraPermission();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [open, toast]);

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        setIsCapturing(true);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

        const photoDataUri = canvas.toDataURL('image/jpeg');
        onCapture(photoDataUri);
        setIsCapturing(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Take a Profile Photo</DialogTitle>
                    <DialogDescription>
                        Center your face in the frame and click capture.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <div className="relative">
                        <video ref={videoRef} className="w-full aspect-square rounded-full object-cover bg-muted" autoPlay muted playsInline />
                        <canvas ref={canvasRef} className="hidden" />
                        {!hasCameraPermission && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                <p className="text-white text-center">Camera access is required.</p>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleCapture} disabled={!hasCameraPermission || isCapturing}>
                        {isCapturing ? <Loader2 className="animate-spin mr-2"/> : <Camera className="mr-2"/>}
                        Capture
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ProfilePage() {
    const router = useRouter()
    const { toast } = useToast()
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const [userData, setUserData] = useState<UserData>({});
    const [isLoading, setIsLoading] = useState(true);

    const [selectedBenefits, setSelectedBenefits] = useState<Record<string, boolean>>({});
    const [diagnosisSelection, setDiagnosisSelection] = useState('');
    const [otherDiagnosis, setOtherDiagnosis] = useState('');
    const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);


    const loadUserData = useCallback(() => {
        setIsLoading(true);
        const email = localStorage.getItem("currentUserEmail");
        if (email) {
            setCurrentUserEmail(email);
            const storedData = localStorage.getItem(`userData_${email}`);
            if (storedData) {
                const parsedData: UserData = JSON.parse(storedData);
                setUserData(parsedData);

                // Set up diagnosis fields
                if (parsedData.initialDiagnosis) {
                    const isOther = !initialDiagnosisOptions.includes(parsedData.initialDiagnosis);
                    if (isOther) {
                        setDiagnosisSelection('other');
                        setOtherDiagnosis(parsedData.initialDiagnosis);
                    } else {
                        setDiagnosisSelection(parsedData.initialDiagnosis);
                        setOtherDiagnosis('');
                    }
                }

                 // Initialize selectedBenefits from user data
                const initialSelected: Record<string, boolean> = {};
                benefitsList.forEach(b => {
                    if (parsedData.benefits?.includes(b.label)) {
                        initialSelected[b.id] = true;
                    }
                });
                setSelectedBenefits(initialSelected);
            }
        } else {
            router.push("/login");
        }
        setIsLoading(false);
    }, [router]);

    useEffect(() => {
        loadUserData();
    }, [loadUserData]);
    
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
    }

    const handleSelectChange = (name: keyof UserData, value: string) => {
        setUserData(prev => ({ ...prev, [name]: value }));
    }
    
    const handleDiagnosisSelectChange = (value: string) => {
        setDiagnosisSelection(value);
        if (value !== 'other') {
            setOtherDiagnosis('');
            setUserData(prev => ({...prev, initialDiagnosis: value}));
        }
    }
    
    const handleOtherDiagnosisChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setOtherDiagnosis(value);
        setUserData(prev => ({...prev, initialDiagnosis: value}));
    }

    const handleBenefitChange = (benefitId: string, checked: boolean) => {
        setSelectedBenefits(prev => ({ ...prev, [benefitId]: checked }))
    }

    const handleProfilePictureCapture = (dataUri: string) => {
        setUserData(prev => ({...prev, profilePicture: dataUri}));
    }

    const handleSave = () => {
        if (!currentUserEmail) return;

        const updatedBenefits = Object.entries(selectedBenefits)
            .filter(([, checked]) => checked)
            .map(([id]) => benefitsList.find(b => b.id === id)?.label)
            .filter((l): l is string => l !== undefined); // Filter out undefined

        const finalUserData = { 
            ...userData, 
            benefits: updatedBenefits,
            initialDiagnosis: diagnosisSelection === 'other' ? otherDiagnosis : diagnosisSelection,
        };

        localStorage.setItem(`userData_${currentUserEmail}`, JSON.stringify(finalUserData));
        setUserData(finalUserData);
        toast({
            title: "Profile Saved",
            description: "Your information has been updated successfully.",
        });

        // Create and save an activity item
        const activityKey = `conversationSummaries_${currentUserEmail}`;
        const storedActivities = localStorage.getItem(activityKey);
        const activities: (object | ProfileUpdateActivity)[] = storedActivities ? JSON.parse(storedActivities) : [];

        const newActivity: ProfileUpdateActivity = {
            id: new Date().toISOString(),
            type: 'profileUpdate',
            title: "Profile Updated",
            content: "Your personal and financial information was updated.",
            date: new Date().toISOString(),
        };

        activities.unshift(newActivity);
        localStorage.setItem(activityKey, JSON.stringify(activities));
    }

    const allBenefitsSelected = Object.keys(selectedBenefits).length > 0 && Object.values(selectedBenefits).every(Boolean) && Object.keys(selectedBenefits).length === benefitsList.length;
    const someBenefitsSelected = Object.values(selectedBenefits).some(Boolean) && !allBenefitsSelected;


    if (isLoading) {
        return <div className="p-6">Loading...</div>
    }

    return (
        <>
            <div className="p-4 md:p-6 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-headline">My Profile</h1>
                        <p className="text-muted-foreground">
                        View and edit your personal information.
                        </p>
                    </div>
                    <Button onClick={handleSave}><Save className="mr-2" /> Save Changes</Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Details</CardTitle>
                        <CardDescription>This information helps personalize the support you receive.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <div className="relative group">
                                <Avatar className="w-24 h-24 border-2 border-primary/20">
                                    <AvatarImage src={userData.profilePicture} alt="Profile Picture" />
                                    <AvatarFallback className="bg-muted">
                                        <User className="w-12 h-12 text-muted-foreground" />
                                    </AvatarFallback>
                                </Avatar>
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background group-hover:bg-accent"
                                    onClick={() => setIsCameraDialogOpen(true)}
                                >
                                    <Camera className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex-grow space-y-2">
                                <div className="flex items-center space-x-4 rounded-md border p-4 bg-muted/50">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                    <div className="flex-grow">
                                        <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                                        <div id="email" className="font-semibold">{currentUserEmail}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                    <Label htmlFor="name">First name</Label>
                                    <Input id="name" name="name" placeholder="Alex" value={userData.name || ''} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                    <Label htmlFor="lastName">Last name</Label>
                                    <Input id="lastName" name="lastName" placeholder="Smith" value={userData.lastName || ''} onChange={handleInputChange}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="age">Age</Label>
                                <Input id="age" name="age" type="number" placeholder="Your age" value={userData.age || ''} onChange={handleInputChange} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="height">Height (cm)</Label>
                                <Input id="height" name="height" type="number" placeholder="e.g. 175" value={userData.height || ''} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <RadioGroup name="gender" value={userData.gender} onValueChange={(v) => handleSelectChange('gender', v)} className="flex gap-4 pt-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="female" id="female" />
                                        <Label htmlFor="female">Female</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="male" id="male" />
                                        <Label htmlFor="male">Male</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="other" id="other" />
                                        <Label htmlFor="other">Other</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address1">House Number/Name & Street</Label>
                            <Input id="address1" name="address1" placeholder="e.g., 10 Downing Street" value={userData.address1 || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address2">Address Line 2 (optional)</Label>
                            <Input id="address2" name="address2" value={userData.address2 || ''} onChange={handleInputChange}/>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="townCity">Town/City</Label>
                                <Input id="townCity" name="townCity" placeholder="e.g., London" value={userData.townCity || ''} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="countyState">County/State</Label>
                                <Input id="countyState" name="countyState" placeholder="e.g., Greater London" value={userData.countyState || ''} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input id="country" name="country" placeholder="e.g., United Kingdom" value={userData.country || ''} onChange={handleInputChange}/>
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor="postcode">Postcode</Label>
                            <Input id="postcode" name="postcode" placeholder="Your postcode" value={userData.postcode || ''} onChange={handleInputChange}/>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input id="dob" name="dob" type="date" value={userData.dob ? new Date(userData.dob).toISOString().split('T')[0] : ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="initial-diagnosis">Primary Health Condition</Label>
                            <Select onValueChange={handleDiagnosisSelectChange} value={diagnosisSelection}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your main condition" />
                                </SelectTrigger>
                                <SelectContent>
                                    {initialDiagnosisOptions.map(opt => (
                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                    <SelectItem value="other">Other...</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {diagnosisSelection === 'other' && (
                            <div className="space-y-2">
                                <Label htmlFor="other-diagnosis">Please specify your condition</Label>
                                <Input id="other-diagnosis" name="other-diagnosis" placeholder="e.g., Chronic Kidney Disease" value={otherDiagnosis} onChange={handleOtherDiagnosisChange} />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Financial Information</CardTitle>
                        <CardDescription>This information is used for benefits suggestions. It is stored securely on your device.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="employmentStatus">Employment Status</Label>
                            <Select name="employmentStatus" onValueChange={(v) => handleSelectChange('employmentStatus', v)} value={userData.employmentStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="employed">Employed</SelectItem>
                                    <SelectItem value="self-employed">Self-employed</SelectItem>
                                    <SelectItem value="retired">Retired</SelectItem>
                                    <SelectItem value="unemployed-not-on-benefits">Unemployed not on benefits</SelectItem>
                                    <SelectItem value="unemployed-on-benefits">Unemployed on benefits</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(userData.employmentStatus === 'employed' || userData.employmentStatus === 'self-employed') && (
                            <div className="space-y-2">
                                <Label htmlFor="income">Annual Income (£)</Label>
                                <Input id="income" name="income" type="number" placeholder="e.g., 30000" value={userData.income || ''} onChange={handleInputChange} />
                            </div>
                        )}

                        {userData.employmentStatus === 'retired' && (
                            <div className="space-y-2">
                                <Label htmlFor="savings">Savings (£)</Label>
                                <Input id="savings" name="savings" type="number" placeholder="e.g., 5000" value={userData.savings || ''} onChange={handleInputChange} />
                            </div>
                        )}

                        <div className="space-y-4 pt-2">
                            <Label className="font-semibold">Benefits</Label>
                            <p className="text-xs text-muted-foreground">Select any benefits you are currently receiving.</p>
                            <div className="space-y-2 p-4 border rounded-md max-h-60 overflow-y-auto">
                                <div className="flex items-center space-x-2 pb-2 border-b">
                                    <IndeterminateCheckbox
                                        id="select-all-benefits"
                                        checked={allBenefitsSelected}
                                        indeterminate={someBenefitsSelected}
                                        onCheckedChange={(checked) => {
                                            const newSelected: Record<string, boolean> = {};
                                            if (checked) {
                                                benefitsList.forEach(b => newSelected[b.id] = true);
                                            }
                                            setSelectedBenefits(newSelected);
                                        }}
                                    />
                                    <Label htmlFor="select-all-benefits" className="font-bold">Select All</Label>
                                </div>
                                {benefitsList.map(benefit => (
                                    <div key={benefit.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={benefit.id}
                                            checked={selectedBenefits[benefit.id] || false}
                                            onCheckedChange={(checked) => handleBenefitChange(benefit.id, !!checked)}
                                        />
                                        <Label htmlFor={benefit.id}>{benefit.label}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSave}><Save className="mr-2" /> Save Changes</Button>
                    </CardFooter>
                </Card>
            </div>
            <ProfilePictureCameraDialog 
                open={isCameraDialogOpen} 
                onOpenChange={setIsCameraDialogOpen}
                onCapture={handleProfilePictureCapture}
            />
        </>
    )
}
