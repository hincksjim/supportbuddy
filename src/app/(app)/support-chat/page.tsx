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
  const [buddyAvatar, setBuddyAvatar] = useState("female")
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null)
  const router = useRouter()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef(input);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);
  
  const handleWakeUp = () => {
    const greeting = { role: "assistant", content: `Hi ${userName}, I'm here!` };
    setMessages((prev) => [...prev, greeting]);
    speakMessage(greeting.content);
  };
  
  const handleSleep = () => {
    const goodbye = { role: "assistant", content: "Okay, I'll be here when you need me. Just say 'wakey wakey'." };
    setMessages((prev) => [...prev, goodbye]);
    speakMessage(goodbye.content);
  }

  const {
    isListening,
    isSleeping,
    startListening,
    stopListening,
    isSupported,
    reset,
  } = useSpeechRecognition({
    onTranscript: (text) => setInput(text),
    onComplete: () => {
        // We use a ref to get the latest value of input inside this callback
        if (inputRef.current.trim()) {
            handleSubmit(undefined, inputRef.current);
        }
    },
    wakeWord: "hey buddy",
    onWakeUp: handleWakeUp,
    onSleep: handleSleep,
  });

  // Automatically start listening when the component mounts
  useEffect(() => {
    if (isSupported) {
      startListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);


  useEffect(() => {
    const storedName = localStorage.getItem("userName")
    const storedAvatar = localStorage.getItem("buddyAvatar")
    if (storedName) setUserName(storedName)
    if (storedAvatar) setBuddyAvatar(storedAvatar)
    
    const welcomeMessage = `Hello ${storedName || 'there'}! I'm your Support Buddy. I'm here to listen and help you with any questions or worries you might have about your health, treatment, or well-being. Feel free to talk to me about anything at all.`
    
    const initialMessage = {
      role: "assistant",
      content: welcomeMessage,
    };
    
    setMessages([initialMessage]);
    speakMessage(welcomeMessage);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (audioRef.current && audioDataUri) {
        stopListening();
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioDataUri]);
  
  const handleAudioEnded = () => {
    setAudioDataUri(null);
    if (isSupported && !isListening) {
      startListening();
    }
  };

  const speakMessage = async (text: string) => {
    try {
        const result = await textToSpeech(text);
        setAudioDataUri(result.audioDataUri);
    } catch (error) {
        console.error("Failed to generate audio for message:", error);
        // if TTS fails, restart listening
        if (isSupported && !isListening) {
          startListening();
        }
    }
  };
  
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("userName")
      localStorage.removeItem("buddyAvatar")
    }
    stopListening();
    router.push("/login")
  }

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>, messageToSend?: string) => {
    e?.preventDefault()
    const finalInput = messageToSend || input;
    if (!finalInput.trim() || isLoading) return

    setIsLoading(true)
    const userMessage: Message = { role: "user", content: finalInput }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    reset();

    try {
      const result = await aiConversationalSupport({ userName, question: finalInput })
      const assistantMessage: Message = { role: "assistant", content: result.answer }
      setMessages((prev) => [...prev, assistantMessage])
      speakMessage(result.answer)
    } catch (error) {
      const errorMessageText = "I'm sorry, I encountered an error. Please try again."
      const errorMessage: Message = {
        role: "assistant",
        content: errorMessageText,
      }
      setMessages((prev) => [...prev, errorMessage])
      speakMessage(errorMessageText)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
    if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages])

  const BuddyAvatarIcon = buddyAvatar === "male" ? AvatarMale : AvatarFemale;

  const getPlaceholderText = () => {
    if (isSleeping) return "Buddy is sleeping. Say 'wakey wakey' to start.";
    if (isListening) return "Listening...";
    return "Say 'hey buddy' or type your message...";
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
            onSubmit={(e) => handleSubmit(e)}
            className="relative"
            >
            <Textarea
                placeholder={getPlaceholderText()}
                className="pr-20 resize-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(undefined, input);
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
                        onClick={isListening ? stopListening : startListening}
                    >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                )}
                <Button
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
      {audioDataUri && (
          <audio ref={audioRef} src={audioDataUri} onEnded={handleAudioEnded} className="hidden" />
      )}
    </div>
  )
}
