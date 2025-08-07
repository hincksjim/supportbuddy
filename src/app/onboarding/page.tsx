
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

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
import { 
    AvatarFemale, AvatarMale,
    AvatarFemale20s, AvatarFemale30s, AvatarFemale40s, AvatarFemale60s,
    AvatarMale20s, AvatarMale30s, AvatarMale40s, AvatarMale60s
} from "@/components/icons"

const avatars = [
    { id: 'female-20s', Component: AvatarFemale20s, label: "Female, 20s" },
    { id: 'female-30s', Component: AvatarFemale30s, label: "Female, 30s" },
    { id: 'female-40s', Component: AvatarFemale40s, label: "Female, 40s" },
    { id: 'female-60s', Component: AvatarFemale60s, label: "Female, 60s" },
    { id: 'male-20s', Component: AvatarMale20s, label: "Male, 20s" },
    { id: 'male-30s', Component: AvatarMale30s, label: "Male, 30s" },
    { id: 'male-40s', Component: AvatarMale40s, label: "Male, 40s" },
    { id: 'male-60s', Component: AvatarMale60s, label: "Male, 60s" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [selectedAvatar, setSelectedAvatar] = useState("female-30s")
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("currentUserEmail");
    if (email) {
      setCurrentUserEmail(email);
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleContinue = () => {
    if (typeof window !== "undefined" && currentUserEmail) {
      const userDataKey = `userData_${currentUserEmail}`;
      const existingData = localStorage.getItem(userDataKey);
      const data = existingData ? JSON.parse(existingData) : {};
      data.avatar = selectedAvatar;
      localStorage.setItem(userDataKey, JSON.stringify(data));
    }
    router.push("/support-chat")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">Choose Your Buddy</CardTitle>
          <CardDescription>
            Select an avatar that feels most supportive to you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {avatars.map(avatar => (
                <div
                    key={avatar.id}
                    className={cn(
                    "cursor-pointer rounded-lg p-2 transition-all duration-200 flex flex-col items-center gap-2",
                    selectedAvatar === avatar.id ? "bg-accent ring-2 ring-primary" : "hover:bg-accent/50"
                    )}
                    onClick={() => setSelectedAvatar(avatar.id)}
                >
                    <avatar.Component className="h-24 w-24 text-foreground" />
                    <Label className="text-sm">{avatar.label}</Label>
                </div>
              ))}
            </div>
          </div>
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
