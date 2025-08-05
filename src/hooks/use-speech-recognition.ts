"use client"

import { useState, useEffect, useRef } from "react"

interface SpeechRecognitionOptions {
  onTranscript: (transcript: string) => void
  onListen?: (listening: boolean) => void
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
  wakeWord,
}: SpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const wakeWordDetectedRef = useRef(false)

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
      wakeWordDetectedRef.current = !wakeWord; // If no wake word, start listening immediately
      recognitionRef.current.start()
      setIsListening(true)
      onListen?.(true)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      onListen?.(false)
    }
  }

  useEffect(() => {
    const recognition = recognitionRef.current
    if (!recognition) return

    const handleResult = (event: SpeechRecognitionEvent) => {
      let fullTranscript = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          fullTranscript += event.results[i][0].transcript
        }
      }

      const lowerCaseTranscript = fullTranscript.toLowerCase().trim()

      if (wakeWord && !wakeWordDetectedRef.current) {
        if (lowerCaseTranscript.includes(wakeWord.toLowerCase())) {
          wakeWordDetectedRef.current = true
          // Clear the transcript so the wake word isn't in the input
          setTranscript("")
          onTranscript("")
        }
        return // Don't process transcript until wake word is detected
      }
      
      if (wakeWordDetectedRef.current) {
         setTranscript((prev) => prev + fullTranscript)
         onTranscript((prev) => prev + fullTranscript)
      }
    }

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error", event.error)
      stopListening()
    }

    const handleEnd = () => {
      if (isListening) {
        // If it stops unexpectedly, restart it.
        startListening()
      }
    }

    recognition.onresult = handleResult
    recognition.onerror = handleError
    recognition.onend = handleEnd

    return () => {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
    }
  }, [isListening, onTranscript, wakeWord])

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
  }
}
