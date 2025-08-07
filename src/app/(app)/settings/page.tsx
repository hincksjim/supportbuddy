
"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Sun, Moon, Laptop, Bot, Save, Play, Loader2 } from "lucide-react"
import { useTheme } from "next-themes"

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
import { 
    AvatarFemale, AvatarMale,
    AvatarFemale20s, AvatarFemale30s, AvatarFemale40s, AvatarFemale60s,
    AvatarMale20s, AvatarMale30s, AvatarMale40s, AvatarMale60s
} from "@/components/icons"
import { useToast } from "@/hooks/use-toast"
import { textToSpeech } from "@/ai/flows/text-to-speech"

interface UserData {
  avatar?: string;
  responseMood?: string;
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

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const { toast } = useToast()
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const [userData, setUserData] = useState<UserData>({});
    const [selectedVoice, setSelectedVoice] = useState('Algenib');
    const [isMounted, setIsMounted] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [audioDataUri, setAudioDataUri] = useState<string | null>(null)
    const audioRef = useRef<HTMLAudioElement>(null);


    useEffect(() => {
        setIsMounted(true)
        const email = localStorage.getItem("currentUserEmail");
        if (email) {
            setCurrentUserEmail(email);
            const storedData = localStorage.getItem(`userData_${email}`);
            if (storedData) {
                setUserData(JSON.parse(storedData));
            }
            const voiceSetting = localStorage.getItem('ttsVoice');
            if (voiceSetting) {
                setSelectedVoice(voiceSetting);
            }
        }
    }, [])
    
    useEffect(() => {
        if (audioRef.current && audioDataUri) {
          audioRef.current.src = audioDataUri;
          audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
        }
    }, [audioDataUri]);

    const handleSave = () => {
        if (!currentUserEmail) return;

        localStorage.setItem(`userData_${currentUserEmail}`, JSON.stringify(userData));
        localStorage.setItem('ttsVoice', selectedVoice);
        
        toast({
            title: "Settings Saved",
            description: "Your preferences have been updated.",
        });
    }

    const handlePlaySample = async () => {
        if (isPlaying) return;
        setIsPlaying(true);
        try {
            const result = await textToSpeech({
                text: "Hello, I am your support buddy. You can choose my voice here.",
                voice: selectedVoice
            });
            if (result.audioDataUri) {
                setAudioDataUri(result.audioDataUri);
            } else {
                 toast({ title: "Could not play sample", description: "The audio could not be generated.", variant: "destructive" });
            }
        } catch (error) {
            console.error("Failed to play voice sample:", error);
            toast({ title: "Error", description: "Could not play voice sample.", variant: "destructive" });
        }
    }
    
    const filteredVoices = React.useMemo(() => {
        const selectedAvatarId = userData.avatar || 'female-30s';
        const isMale = selectedAvatarId.startsWith('male');
        return voices.filter(v => isMale ? v.gender === 'Male' : v.gender === 'Female');
    }, [userData.avatar]);

    useEffect(() => {
        // If the selected voice is not in the filtered list, update it to the first available voice
        if (!filteredVoices.some(v => v.name === selectedVoice)) {
            setSelectedVoice(filteredVoices[0]?.name || '');
        }
    }, [filteredVoices, selectedVoice]);
    
    const handleAvatarChange = (avatarId: string) => {
        setUserData(prev => ({...prev, avatar: avatarId}));
    }
    
    const handleMoodChange = (mood: string) => {
        setUserData(prev => ({...prev, responseMood: mood}));
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
                    <CardDescription>Choose the avatar and voice for your AI companion.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-4">
                        <Label className="font-medium">Avatar</Label>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {avatars.map(avatar => (
                                <div
                                    key={avatar.id}
                                    className={cn(
                                    "cursor-pointer rounded-lg p-2 transition-all duration-200 flex flex-col items-center gap-2",
                                    userData.avatar === avatar.id ? "bg-accent ring-2 ring-primary" : "hover:bg-accent/50"
                                    )}
                                    onClick={() => handleAvatarChange(avatar.id)}
                                >
                                    <avatar.Component className="h-24 w-24 text-foreground" />
                                    <Label className="text-sm">{avatar.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Voice</Label>
                            <div className="flex items-center gap-2">
                                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
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
                        <div className="space-y-2">
                            <Label>Response Mood</Label>
                            <Select value={userData.responseMood || 'standard'} onValueChange={handleMoodChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a mood" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="standard">Standard</SelectItem>
                                    <SelectItem value="extra_supportive">Extra Supportive</SelectItem>
                                    <SelectItem value="direct_factual">Direct and Factual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
        </div>
    )
}
