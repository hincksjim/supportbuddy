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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { AvatarFemale, AvatarMale } from "@/components/icons"

export default function OnboardingPage() {
  const router = useRouter()
  const [avatar, setAvatar] = useState("female")
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("currentUserEmail");
    if (email) {
      setCurrentUserEmail(email);
    } else {
      // If no user is logged in, redirect to login
      router.push("/login");
    }
  }, [router]);

  const handleContinue = () => {
    if (typeof window !== "undefined" && currentUserEmail) {
      const userDataKey = `userData_${currentUserEmail}`;
      const existingData = localStorage.getItem(userDataKey);
      const data = existingData ? JSON.parse(existingData) : {};
      data.avatar = avatar;
      localStorage.setItem(userDataKey, JSON.stringify(data));
    }
    router.push("/support-chat")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">Choose Your Buddy</CardTitle>
          <CardDescription>
            Select an avatar that feels most supportive to you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <Label className="text-lg font-medium">Avatar</Label>
            <div className="flex justify-around gap-4">
              <div
                className={cn(
                  "cursor-pointer rounded-full p-2 transition-all duration-200",
                  avatar === "female" ? "bg-accent ring-2 ring-primary" : "hover:bg-accent/50"
                )}
                onClick={() => setAvatar("female")}
              >
                <AvatarFemale className="h-24 w-24 text-foreground" />
              </div>
              <div
                className={cn(
                  "cursor-pointer rounded-full p-2 transition-all duration-200",
                  avatar === "male" ? "bg-accent ring-2 ring-primary" : "hover:bg-accent/50"
                )}
                onClick={() => setAvatar("male")}
              >
                <AvatarMale className="h-24 w-24 text-foreground" />
              </div>
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
