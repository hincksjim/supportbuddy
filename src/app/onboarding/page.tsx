
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

// Import images directly
import female20s from "../../../public/FemaleDoctor20s.png";
import female30s from "../../../public/FemaleDoctor30.png";
import female40s from "../../../public/FemaleDoctor40.png";
import female60s from "../../../public/FemaleDoctor60.png";
import male20s from "../../../public/MaleDoctor20.png";
import male30s from "../../../public/MaleDoctor30.png";
import male40s from "../../../public/MaleDoctor40.png";
import male60s from "../../../public/MaleDoctor60.png";


const avatars = [
    { id: 'female-20s', imageUrl: female20s, label: "Female, 20s" },
    { id: 'female-30s', imageUrl: female30s, label: "Female, 30s" },
    { id: 'female-40s', imageUrl: female40s, label: "Female, 40s" },
    { id: 'female-60s', imageUrl: female60s, label: "Female, 60s" },
    { id: 'male-20s', imageUrl: male20s, label: "Male, 20s" },
    { id: 'male-30s', imageUrl: male30s, label: "Male, 30s" },
    { id: 'male-40s', imageUrl: male40s, label: "Male, 40s" },
    { id: 'male-60s', imageUrl: male60s, label: "Male, 60s" },
]

type Specialist = "medical" | "mental_health" | "financial";

function AvatarSelector({ onSelect, selectedAvatar }: { onSelect: (id: string) => void, selectedAvatar: string }) {
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
                        unoptimized
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
      medical: "female-30s",
      mental_health: "male-40s",
      financial: "female-60s",
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
                    <AvatarSelector onSelect={(id) => handleSelect("medical", id)} selectedAvatar={selections.medical} />
                </TabsContent>
                <TabsContent value="mental_health" className="pt-6">
                     <AvatarSelector onSelect={(id) => handleSelect("mental_health", id)} selectedAvatar={selections.mental_health} />
                </TabsContent>
                <TabsContent value="financial" className="pt-6">
                     <AvatarSelector onSelect={(id) => handleSelect("financial", id)} selectedAvatar={selections.financial} />
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
