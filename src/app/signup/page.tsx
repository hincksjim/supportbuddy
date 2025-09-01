
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import Image from "next/image"


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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/icons"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { IndeterminateCheckbox } from "@/components/ui/indeterminate-checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, FileUp, Loader2, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"


const benefits = [
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

function ProfilePictureCameraDialog({ onCapture, open, onOpenChange }: { onCapture: (dataUri: string) => void; open: boolean; onOpenChange: (open: boolean) => void; }) {
    const { toast } = useToast();
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = React.useState(true);
    const [isCapturing, setIsCapturing] = React.useState(false);

    React.useEffect(() => {
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

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [employmentStatus, setEmploymentStatus] = React.useState<string>("")
  const [selectedBenefits, setSelectedBenefits] = React.useState<Record<string, boolean>>({})
  const [initialDiagnosis, setInitialDiagnosis] = React.useState('');
  const [profilePicture, setProfilePicture] = React.useState<string | null>(null);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = React.useState(false);


  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    
    const userData = {
        name: formData.get('first-name') as string || "User",
        lastName: formData.get('last-name') as string,
        age: formData.get('age') as string,
        gender: formData.get('gender') as string,
        address1: formData.get('address1') as string,
        address2: formData.get('address2') as string,
        townCity: formData.get('townCity') as string,
        countyState: formData.get('countyState') as string,
        country: formData.get('country') as string,
        postcode: formData.get('postcode') as string,
        dob: formData.get('dob') as string,
        employmentStatus: employmentStatus,
        income: formData.get('income') as string,
        savings: formData.get('savings') as string,
        benefits: Object.entries(selectedBenefits)
            .filter(([, checked]) => checked)
            .map(([id]) => benefits.find(b => b.id === id)?.label),
        initialDiagnosis: initialDiagnosis === 'other' 
            ? formData.get('other-diagnosis') as string 
            : initialDiagnosis,
        profilePicture: profilePicture || '',
    };
    
    if (typeof window !== "undefined" && email) {
        localStorage.setItem("currentUserEmail", email);
        localStorage.setItem(`userData_${email}`, JSON.stringify(userData));
    }

    router.push("/onboarding")
  }

  const handleBenefitChange = (benefitId: string, checked: boolean) => {
    setSelectedBenefits(prev => ({ ...prev, [benefitId]: checked }))
  }

  const handleProfilePictureFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              setProfilePicture(reader.result as string);
          }
          reader.readAsDataURL(file);
      }
  }

  const allBenefitsSelected = Object.keys(selectedBenefits).length > 0 && Object.values(selectedBenefits).every(Boolean) && Object.keys(selectedBenefits).length === benefits.length;
  const someBenefitsSelected = Object.values(selectedBenefits).some(Boolean) && !allBenefitsSelected;


  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <form onSubmit={handleSignup}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <Logo className="h-16 w-16 text-primary" />
              </div>
              <CardTitle className="font-headline text-3xl">Create an Account</CardTitle>
              <CardDescription>
                Join Support Buddy to get personalized health support.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
              <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center gap-4">
                      <Avatar className="w-40 h-40 border-2 border-primary/20">
                          <AvatarImage src={profilePicture ?? undefined} alt="Profile Picture Preview" />
                          <AvatarFallback className="bg-muted">
                              <User className="w-20 h-20 text-muted-foreground" />
                          </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-2">
                          <Button type="button" onClick={() => document.getElementById('picture-upload')?.click()}>
                              <FileUp className="mr-2"/> Upload
                          </Button>
                          <Input id="picture-upload" type="file" accept="image/*" className="hidden" onChange={handleProfilePictureFile}/>
                          <Button type="button" variant="outline" onClick={() => setIsCameraDialogOpen(true)}>
                              <Camera className="mr-2"/> Use Camera
                          </Button>
                      </div>
                  </div>
              </div>

               <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="alex.smith@example.com" required />
              </div>
               <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First name</Label>
                    <Input id="first-name" name="first-name" placeholder="Alex" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last name</Label>
                    <Input id="last-name" name="last-name" placeholder="Smith" required />
                  </div>
              </div>
               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input id="age" name="age" type="number" placeholder="Your age" required />
                  </div>
                   <div className="space-y-2">
                      <Label>Gender</Label>
                      <RadioGroup name="gender" defaultValue="female" className="flex gap-4 pt-2">
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
                  <Input id="address1" name="address1" placeholder="e.g., 10 Downing Street" required />
              </div>
               <div className="space-y-2">
                  <Label htmlFor="address2">Address Line 2 (optional)</Label>
                  <Input id="address2" name="address2" />
              </div>
               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                   <div className="space-y-2">
                      <Label htmlFor="townCity">Town/City</Label>
                      <Input id="townCity" name="townCity" placeholder="e.g., London" required />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="countyState">County/State</Label>
                      <Input id="countyState" name="countyState" placeholder="e.g., Greater London" required />
                  </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" name="country" placeholder="e.g., United Kingdom" required />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input id="postcode" name="postcode" placeholder="Your postcode" required />
                  </div>
              </div>
               <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" name="dob" type="date" required />
              </div>
               <div className="space-y-2">
                  <Label htmlFor="initial-diagnosis">Primary Health Condition</Label>
                  <Select onValueChange={setInitialDiagnosis} value={initialDiagnosis}>
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

              {initialDiagnosis === 'other' && (
                  <div className="space-y-2">
                      <Label htmlFor="other-diagnosis">Please specify your condition</Label>
                      <Input id="other-diagnosis" name="other-diagnosis" placeholder="e.g., Chronic Kidney Disease" required />
                  </div>
              )}
              <div className="space-y-2">
                  <Label htmlFor="employment-status">Employment Status</Label>
                   <Select name="employment-status" onValueChange={setEmploymentStatus} value={employmentStatus}>
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

              {(employmentStatus === 'employed' || employmentStatus === 'self-employed') && (
                  <div className="space-y-2">
                      <Label htmlFor="income">Annual Income (£)</Label>
                      <Input id="income" name="income" type="number" placeholder="e.g., 30000" />
                  </div>
              )}

               {employmentStatus === 'retired' && (
                  <div className="space-y-2">
                      <Label htmlFor="savings">Savings (£)</Label>
                      <Input id="savings" name="savings" type="number" placeholder="e.g., 5000" />
                  </div>
              )}

              <div className="space-y-4 pt-2">
                      <Label className="font-semibold">Benefits</Label>
                      <p className="text-xs text-muted-foreground">Select any benefits you are currently receiving or believe you may be entitled to.</p>
                      <div className="space-y-2 p-4 border rounded-md max-h-60 overflow-y-auto">
                      <div className="flex items-center space-x-2 pb-2 border-b">
                          <IndeterminateCheckbox
                              id="select-all-benefits"
                              checked={allBenefitsSelected}
                              indeterminate={someBenefitsSelected}
                              onCheckedChange={(checked) => {
                                  const newSelected: Record<string, boolean> = {};
                                  if (checked) {
                                      benefits.forEach(b => newSelected[b.id] = true);
                                  }
                                  setSelectedBenefits(newSelected);
                              }}
                          />
                          <Label htmlFor="select-all-benefits" className="font-bold">Select All</Label>
                      </div>
                      {benefits.map(benefit => (
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
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full">Create Account</Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                  Login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
      <ProfilePictureCameraDialog
        open={isCameraDialogOpen}
        onOpenChange={setIsCameraDialogOpen}
        onCapture={setProfilePicture}
      />
    </>
  )
}
    
