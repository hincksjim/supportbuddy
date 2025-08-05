"use client"

import { useState, useRef, useEffect } from "react"
import { CornerDownLeft, Loader2, User, Bot, LogOut, Mic, MicOff } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { aiConversationalSupport } from "@/ai/flows/conversational-support"
import { textToSpeech } from "@/ai/flows/text-to-speech"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AvatarFemale, AvatarMale, Logo } from "@/components/icons"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function SupportChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState("User")
  const [userAge, setUserAge] = useState("")
  const [userGender, setUserGender] = useState("")
  const [userPostcode, setUserPostcode] = useState("")
  const [buddyAvatar, setBuddyAvatar] = useState("female")
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null)
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
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
    if (!finalInput || isLoading) return

    setIsLoading(true)
    const userMessage: Message = { role: "user", content: finalInput }
    const newMessages = [...messages, userMessage];
    setMessages(newMessages)
    setInput("")

    try {
      const result = await aiConversationalSupport({ 
        userName, 
        age: userAge,
        gender: userGender,
        postcode: userPostcode,
        conversationHistory: messages,
        question: finalInput 
      })
      const assistantMessage: Message = { role: "assistant", content: result.answer }
      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages)
      localStorage.setItem("conversationHistory", JSON.stringify(finalMessages));
      await speakMessage(result.answer)
    } catch (error) {
      const errorMessageText = "I'm sorry, I encountered an error. Please try again."
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

  const {
    isListening,
    startListening,
    stopListening,
    isSupported,
  } = useSpeechRecognition({
    onTranscript: (text) => setInput(text),
    onComplete: (transcript) => {
        setInput(transcript);
        // This is now a manual process, no automatic submission
    },
  });

  const toggleListening = () => {
    if (isListening) {
        stopListening();
    } else {
        setInput(""); // Clear input before starting
        startListening();
    }
  }

  useEffect(() => {
    const storedName = localStorage.getItem("userName")
    const storedAge = localStorage.getItem("userAge")
    const storedGender = localStorage.getItem("userGender")
    const storedPostcode = localStorage.getItem("userPostcode")
    const storedAvatar = localStorage.getItem("buddyAvatar")
    const storedHistory = localStorage.getItem("conversationHistory")

    if (storedName) setUserName(storedName)
    if (storedAge) setUserAge(storedAge)
    if (storedGender) setUserGender(storedGender)
    if (storedPostcode) setUserPostcode(storedPostcode)
    if (storedAvatar) setBuddyAvatar(storedAvatar)

    if (storedHistory) {
      setMessages(JSON.parse(storedHistory));
    } else {
      const welcomeMessage = `Hello ${storedName || 'there'}! I'm your Support Buddy. I'm here to listen and help you with any questions or worries you might have about your health, treatment, or well-being. Feel free to talk to me about anything at all.`
      
      const initialMessage: Message = {
        role: "assistant",
        content: welcomeMessage,
      };
      
      setMessages([initialMessage]);
      speakMessage(welcomeMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (audioRef.current && audioDataUri) {
      audioRef.current.src = audioDataUri;
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [audioDataUri]);
  
  const handleAudioEnded = () => {
    setAudioDataUri(null);
  };
  
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.clear(); // Clear all user data on logout
    }
    if (isListening) {
        stopListening();
    }
    router.push("/login")
  }

  const BuddyAvatarIcon = buddyAvatar === "male" ? AvatarMale : AvatarFemale;

  const getPlaceholderText = () => {
    if (isListening) return "Listening... Press the mic again to stop."
    return "Press the mic to speak, or type here...";
  }

  return (
    <div className="h-full flex flex-col">
       <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 font-semibold">
            <Logo className="w-6 h-6 text-primary" />
            <span className="font-headline">Support Buddy</span>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
          </Button>
        </header>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
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
                    handleSubmit(e);
                }
                }}
                disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {isSupported && (
                    <Button
                        type="button"
                        size="icon"
                        variant={isListening ? "destructive" : "ghost"}
                        onClick={toggleListening}
                    >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                )}
                <Button
                    id="chat-submit-button"
                    type="submit"
                    size="icon"
                    disabled={isLoading || !input.trim()}
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
