
"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Sun, Moon, Laptop, Bot, Save, Play, Loader2, User, Heart, Landmark, Edit } from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { textToSpeech } from "@/ai/flows/text-to-speech"
import { medicalAvatars, mentalHealthAvatars, financialAvatars } from "@/lib/avatars"
import { Textarea } from "@/components/ui/textarea"

type Specialist = "medical" | "mental_health" | "financial";

interface UserData {
  avatar_medical?: string;
  avatar_mental_health?: string;
  avatar_financial?: string;
  voice_medical?: string;
  voice_mental_health?: string;
  voice_financial?: string;
  responseMood?: string;
  customPersona?: string;
  [key: string]: any;
}

const voices = [
    { name: 'Enceladus', gender: 'Male' },
    { name: 'Achernar', gender: 'Male' },
    { name: 'Gacrux', gender: 'Male' },
    { name: 'Umbriel', gender: 'Male' },
    { name: 'Algenib', gender: 'Male' },
    { name: 'Leda', gender: 'Female' },
    { name: 'Aoede', gender: 'Female' },
    { name: 'Autonoe', gender: 'Female' },
    { name: 'Schedar', gender: 'Female' },
    { name: 'Callirrhoe', gender: 'Female' },
]

const specialistAvatarMap = {
    medical: medicalAvatars,
    mental_health: mentalHealthAvatars,
    financial: financialAvatars,
}


