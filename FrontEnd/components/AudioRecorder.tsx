"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Mic, Square } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AudioRecorderProps {
  onRecordingComplete: (file: File, duration: number) => void
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [level, setLevel] = useState(0)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const samplesRef = useRef<Float32Array[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const { toast } = useToast()

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const processor = audioCtx.createScriptProcessor(4096, 1, 1)

      samplesRef.current = []

      processor.onaudioprocess = (e) => {
        const data = e.inputBuffer.getChannelData(0)
        samplesRef.current.push(new Float32Array(data))

        const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length)
        setLevel(Math.min(100, rms * 200))
      }

      source.connect(processor)
      processor.connect(audioCtx.destination)

      audioCtxRef.current = audioCtx
      processorRef.current = processor
      sourceRef.current = source
      streamRef.current = stream

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)

      setIsRecording(true)
      toast({ title: "Recording started" })
    } catch {
      toast({
        title: "Microphone error",
        description: "Permission denied or device unavailable",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (!audioCtxRef.current) return

    // ⏱ stop timer first
    if (timerRef.current) clearInterval(timerRef.current)

    const sampleRate = audioCtxRef.current.sampleRate

    processorRef.current?.disconnect()
    sourceRef.current?.disconnect()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioCtxRef.current.close()

    const buffer = mergeBuffers(samplesRef.current)
    const wav = encodeWAV(buffer, sampleRate)
    const blob = new Blob([wav], { type: "audio/wav" })
    const file = new File([blob], `recording-${Date.now()}.wav`, {
      type: "audio/wav",
    })

    onRecordingComplete(file, recordingTime)

    // cleanup
    samplesRef.current = []
    setIsRecording(false)
    setLevel(0)
    setRecordingTime(0)

    toast({ title: "Recording complete" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex gap-2 items-center">
          <Mic className="h-5 w-5" />
          Audio Recorder
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isRecording ? (
          <Button onClick={startRecording}>
            <Mic className="mr-2 h-4 w-4" />
            Start Recording
          </Button>
        ) : (
          <Button variant="destructive" onClick={stopRecording}>
            <Square className="mr-2 h-4 w-4" />
            Stop Recording
          </Button>
        )}

        {isRecording && <Progress value={level} className="h-2" />}

        {isRecording && (
          <div className="text-center text-xl font-mono">
            {recordingTime}s
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function mergeBuffers(buffers: Float32Array[]) {
  let length = buffers.reduce((l, b) => l + b.length, 0)
  const result = new Float32Array(length)
  let offset = 0
  for (const b of buffers) {
    result.set(b, offset)
    offset += b.length
  }
  return result
}

function encodeWAV(samples: Float32Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  writeString(view, 0, "RIFF")
  view.setUint32(4, 36 + samples.length * 2, true)
  writeString(view, 8, "WAVE")
  writeString(view, 12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, "data")
  view.setUint32(40, samples.length * 2, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }

  return buffer
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}
