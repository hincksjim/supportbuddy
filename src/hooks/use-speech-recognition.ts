"use client"

import { useState, useEffect, useRef } from "react"

interface SpeechRecognitionOptions {
  onTranscript: (transcript: string) => void
  onListen?: (listening: boolean) => void
  onComplete?: () => void;
  wakeWord?: string
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
}: SpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const wakeWordDetectedRef = useRef(false)
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stopManuallyRef = useRef(false);

  useEffect(() => {
    if (SpeechRecognitionApi) {
      setIsSupported(true)
      const recognition = new SpeechRecognitionApi()
      recognition.continuous = true
      recognition.interimResults = true
      recognitionRef.current = recognition
    } else {
      setIsSupported(false)
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      stopManuallyRef.current = false;
      wakeWordDetectedRef.current = !wakeWord; // If no wake word, start listening immediately
      if(wakeWordDetectedRef.current) {
        onTranscript(""); // Clear previous transcript
      }
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
    wakeWordDetectedRef.current = !wakeWord;
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

        if (wakeWord && !wakeWordDetectedRef.current) {
            if (lowerCaseTranscript.includes(wakeWord.toLowerCase())) {
                console.log("Wake word detected!");
                wakeWordDetectedRef.current = true;
                onTranscript(""); // Clear transcript so wake word isn't in input
            }
            return; // Don't process until wake word is detected
        }
        
        if (wakeWordDetectedRef.current) {
           onTranscript(currentTranscript);
           
           if(finalTranscript || interimTranscript) {
             speechTimeoutRef.current = setTimeout(() => {
                if (onComplete) {
                    onComplete();
                }
                reset();
             }, 2500); // 2.5 seconds of silence
           }
        }
    }

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error", event.error)
      // "not-allowed" error means user denied permission. Don't restart.
      if (event.error !== 'not-allowed') {
        stopListening()
      }
    }

    const handleEnd = () => {
      if (isListening && !stopManuallyRef.current) {
        // If it stops unexpectedly, restart it.
        try {
            recognition.start();
        } catch(e) {
            // it might fail if the component is unmounting
            console.error("Could not restart speech recognition", e);
            setIsListening(false);
            onListen?.(false);
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
            recognition.onend = null;
            if (isListening) {
                recognitionRef.current.stop();
            }
        }
        if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
        }
    }
  }, [isListening, onTranscript, onComplete, wakeWord, onListen])

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    reset,
  }
}
