"use client"

import { useState, useEffect, useRef } from "react"

interface SpeechRecognitionOptions {
  onTranscript: (transcript: string) => void
  onListen?: (listening: boolean) => void
  onComplete?: () => void;
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
}: SpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  
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
      recognitionRef.current.stop()
    }
  }

  useEffect(() => {
    const recognition = recognitionRef.current
    if (!recognition) return

    const handleResult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                // We can show interim results if we want, for now we just build the final one
                 finalTranscript += event.results[i][0].transcript;
            }
        }
        onTranscript(finalTranscript.trim());
    }

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error", event.error)
      if (event.error === 'not-allowed') {
        setIsSupported(false);
      }
      setIsListening(false)
      onListen?.(false)
    }

    const handleEnd = () => {
      setIsListening(false)
      onListen?.(false)
      if (onComplete) {
        onComplete();
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
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening])

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
  }
}