function SpecialistCard({ specialist, title, icon, userData, setUserData, avatars }: { specialist: Specialist, title: string, icon: React.ReactNode, userData: UserData, setUserData: React.Dispatch<React.SetStateAction<UserData>>, avatars: typeof medicalAvatars }) {
    const { toast } = useToast()
    const [isPlaying, setIsPlaying] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null);

    const avatarKey = `avatar_${specialist}` as keyof UserData;
    const voiceKey = `voice_${specialist}` as keyof UserData;

    const selectedAvatar = userData[avatarKey] || avatars[0].id;
    const selectedVoice = userData[voiceKey] || 'Algenib';

    const handleAvatarChange = (avatarId: string) => {
        setUserData(prev => ({ ...prev, [avatarKey]: avatarId }));
    };

    const handleVoiceChange = (voiceName: string) => {
        setUserData(prev => ({ ...prev, [voiceKey]: voiceName }));
    };

    const handlePlaySample = async () => {
        if (isPlaying) return;
        setIsPlaying(true);
        try {
            const result = await textToSpeech({
                text: `Hello, I am your ${title}. You can choose my voice here.`,
                voice: selectedVoice
            });
            if (result.audioDataUri && audioRef.current) {
                audioRef.current.src = result.audioDataUri;
                audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
            } else {
                 toast({ title: "Could not play sample", description: "The audio could not be generated.", variant: "destructive" });
                 setIsPlaying(false);
            }
        } catch (error) {
            console.error("Failed to play voice sample:", error);
            toast({ title: "Error", description: "Could not play voice sample.", variant: "destructive" });
            setIsPlaying(false);
        }
    }
    
     const filteredVoices = React.useMemo(() => {
        const selectedAvatarData = avatars.find(a => a.id === selectedAvatar);
        const isMale = selectedAvatarData?.label.startsWith('Male');
        return voices.filter(v => isMale ? v.gender === 'Male' : v.gender === 'Female');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAvatar, avatars]);
    
    useEffect(() => {
        if (!filteredVoices.some(v => v.name === selectedVoice)) {
            handleVoiceChange(filteredVoices[0]?.name || '');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredVoices]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">{icon} {title}</CardTitle>
                <CardDescription>Customize the avatar and voice for this specialist.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                 <div className="space-y-4">
                    <Label className="font-medium">Avatar</Label>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {avatars.map(avatar => (
                            <div
                                key={avatar.id}
                                className={cn(
                                "cursor-pointer rounded-lg p-2 transition-all duration-200 flex flex-col items-center gap-2 border-2",
                                selectedAvatar === avatar.id ? "border-primary bg-accent" : "border-transparent hover:bg-accent/50"
                                )}
                                onClick={() => handleAvatarChange(avatar.id)}
                            >
                                <Image 
                                    src={avatar.imageUrl}
                                    alt={avatar.label}
                                    width={200}
                                    height={200}
                                    className="rounded-full aspect-square object-cover"
                                    data-ai-hint={avatar.hint}
                                />
                                <Label className="text-sm text-center">{avatar.label}</Label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Voice</Label>
                    <div className="flex items-center gap-2">
                        <Select value={selectedVoice} onValueChange={handleVoiceChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a voice" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredVoices.map(v => (
                                    <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handlePlaySample} disabled={isPlaying} size="icon" variant="outline">
                            {isPlaying ? <Loader2 className="animate-spin" /> : <Play />}
                            <span className="sr-only">Play sample</span>
                        </Button>
                    </div>
                </div>
            </CardContent>
            <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
        </Card>
    )
}

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const { toast } = useToast()
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const [userData, setUserData] = useState<UserData>({});
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        const email = localStorage.getItem("currentUserEmail");
        if (email) {
            setCurrentUserEmail(email);
            const storedData = localStorage.getItem(`userData_${email}`);
            if (storedData) {
                setUserData(JSON.parse(storedData));
            }
        }
    }, [])

    const handleSave = () => {
        if (!currentUserEmail) return;

        localStorage.setItem(`userData_${currentUserEmail}`, JSON.stringify(userData));
        
        toast({
            title: "Settings Saved",
            description: "Your preferences have been updated.",
        });
    }
    
     const handleMoodChange = (mood: string) => {
        setUserData(prev => ({...prev, responseMood: mood}));
    }

    const handleCustomPersonaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setUserData(prev => ({...prev, customPersona: e.target.value}));
    }
    
    if (!isMounted) {
        return null
    }

    return (
        <div className="p-4 md:p-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Settings</h1>
                    <p className="text-muted-foreground">
                       Customize your application experience.
                    </p>
                </div>
                 <Button onClick={handleSave}><Save className="mr-2" /> Save Changes</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Adjust how the application looks.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Theme</Label>
                        <RadioGroup
                            value={theme}
                            onValueChange={setTheme}
                            className="grid max-w-md grid-cols-1 gap-4 sm:grid-cols-3"
                        >
                            <div>
                                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                                <Label
                                htmlFor="light"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                >
                                <Sun className="mb-3 h-6 w-6" />
                                Light
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                                <Label
                                htmlFor="dark"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                >
                                <Moon className="mb-3 h-6 w-6" />
                                Dark
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="system" id="system" className="peer sr-only" />
                                <Label
                                htmlFor="system"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                >
                                <Laptop className="mb-3 h-6 w-6" />
                                System
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Support Buddy Persona</CardTitle>
                    <CardDescription>Choose the response mood for your AI companion.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2 max-w-xs">
                        <Label>Response Mood</Label>
                        <Select value={userData.responseMood || 'standard'} onValueChange={handleMoodChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a mood" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="standard">Standard Personas</SelectItem>
                                <SelectItem value="extra_supportive">Extra Supportive</SelectItem>
                                <SelectItem value="direct_factual">Direct and Factual</SelectItem>
                                <SelectItem value="custom">Custom...</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     {userData.responseMood === 'custom' && (
                        <div className="space-y-2">
                            <Label htmlFor="custom-persona">Custom Persona Description</Label>
                             <Textarea
                                id="custom-persona"
                                placeholder="Describe the persona you want the AI to adopt. For example: 'A friendly, humorous pirate'."
                                value={userData.customPersona || ''}
                                onChange={handleCustomPersonaChange}
                                rows={3}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <div className="space-y-6">
                <SpecialistCard specialist="medical" title="Medical Expert" icon={<User />} userData={userData} setUserData={setUserData} avatars={specialistAvatarMap.medical} />
                <SpecialistCard specialist="mental_health" title="Mental Health Nurse" icon={<Heart />} userData={userData} setUserData={setUserData} avatars={specialistAvatarMap.mental_health} />
                <SpecialistCard specialist="financial" title="Financial Support Specialist" icon={<Landmark />} userData={userData} setUserData={setUserData} avatars={specialistAvatarMap.financial} />
            </div>

        </div>
    )
}

    