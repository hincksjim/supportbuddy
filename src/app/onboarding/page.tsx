
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Heart, Landmark } from "lucide-react"

const medicalAvatars = [
    { id: 'female-doctor-20s', imageUrl: 'https://placehold.co/200x200.png', label: "Female Surgical Consultant, 20s", hint: 'doctor woman 20s' },
    { id: 'male-doctor-20s', imageUrl: 'https://placehold.co/200x200.png', label: "Male Surgical Consultant, 20s", hint: 'doctor man 20s' },
    { id: 'female-doctor-30s', imageUrl: 'https://placehold.co/200x200.png', label: "Female Surgical Consultant, 30s", hint: 'doctor woman 30s' },
    { id: 'male-doctor-30s', imageUrl: 'https://placehold.co/200x200.png', label: "Male Surgical Consultant, 30s", hint: 'doctor man 30s' },
    { id: 'female-doctor-40s', imageUrl: 'https://placehold.co/200x200.png', label: "Female Surgical Consultant, 40s", hint: 'doctor woman 40s' },
    { id: 'male-doctor-40s', imageUrl: 'https://placehold.co/200x200.png', label: "Male Surgical Consultant, 40s", hint: 'doctor man 40s' },
    { id: 'female-doctor-50s', imageUrl: 'https://placehold.co/200x200.png', label: "Female Surgical Consultant, 50s", hint: 'doctor woman 50s' },
    { id: 'male-doctor-50s', imageUrl: 'https://placehold.co/200x200.png', label: "Male Surgical Consultant, 50s", hint: 'doctor man 50s' },
];

const mentalHealthAvatars = [
    { id: 'female-nurse-20s', imageUrl: 'https://placehold.co/200x200.png', label: "Female Nurse, 20s", hint: 'nurse woman 20s' },
    { id: 'male-nurse-20s', imageUrl: 'https://placehold.co/200x200.png', label: "Male Nurse, 20s", hint: 'nurse man 20s' },
    { id: 'female-therapist-30s', imageUrl: 'https://placehold.co/200x200.png', label: "Female Therapist, 30s", hint: 'therapist woman 30s' },
    { id: 'male-therapist-30s', imageUrl: 'https://placehold.co/200x200.png', label: "Male Therapist, 30s", hint: 'therapist man 30s' },
    { id: 'female-nurse-40s', imageUrl: 'https://placehold.co/200x200.png', label: "Female Nurse, 40s", hint: 'nurse woman 40s' },
    { id: 'male-nurse-40s', imageUrl: 'https://placehold.co/200x200.png', label: "Male Nurse, 40s", hint: 'nurse man 40s' },
    { id: 'female-therapist-50s', imageUrl: 'https://placehold.co/200x200.png', label: "Female Therapist, 50s", hint: 'therapist woman 50s' },
    { id: 'male-therapist-50s', imageUrl: 'https://placehold.co/200x200.png', label: "Male Therapist, 50s", hint: 'therapist man 50s' },
];

const financialAvatars = [
    { id: 'female-support-30s', imageUrl: 'https://placehold.co/200x200.png', label: "Female Support Specialist, 30s", hint: 'advisor woman 30s' },
    { id: 'male-support-30s', imageUrl: 'https://placehold.co/200x200.png', label: "Male Support Specialist, 30s", hint: 'advisor man 30s' },
    { id: 'female-support-40s', imageUrl: 'https://placehold.co/200x200.png', label: "Female Support Specialist, 40s", hint: 'advisor woman 40s' },
    { id: 'male-support-40s', imageUrl: 'https://placehold.co/200x200.png', label: "Male Support Specialist, 40s", hint: 'advisor man 40s' },
    { id: 'female-support-50s', imageUrl: 'https://placehold.co/200x200.png', label: "Female Support Specialist, 50s", hint: 'advisor woman 50s' },
    { id: 'male-support-50s', imageUrl: 'https://placehold.co/200x200.png', label: "Male Support Specialist, 50s", hint: 'advisor man 50s' },
    { id: 'female-support-60s', imageUrl: 'https://placehold.co/200x200.png', label: "Female Support Specialist, 60s", hint: 'advisor woman 60s' },
    { id: 'male-support-60s', imageUrl: 'https://placehold.co/200x200.png', label: "Male Support Specialist, 60s", hint: 'advisor man 60s' },
];


type Specialist = "medical" | "mental_health" | "financial";

function AvatarSelector({ onSelect, selectedAvatar, avatars }: { onSelect: (id: string) => void, selectedAvatar: string, avatars: typeof medicalAvatars }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {avatars.map(avatar => (
                <div
                    key={avatar.id}
                    className={cn(
                    "cursor-pointer rounded-lg p-2 transition-all duration-200 flex flex-col items-center gap-2 border-2",
                    selectedAvatar === avatar.id ? "border-primary bg-accent" : "border-transparent hover:bg-accent/50"
                    )}
                    onClick={() => onSelect(avatar.id)}
                >
                    <Image 
                        src={avatar.imageUrl}
                        alt={avatar.label}
                        width={100}
                        height={100}
                        className="rounded-full aspect-square object-cover"
                        data-ai-hint={avatar.hint}
                    />
                    <Label className="text-sm text-center">{avatar.label}</Label>
                </div>
            ))}
        </div>
    )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [selections, setSelections] = useState({
      medical: "female-doctor-40s",
      mental_health: "male-therapist-30s",
      financial: "female-support-50s",
  });
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("currentUserEmail");
    if (email) {
      setCurrentUserEmail(email);
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleSelect = (specialist: Specialist, avatarId: string) => {
      setSelections(prev => ({...prev, [specialist]: avatarId }));
  }

  const handleContinue = () => {
    if (typeof window !== "undefined" && currentUserEmail) {
      const userDataKey = `userData_${currentUserEmail}`;
      const existingData = localStorage.getItem(userDataKey);
      const data = existingData ? JSON.parse(existingData) : {};
      
      data.avatar_medical = selections.medical;
      data.avatar_mental_health = selections.mental_health;
      data.avatar_financial = selections.financial;

      // Set default voices
      data.voice_medical = "Algenib";
      data.voice_mental_health = "Enceladus";
      data.voice_financial = "Leda";

      localStorage.setItem(userDataKey, JSON.stringify(data));
    }
    router.push("/support-chat")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-3xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">Choose Your Support Team</CardTitle>
          <CardDescription>
            Select an avatar for each specialist on your team.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="medical" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="medical"><User className="mr-2"/>Medical Expert</TabsTrigger>
                    <TabsTrigger value="mental_health"><Heart className="mr-2"/>Mental Health</TabsTrigger>
                    <TabsTrigger value="financial"><Landmark className="mr-2"/>Financial Support</TabsTrigger>
                </TabsList>
                <TabsContent value="medical" className="pt-6">
                    <AvatarSelector onSelect={(id) => handleSelect("medical", id)} selectedAvatar={selections.medical} avatars={medicalAvatars} />
                </TabsContent>
                <TabsContent value="mental_health" className="pt-6">
                     <AvatarSelector onSelect={(id) => handleSelect("mental_health", id)} selectedAvatar={selections.mental_health} avatars={mentalHealthAvatars} />
                </TabsContent>
                <TabsContent value="financial" className="pt-6">
                     <AvatarSelector onSelect={(id) => handleSelect("financial", id)} selectedAvatar={selections.financial} avatars={financialAvatars} />
                </TabsContent>
            </Tabs>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleContinue}>
            Continue
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
