"use client"

import { useState, useEffect, useRef } from "react"

interface SpeechRecognitionOptions {
  onTranscript: (transcript: string) => void
  onListen?: (listening: boolean) => void
  onComplete?: () => void;
  wakeWord?: string;
  onWakeUp?: () => void;
  onSleep?: () => void;
}

const getSpeechRecognition = () => {
    if (typeof window !== "undefined") {
        return window.SpeechRecognition || window.webkitSpeechRecognition
    }
    return null
}

const SpeechRecognitionApi = getSpeechRecognition()

export function useSpeechRecognition({
  onTranscript,
  onListen,
  onComplete,
  wakeWord,
  onWakeUp,
  onSleep,
}: SpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [isSleeping, setIsSleeping] = useState(false)
  const [isListeningForWakeWord, setIsListeningForWakeWord] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stopManuallyRef = useRef(false);

  useEffect(() => {
    if (SpeechRecognitionApi) {
      setIsSupported(true)
      const recognition = new SpeechRecognitionApi()
      recognition.continuous = true
      recognition.interimResults = true
      recognitionRef.current = recognition
      setIsListeningForWakeWord(!!wakeWord);
    } else {
      setIsSupported(false)
    }
  }, [wakeWord])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      stopManuallyRef.current = false;
      onTranscript(""); // Clear previous transcript
      try {
        recognitionRef.current.start()
        setIsListening(true)
        onListen?.(true)
      } catch(e) {
          console.error("Speech recognition could not be started: ", e);
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      stopManuallyRef.current = true;
      recognitionRef.current.stop()
      setIsListening(false)
      onListen?.(false)
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    }
  }
  
  const reset = () => {
    setIsListeningForWakeWord(!!wakeWord);
    onTranscript("");
  }


  useEffect(() => {
    const recognition = recognitionRef.current
    if (!recognition) return

    const handleResult = (event: SpeechRecognitionEvent) => {
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
        }

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        const currentTranscript = (finalTranscript || interimTranscript).trim();
        const lowerCaseTranscript = currentTranscript.toLowerCase();

        // Handle sleep/wake commands
        if (lowerCaseTranscript.includes("night night")) {
            setIsSleeping(true);
            onSleep?.();
            reset();
            return;
        }
        if (lowerCaseTranscript.includes("wakey wakey")) {
            setIsSleeping(false);
            onWakeUp?.();
            reset();
            return;
        }

        if (isSleeping) return;

        if (isListeningForWakeWord && wakeWord) {
            if (lowerCaseTranscript.includes(wakeWord.toLowerCase())) {
                console.log("Wake word detected!");
                setIsListeningForWakeWord(false);
                onTranscript(""); // Clear transcript so wake word isn't in input
            }
            return; // Don't process until wake word is detected
        }
        
        onTranscript(currentTranscript);
        
        if(finalTranscript || interimTranscript) {
          speechTimeoutRef.current = setTimeout(() => {
            if (onComplete) {
                onComplete();
            }
            reset();
          }, 1000); // 1 second of silence
        }
    }

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error", event.error)
      // "not-allowed" error means user denied permission. Don't restart.
      if (event.error !== 'not-allowed') {
        // May restart, depending on the error.
        // For now, we just stop.
        stopListening();
      }
    }

    const handleEnd = () => {
      setIsListening(false);
      onListen?.(false);
      if (!stopManuallyRef.current) {
        // If it stops unexpectedly, restart it.
        try {
            startListening();
        } catch(e) {
            // it might fail if the component is unmounting
            console.error("Could not restart speech recognition", e);
        }
      }
    }

    recognition.onresult = handleResult
    recognition.onerror = handleError
    recognition.onend = handleEnd

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.onresult = null
            recognitionRef.current.onerror = null
            recognitionRef.current.onend = null;
            if (isListening) {
                recognitionRef.current.stop();
            }
        }
        if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, isSleeping, onTranscript, onComplete, wakeWord, onListen, onWakeUp, onSleep, isListeningForWakeWord])

  return {
    isListening,
    isSupported,
    isSleeping,
    isListeningForWakeWord,
    startListening,
    stopListening,
    reset,
  }
}
