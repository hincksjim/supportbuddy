
"use client"

import { useState, useRef, useEffect, Suspense, useCallback } from "react"
import { CornerDownLeft, Loader2, User, Heart, Landmark, LogOut, Mic, MicOff, Save, Home, Volume2, VolumeX, PlusCircle, Download, Bookmark, ChevronDown, Settings } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea, ScrollViewport } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { aiConversationalSupport, AiConversationalSupportInput } from "@/ai/flows/conversational-support"
import { generateConversationSummary } from "@/ai/flows/generate-conversation-summary"
import { textToSpeech } from "@/ai/flows/text-to-speech"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { GenerateTreatmentTimelineOutput } from "@/app/(app)/timeline/page"
import type { DiaryEntry } from "@/app/(app)/diary/page"
import type { Medication } from "@/app/(app)/medication/page"
import type { AnalysisResult } from "@/app/(app)/document-analysis/page"


type Specialist = "medical" | "mental_health" | "financial";

interface Message {
  role: "user" | "assistant"
  content: string;
  metadata?: {
      specialist: Specialist;
  }
}

interface SavedMessageActivity {
  id: string;
  type: 'savedMessage'; // To distinguish from other activity types
  title: string;
  content: string;
  date: string;
}

interface ConversationSummary {
  id: string;
  title: string;
  summary: string;
  date: string;
  specialist?: Specialist;
}

interface StoredConversation {
    id: string;
    messages: Message[];
}

interface UserData {
  name?: string;
  lastName?: string;
  age?: string;
  gender?: string;
  address1?: string;
  address2?: string;
  townCity?: string;
  countyState?: string;
  country?: string;
  postcode?: string;
  avatar_medical?: string;
  avatar_mental_health?: string;
  avatar_financial?: string;
  voice_medical?: string;
  voice_mental_health?: string;
  voice_financial?: string;
  dob?: string;
  employmentStatus?: string;
  income?: string;
  savings?: string;
  benefits?: string[];
  responseMood?: string;
  initialDiagnosis?: string;
  profilePicture?: string;
}

const specialistConfig = {
    medical: { name: "Medical Expert", icon: User },
    mental_health: { name: "Mental Health Nurse", icon: Heart },
    financial: { name: "Financial Support Specialist", icon: Landmark },
}

const avatars: { [key: string]: string } = {
    'female-20s': '/FemaleDoctor30.png',
    'female-30s': '/FemaleDoctor30.png',
    'female-40s': '/FemaleDoctor40.png',
    'female-60s': '/FemaleDoctor60.png',
    'male-20s': '/MaleDoctor20.png',
    'male-30s': '/MaleDoctor30.png',
    'male-40s': '/MaleDoctor40.png',
    'male-60s': '/MaleDoctor60.png',
};

// Define a type for all the contextual data we will load
interface AppContextData {
    timelineData: GenerateTreatmentTimelineOutput | null;
    diaryData: DiaryEntry[];
    medicationData: Medication[];
    sourceDocuments: AnalysisResult[];
}

function SupportChatPageContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData>({});
  const [appContextData, setAppContextData] = useState<AppContextData>({
      timelineData: null,
      diaryData: [],
      medicationData: [],
      sourceDocuments: [],
  });
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null)
  const [isHistoricChat, setIsHistoricChat] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [activeSpecialist, setActiveSpecialist] = useState<Specialist>("medical");
  
  const router = useRouter()
  const searchParams = useSearchParams();
  const { toast } = useToast()
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const loadAppContext = useCallback(() => {
    if (!currentUserEmail) return;
    try {
        const storedTimeline = localStorage.getItem(`treatmentTimeline_${currentUserEmail}`);
        const storedDiary = localStorage.getItem(`diaryEntries_${currentUserEmail}`);
        const storedMeds = localStorage.getItem(`medications_${currentUserEmail}`);
        const storedDocs = localStorage.getItem(`analysisResults_${currentUserEmail}`);
        const storedUserData = localStorage.getItem(`userData_${currentUserEmail}`);

        if (storedUserData) {
          setUserData(JSON.parse(storedUserData));
        }

        setAppContextData({
            timelineData: storedTimeline ? JSON.parse(storedTimeline) : null,
            diaryData: storedDiary ? JSON.parse(storedDiary) : [],
            medicationData: storedMeds ? JSON.parse(storedMeds) : [],
            sourceDocuments: storedDocs ? JSON.parse(storedDocs) : [],
        });
    } catch (e) {
        console.error("Failed to load app context data:", e);
        toast({ title: "Error Loading Data", description: "Could not load all your saved context.", variant: "destructive" });
    }
  }, [currentUserEmail, toast]);
  
  const speakMessage = async (text: string, specialist: Specialist) => {
    if (!isTtsEnabled) return;
    try {
      const voiceKey = `voice_${specialist}` as keyof UserData;
      const voice = userData[voiceKey] || 'Algenib';
      const result = await textToSpeech({ text, voice });
      if (result.audioDataUri) {
        setAudioDataUri(result.audioDataUri);
      }
    } catch (error) {
      console.error("Failed to generate audio for message:", error);
    }
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    const finalInput = input.trim();
    if (!finalInput || isLoading || isHistoricChat || !currentUserEmail) return

    setIsLoading(true)
    const userMessage: Message = { role: "user", content: finalInput }
    const newMessages = [...messages, userMessage];
    setMessages(newMessages)
    setInput("")

    try {
      const flowInput: AiConversationalSupportInput = { 
        specialist: activeSpecialist,
        userName: userData.name || "User", 
        initialDiagnosis: userData.initialDiagnosis || 'Not specified',
        age: userData.age || "",
        gender: userData.gender || "",
        address1: userData.address1 || "",
        address2: userData.address2 || "",
        townCity: userData.townCity || "",
        countyState: userData.countyState || "",
        country: userData.country || "",
        postcode: userData.postcode || "",
        dob: userData.dob || "",
        employmentStatus: userData.employmentStatus || "",
        existingBenefits: userData.benefits || [],
        responseMood: userData.responseMood || 'standard',
        conversationHistory: messages,
        question: finalInput,
        
        timelineData: appContextData.timelineData,
        diaryData: appContextData.diaryData,
        medicationData: appContextData.medicationData,
        sourceDocuments: appContextData.sourceDocuments.map(d => ({
            id: d.id,
            title: d.title,
            date: d.date,
            analysis: d.analysis,
        })),
      };

      if (userData.income) flowInput.income = userData.income;
      if (userData.savings) flowInput.savings = userData.savings;

      const result = await aiConversationalSupport(flowInput)
      const assistantMessage: Message = { 
          role: "assistant", 
          content: result.answer,
          metadata: { specialist: activeSpecialist } 
      }
      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages)
      await speakMessage(result.answer, activeSpecialist)
    } catch (error) {
      console.error("Error from AI support flow: ", error)
      const errorMessageText = "I'm sorry, I encountered an error. Please try again. If the problem persists, please check the server logs."
      const errorMessage: Message = {
        role: "assistant",
        content: errorMessageText,
        metadata: { specialist: activeSpecialist }
      }
      setMessages((prev) => [...prev, errorMessage])
      await speakMessage(errorMessageText, activeSpecialist)
    } finally {
      setIsLoading(false)
    }
  }

  // New function to just archive the chat without AI summary
  const archiveChatLocally = (messagesToSave: Message[], specialistOfChat: Specialist) => {
    if (!currentUserEmail || messagesToSave.length <= 1) return;

    const conversationIdToSave = new Date().toISOString();
    
    // Save to all conversations (raw transcript)
    const allConversationsKey = `allConversations_${currentUserEmail}`;
    const storedConversations = localStorage.getItem(allConversationsKey) || '[]';
    const allConversations: StoredConversation[] = JSON.parse(storedConversations);
    allConversations.push({ id: conversationIdToSave, messages: messagesToSave });
    localStorage.setItem(allConversationsKey, JSON.stringify(allConversations));

    // Save a placeholder summary to the activity feed
    const summariesKey = `conversationSummaries_${currentUserEmail}`;
    const storedSummaries = localStorage.getItem(summariesKey) || '[]';
    const summaries: ConversationSummary[] = JSON.parse(storedSummaries);

    const newSummary: ConversationSummary = {
        id: conversationIdToSave,
        date: new Date().toISOString(),
        specialist: specialistOfChat,
        title: `Chat with ${specialistConfig[specialistOfChat].name}`,
        summary: `A conversation about ${messagesToSave.length > 1 ? `"${messagesToSave[1].content.substring(0, 50)}..."` : 'various topics.'}`,
    };
    summaries.unshift(newSummary);
    localStorage.setItem(summariesKey, JSON.stringify(summaries));
  }


  const handleSaveSummary = async (messagesToSave: Message[]) => {
    if (!currentUserEmail || messagesToSave.length < 2) {
        toast({
            title: "Not enough conversation",
            description: "Have a bit more of a chat before saving a summary.",
        });
        return;
    }

    setIsSaving(true);
    try {
      const conversationIdToSave = new Date().toISOString();
      const result = await generateConversationSummary({ conversationHistory: messagesToSave });
      
      const lastAssistantMsg = [...messagesToSave].reverse().find(m => m.role === 'assistant');
      const specialist = lastAssistantMsg?.metadata?.specialist || activeSpecialist;
      
      const summariesKey = `conversationSummaries_${currentUserEmail}`;
      const storedSummaries = localStorage.getItem(summariesKey);
      const summaries: ConversationSummary[] = storedSummaries ? JSON.parse(storedSummaries) : [];
      
      const newSummary: ConversationSummary = {
        id: conversationIdToSave,
        date: new Date().toISOString(),
        specialist: specialist,
        ...result,
      };

      summaries.unshift(newSummary);
      localStorage.setItem(summariesKey, JSON.stringify(summaries));

      const allConversationsKey = `allConversations_${currentUserEmail}`;
      const storedConversations = localStorage.getItem(allConversationsKey);
      const allConversations: StoredConversation[] = storedConversations ? JSON.parse(storedConversations) : [];
      
      const newConversation: StoredConversation = {
        id: conversationIdToSave,
        messages: messagesToSave
      };

      allConversations.push(newConversation);
      localStorage.setItem(allConversationsKey, JSON.stringify(allConversations));

      toast({
          title: "Conversation Saved",
          description: "Your summary has been saved to your activity feed.",
      });

    } catch (error) {
      console.error("Failed to generate or save summary:", error);
       toast({
        title: "Error Saving Summary",
        description: "There was a problem saving your conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };


  const handleTranscript = (text: string) => {
    setInput(text);
  };
  
  const handleComplete = () => {
    // We submit the form directly in stopListening's onend callback
  };

  const {
    isListening,
    startListening,
    stopListening,
    isSupported,
  } = useSpeechRecognition({
    onTranscript: handleTranscript,
    onComplete: handleComplete,
  });

  const toggleListening = () => {
    if (isListening) {
        stopListening();
        setTimeout(() => {
          const form = document.getElementById("chat-form") as HTMLFormElement;
          form?.requestSubmit();
        }, 100);
    } else {
        setInput("");
        startListening();
    }
  }

  useEffect(() => {
    const email = localStorage.getItem("currentUserEmail");
    if (email) {
      setCurrentUserEmail(email);
    } else {
      router.push("/login");
    }
  }, [router]);
  
  const getAvatarForSpecialist = (specialist: Specialist) => {
      const avatarKey = `avatar_${specialist}` as keyof UserData;
      const avatarId = userData[avatarKey] || 'female-30s';
      return avatars[avatarId] || avatars['female-30s'];
  }

  const getWelcomeMessage = (specialist: Specialist) => {
      const userName = userData.name || 'there';
      switch(specialist) {
          case 'medical':
              return `Hello ${userName}! I'm your Medical Expert. How can I help you today with your health or treatment?`;
          case 'mental_health':
              return `Hi ${userName}, I'm your Mental Health Nurse. It's a safe space to talk about how you're feeling. What's on your mind?`;
          case 'financial':
              return `Hello ${userName}, I'm your Financial Support Specialist. Let's talk about any money worries or questions you might have.`;
          default:
              return `Hello ${userName}! How can I help you today?`;
      }
  }

  const startNewChat = (specialist: Specialist) => {
    const welcomeMessageText = getWelcomeMessage(specialist);
    const initialMessage: Message = { 
        role: "assistant", 
        content: welcomeMessageText, 
        metadata: { specialist } 
    };
    setMessages([initialMessage]);
    speakMessage(welcomeMessageText, specialist);
    setCurrentConversationId(null);
  }

  const handleSpecialistChange = (newSpecialist: Specialist) => {
    if (newSpecialist === activeSpecialist || isHistoricChat) {
        return;
    }

    // Archive the current chat before switching
    if (messages.length > 1) {
        archiveChatLocally(messages, activeSpecialist);
    }
    
    // Start a new chat with the new specialist
    setActiveSpecialist(newSpecialist);
    startNewChat(newSpecialist);
  };

  useEffect(() => {
    if (!currentUserEmail) return;
    
    loadAppContext();

    const ttsSetting = localStorage.getItem('ttsEnabled');
    setIsTtsEnabled(ttsSetting !== 'false');

    const conversationId = searchParams.get("id");

    if (conversationId) {
        setIsHistoricChat(true);
        setCurrentConversationId(conversationId);
        const allConversationsStr = localStorage.getItem(`allConversations_${currentUserEmail}`);
        if (allConversationsStr) {
            try {
                const allConversations: StoredConversation[] = JSON.parse(allConversationsStr);
                const conversation = allConversations.find(c => c.id === conversationId);
                if (conversation) {
                    setMessages(conversation.messages);
                    // Set the active specialist based on the last assistant message
                    const lastAssistantMsg = [...conversation.messages].reverse().find(m => m.role === 'assistant');
                    if(lastAssistantMsg && lastAssistantMsg.metadata?.specialist) {
                        setActiveSpecialist(lastAssistantMsg.metadata.specialist);
                    }
                } else {
                     setMessages([{ role: 'assistant', content: 'Could not find the requested conversation.' }]);
                }
            } catch (e) {
                console.error("Failed to parse all conversations", e);
                setMessages([{ role: 'assistant', content: 'There was an error loading the conversation history.' }]);
            }
        } else {
             setMessages([{ role: 'assistant', content: 'No past conversations found.' }]);
        }

    } else {
        setIsHistoricChat(false);
        const storedHistory = localStorage.getItem(`conversationHistory_${currentUserEmail}`)
        if (storedHistory) {
          try {
            const parsedHistory = JSON.parse(storedHistory);
            if(Array.isArray(parsedHistory) && parsedHistory.length > 0) {
              setMessages(parsedHistory);
            } else {
                 throw new Error("History is not valid");
            }
          } catch (e) {
            console.error("Failed to parse conversation history", e)
            localStorage.removeItem(`conversationHistory_${currentUserEmail}`);
            startNewChat('medical');
          }
        } else {
          startNewChat('medical');
        }
    }
    
    return () => {
        if (currentUserEmail && !isHistoricChat && messagesRef.current.length > 1) {
             localStorage.setItem(`conversationHistory_${currentUserEmail}`, JSON.stringify(messagesRef.current));
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserEmail, searchParams, userData.name]); // Removed loadAppContext from here to avoid re-triggering

  useEffect(() => {
    if (audioRef.current && audioDataUri) {
      audioRef.current.src = audioDataUri;
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [audioDataUri]);

  useEffect(() => {
    if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleAudioEnded = () => {
    setAudioDataUri(null);
  };
  
  const handleNewChat = () => {
    if (currentUserEmail) {
        if (messages.length > 1) {
             if (!isHistoricChat) {
                archiveChatLocally(messages, activeSpecialist);
             }
        }
        localStorage.removeItem(`conversationHistory_${currentUserEmail}`);
    }
    router.push("/support-chat");
    window.location.reload();
  }

  const getPlaceholderText = () => {
    if (isHistoricChat) return "This is a past conversation. You cannot send new messages.";
    if (isListening) return "Listening... Press the mic again to stop.";
    return `Ask the ${specialistConfig[activeSpecialist].name}...`;
  }

  const toggleTts = () => {
      const newTtsState = !isTtsEnabled;
      setIsTtsEnabled(newTtsState);
      localStorage.setItem('ttsEnabled', String(newTtsState));
      toast({
          title: `Text-to-Speech ${newTtsState ? 'Enabled' : 'Disabled'}`,
      });
      if (!newTtsState && audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
          setAudioDataUri(null);
      }
  }

  const handleDownloadMessage = (content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chat-response.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveMessage = (message: Message, index: number) => {
    if (!currentUserEmail) return;

    const userPrompt = messages[index - 1];
    let contentToSave = message.content;

    if (userPrompt && userPrompt.role === 'user') {
      contentToSave = `You asked:\n"${userPrompt.content}"\n\nSupport Buddy replied:\n${message.content}`;
    }

    const savedMessage: SavedMessageActivity = {
        id: new Date().toISOString(),
        type: 'savedMessage',
        title: "Saved Chat Snippet",
        content: contentToSave,
        date: new Date().toISOString()
    };
    
    const key = `conversationSummaries_${currentUserEmail}`;
    const stored = localStorage.getItem(key);
    const items = stored ? JSON.parse(stored) : [];
    items.unshift(savedMessage);
    localStorage.setItem(key, JSON.stringify(items));
    
    toast({
        title: "Message Saved",
        description: "You can view it in your 'Activity' page.",
    });
  };

  return (
    <div className="relative flex h-full max-h-screen flex-col">
       <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            {isHistoricChat ? (
                <Button variant="outline" size="sm" onClick={handleNewChat}>
                    <Home className="mr-2 h-4 w-4" />
                    Current Chat
                </Button>
            ) : (
                 <Button variant="outline" size="sm" onClick={handleNewChat}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Chat
                </Button>
            )}
             <Button asChild variant="outline" size="sm">
                <Link href="/settings">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Settings</span>
                </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSaveSummary(messages)} disabled={isSaving || isHistoricChat || messages.length < 2}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
            </Button>
          </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
            <ScrollViewport ref={viewportRef}>
              <div className="p-4 md:p-6 space-y-6">
                {messages.map((message, index) => {
                   const specialist = message.metadata?.specialist || 'medical';
                   const buddyAvatarUrl = getAvatarForSpecialist(specialist);
                  return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start gap-4 group",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                        <div className="flex items-end gap-2">
                             <Avatar className="w-10 h-10 border bg-accent/50">
                                <AvatarImage src={buddyAvatarUrl} alt={`${specialist} avatar`} />
                                <AvatarFallback className="bg-transparent text-foreground">
                                    <User />
                                </AvatarFallback>
                              </Avatar>
                            <div
                            className="max-w-xl rounded-xl p-3 shadow-md bg-card"
                            >
                                <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                             <div className="flex-col gap-1 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownloadMessage(message.content)}>
                                    <Download className="w-4 h-4"/>
                                </Button>
                                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSaveMessage(message, index)}>
                                    <Bookmark className="w-4 h-4"/>
                                </Button>
                            </div>
                        </div>
                    )}
                     {message.role === "user" && (
                        <>
                            <div
                            className={cn(
                                "max-w-xl rounded-xl p-3 shadow-md",
                                "bg-primary text-primary-foreground"
                            )}
                            >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                            <Avatar className="w-10 h-10 border">
                                {userData.profilePicture ? (
                                    <AvatarImage src={userData.profilePicture} alt="Your profile picture" />
                                ) : null}
                                <AvatarFallback className="bg-secondary text-secondary-foreground">
                                    <User className="w-6 h-6" />
                                </AvatarFallback>
                            </Avatar>
                        </>
                    )}
                  </div>
                  )})}
                {isLoading && (
                  <div className="flex items-start gap-4 justify-start">
                    <Avatar className="w-10 h-10 border bg-accent/50">
                       <AvatarImage src={getAvatarForSpecialist(activeSpecialist)} alt={`${activeSpecialist} avatar`} />
                       <AvatarFallback className="bg-transparent text-foreground">
                            <User />
                        </AvatarFallback>
                    </Avatar>
                    <div className="max-w-xl rounded-xl p-3 shadow-md bg-card flex items-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollViewport>
        </ScrollArea>
      </div>

      <div className="border-t bg-background p-4 md:p-6">
        <div className="container mx-auto max-w-lg">
             <Tabs value={activeSpecialist} onValueChange={(v) => handleSpecialistChange(v as Specialist)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="medical" disabled={isHistoricChat} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><User className="mr-2"/>Medical</TabsTrigger>
                    <TabsTrigger value="mental_health" disabled={isHistoricChat} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Heart className="mr-2"/>Mental</TabsTrigger>
                    <TabsTrigger value="financial" disabled={isHistoricChat} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Landmark className="mr-2"/>Financial</TabsTrigger>
                </TabsList>
            </Tabs>
            <form
            id="chat-form"
            onSubmit={handleSubmit}
            className="relative mt-4"
            >
            <Textarea
                name="input-textarea"
                placeholder={getPlaceholderText()}
                className="pr-20 resize-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                }
                }}
                disabled={isLoading || isHistoricChat}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {isSupported && (
                    <Button
                        type="button"
                        size="icon"
                        variant={isListening ? "destructive" : "ghost"}
                        onClick={toggleListening}
                        disabled={isHistoricChat}
                    >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                )}
                <Button
                    id="chat-submit-button"
                    type="submit"
                    size="icon"
                    disabled={isLoading || !input.trim() || isHistoricChat}
                >
                    <CornerDownLeft className="h-4 w-4" />
                </Button>
            </div>
            </form>
        </div>
      </div>
      <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />
    </div>
  )
}


export default function SupportChatPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SupportChatPageContent />
        </Suspense>
    )
}
