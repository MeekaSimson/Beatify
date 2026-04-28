"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Mic, Square, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AudioRecorderProps {
  onRecordingComplete: (file: File, duration: number) => void
  className?: string
}

export function AudioRecorder({ onRecordingComplete, className }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [showReRecordDialog, setShowReRecordDialog] = useState(false)
  const [hasRecording, setHasRecording] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationRef = useRef<number | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const { toast } = useToast()

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    setAudioLevel(Math.min(100, (average / 255) * 100))

    if (isRecording) {
      animationRef.current = requestAnimationFrame(updateAudioLevel)
    }
  }, [isRecording])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      streamRef.current = stream

      // Set up audio analysis
      audioContextRef.current = new AudioContext({ sampleRate: 44100 })
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      // Set up MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" })
        const file = new File([blob], `recording-${Date.now()}.wav`, { type: "audio/wav" })
        onRecordingComplete(file, recordingTime)
        setHasRecording(true)
      }

      mediaRecorderRef.current.start(100)
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      // Start audio level monitoring
      updateAudioLevel()

      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      })
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Clean up
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }

      setAudioLevel(0)

      toast({
        title: "Recording complete",
        description: `Recorded ${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, "0")}`,
      })
    }
  }

  const handleReRecord = () => {
    if (hasRecording) {
      setShowReRecordDialog(true)
    } else {
      startRecording()
    }
  }

  const confirmReRecord = () => {
    setHasRecording(false)
    setRecordingTime(0)
    setShowReRecordDialog(false)
    startRecording()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Audio Recorder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-4">
            {!isRecording ? (
              <Button onClick={handleReRecord} size="lg" className="gap-2">
                <Mic className="h-4 w-4" />
                {hasRecording ? "Re-record" : "Start Recording"}
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="destructive" size="lg" className="gap-2">
                <Square className="h-4 w-4" />
                Stop Recording
              </Button>
            )}

            {hasRecording && !isRecording && (
              <Button onClick={() => setShowReRecordDialog(true)} variant="outline" size="lg" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Re-record
              </Button>
            )}
          </div>

          {/* Recording Time */}
          {(isRecording || hasRecording) && (
            <div className="text-center">
              <div className="text-2xl font-mono font-bold">{formatTime(recordingTime)}</div>
              <div className="text-sm text-muted-foreground">{isRecording ? "Recording..." : "Recording complete"}</div>
            </div>
          )}

          {/* Audio Level Meter */}
          {isRecording && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Input Level</div>
              <Progress value={audioLevel} className="h-2" />
            </div>
          )}

          {/* Recording Tips */}
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <strong>Tips:</strong> Record in a quiet environment. Speak clearly and maintain consistent distance from
            the microphone.
          </div>
        </CardContent>
      </Card>

      {/* Re-record Confirmation Dialog */}
      <AlertDialog open={showReRecordDialog} onOpenChange={setShowReRecordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-record Audio?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current recording. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReRecord}>Re-record</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
