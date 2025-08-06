
"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { CornerDownLeft, Loader2, User, Bot, LogOut, Mic, MicOff, Save, Home } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { aiConversationalSupport, AiConversationalSupportInput } from "@/ai/flows/conversational-support"
import { generateConversationSummary } from "@/ai/flows/generate-conversation-summary"
import { textToSpeech } from "@/ai/flows/text-to-speech"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AvatarFemale, AvatarMale, Logo } from "@/components/icons"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useToast } from "@/hooks/use-toast"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ConversationSummary {
  id: string;
  title: string;
  summary: string;
  date: string;
}

interface StoredConversation {
    id: string;
    messages: Message[];
}

interface UserData {
  name?: string;
  age?: string;
  gender?: string;
  postcode?: string;
  avatar?: 'male' | 'female';
  dob?: string;
  employmentStatus?: string;
  income?: string;
  savings?: string;
  benefits?: string[];
}

function SupportChatPageContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData>({});
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null)
  const [isHistoricChat, setIsHistoricChat] = useState(false);
  
  const router = useRouter()
  const searchParams = useSearchParams();
  const { toast } = useToast()
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const speakMessage = async (text: string) => {
    try {
      const result = await textToSpeech(text);
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
        userName: userData.name || "User", 
        age: userData.age || "",
        gender: userData.gender || "",
        postcode: userData.postcode || "",
        dob: userData.dob || "",
        employmentStatus: userData.employmentStatus || "",
        existingBenefits: userData.benefits || [],
        conversationHistory: messages,
        question: finalInput 
      };

      if (userData.income) {
          flowInput.income = userData.income;
      }
      if (userData.savings) {
          flowInput.savings = userData.savings;
      }

      const result = await aiConversationalSupport(flowInput)
      const assistantMessage: Message = { role: "assistant", content: result.answer }
      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages)
      localStorage.setItem(`conversationHistory_${currentUserEmail}`, JSON.stringify(finalMessages));
      await speakMessage(result.answer)
    } catch (error) {
      console.error("Error from AI support flow: ", error)
      const errorMessageText = "I'm sorry, I encountered an error. Please try again. If the problem persists, please check the server logs."
      const errorMessage: Message = {
        role: "assistant",
        content: errorMessageText,
      }
      setMessages((prev) => [...prev, errorMessage])
      await speakMessage(errorMessageText)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSummary = async () => {
    if (!currentUserEmail || messages.length < 2 || isHistoricChat) {
         toast({
            title: isHistoricChat ? "Cannot Save" : "Not enough conversation",
            description: isHistoricChat ? "This is a past conversation and cannot be re-saved." : "Have a bit more of a chat before saving a summary.",
            variant: isHistoricChat ? "destructive" : "default"
        });
        return;
    }

    setIsSaving(true);
    try {
      const result = await generateConversationSummary({ conversationHistory: messages });
      
      const newSummaryId = new Date().toISOString();

      // Save the summary
      const summariesKey = `conversationSummaries_${currentUserEmail}`;
      const storedSummaries = localStorage.getItem(summariesKey);
      const summaries: ConversationSummary[] = storedSummaries ? JSON.parse(storedSummaries) : [];
      const newSummary: ConversationSummary = {
        id: newSummaryId,
        date: new Date().toISOString(),
        ...result,
      };
      summaries.unshift(newSummary);
      localStorage.setItem(summariesKey, JSON.stringify(summaries));

      // Save the conversation history with the same ID
      const allConversationsKey = `allConversations_${currentUserEmail}`;
      const storedConversations = localStorage.getItem(allConversationsKey);
      const allConversations: StoredConversation[] = storedConversations ? JSON.parse(storedConversations) : [];
      const newConversation: StoredConversation = {
        id: newSummaryId,
        messages: messages
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
    setCurrentUserEmail(email);

    if (email) {
      const storedData = localStorage.getItem(`userData_${email}`);
      if (storedData) {
        setUserData(JSON.parse(storedData));
      }
    } else {
      router.push("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);
  
  useEffect(() => {
    if (!currentUserEmail) return;

    const conversationId = searchParams.get("id");

    if (conversationId) {
        setIsHistoricChat(true);
        const allConversationsStr = localStorage.getItem(`allConversations_${currentUserEmail}`);
        if (allConversationsStr) {
            try {
                const allConversations: StoredConversation[] = JSON.parse(allConversationsStr);
                const conversation = allConversations.find(c => c.id === conversationId);
                if (conversation) {
                    setMessages(conversation.messages);
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
            const welcomeMessage = `Hello ${userData.name || 'there'}! I'm your Support Buddy. I'm here to listen and help you with any questions or worries you might have about your health, treatment, or well-being. Feel free to talk to me about anything at all.`
            const initialMessage: Message = { role: "assistant", content: welcomeMessage };
            setMessages([initialMessage]);
            speakMessage(welcomeMessage);
          }
        } else {
          const welcomeMessage = `Hello ${userData.name || 'there'}! I'm your Support Buddy. I'm here to listen and help you with any questions or worries you might have about your health, treatment, or well-being. Feel free to talk to me about anything at all.`
          const initialMessage: Message = { role: "assistant", content: welcomeMessage };
          setMessages([initialMessage]);
          speakMessage(welcomeMessage);
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserEmail, searchParams, userData.name]);

  useEffect(() => {
    if (audioRef.current && audioDataUri) {
      audioRef.current.src = audioDataUri;
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [audioDataUri]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.children[0] as HTMLDivElement;
      if(scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);
  
  const handleAudioEnded = () => {
    setAudioDataUri(null);
  };
  
  const handleNewChat = () => {
    if (currentUserEmail) {
        localStorage.removeItem(`conversationHistory_${currentUserEmail}`);
    }
    router.push("/support-chat");
  }

  const BuddyAvatarIcon = userData.avatar === "male" ? AvatarMale : AvatarFemale;

  const getPlaceholderText = () => {
    if (isHistoricChat) return "This is a past conversation. You cannot send new messages.";
    if (isListening) return "Listening... Press the mic again to stop.";
    return "Press the mic to speak, or type here...";
  }

  return (
    <div className="relative flex h-full max-h-screen flex-col">
       <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            {isHistoricChat && (
                <Button variant="outline" size="sm" onClick={handleNewChat}>
                    <Home className="mr-2 h-4 w-4" />
                    Current Chat
                </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleSaveSummary} disabled={isSaving || isHistoricChat}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
            </Button>
          </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 md:p-6 space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-4",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="w-8 h-8 border bg-accent/50">
                    <AvatarFallback className="bg-transparent text-foreground">
                        <BuddyAvatarIcon className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-xl rounded-xl p-3 shadow-md",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <Avatar className="w-8 h-8 border">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                        <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-4 justify-start">
                <Avatar className="w-8 h-8 border bg-accent/50">
                   <AvatarFallback className="bg-transparent text-foreground">
                        <BuddyAvatarIcon className="w-5 h-5" />
                    </AvatarFallback>
                </Avatar>
                <div className="max-w-xl rounded-xl p-3 shadow-md bg-card flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="border-t bg-background p-4 md:p-6">
        <div className="container mx-auto max-w-md">
            <form
            id="chat-form"
            onSubmit={handleSubmit}
            className="relative"
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
