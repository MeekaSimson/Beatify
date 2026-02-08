"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  Settings,
  Music2,
  Sparkles,
  Headphones,
  Clock,
  Music,
  FileAudio,
} from "lucide-react"

import { AudioRecorder } from "@/components/AudioRecorder"
import { FileUploader } from "@/components/FileUploader"
import { Metronome } from "@/components/Metronome"
import { TempoKeyForm } from "@/components/TempoKeyForm"
import { InstrumentSelector } from "@/components/InstrumentSelector"
import { GeneratePanel } from "@/components/GeneratePanel"
import { WavePlayer } from "@/components/WavePlayer"
import { MixConsole } from "@/components/MixConsole"
import { ErrorBoundary, StudioErrorFallback } from "@/components/ErrorBoundary"
import { useStudioStore } from "@/lib/store"
import { ApiClient } from "@/lib/apiClient"
import { useToast } from "@/hooks/use-toast"

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [trackId, setTrackId] = useState<string | null>(null)
  const [mixUrl, setMixUrl] = useState<string | null>(null)

  const {
    vocalFile,
    vocalUrl,
    durationSec,
    bpm,
    key,
    scale,
    instruments,
    status,
    setVocalFile,
    setStatus,
  } = useStudioStore()

  const { toast } = useToast()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("demo") === "true") {
      setVocalFile(new File([], "demo-vocal.wav", { type: "audio/wav" }), "/audio-waveform.png", 45)
      setTrackId("demo-track-123")
      toast({
        title: "Demo loaded",
        description: "Try the workflow with our sample vocal track",
      })
    }
  }, [setVocalFile, toast])

  // 🔑 Upload handler for BOTH upload + recorder
  const handleFileSelect = async (file: File, duration: number) => {
    try {
      setStatus("uploading")

      const response = await ApiClient.uploadTrack(file)
      setTrackId(response.trackId)

      const url = URL.createObjectURL(file)
      setVocalFile(file, url, duration)

      setStatus("idle")

      toast({
        title: "Upload successful",
        description: `${file.name} uploaded and ready for processing`,
      })
    } catch (error) {
      console.error("Upload failed:", error)
      setStatus("error")
      toast({
        title: "Upload failed",
        description: "Could not upload your file.",
        variant: "destructive",
      })
    }
  }

  const handleAnalyze = async () => {
    if (!trackId) return

    try {
      setStatus("analyzing")

      await ApiClient.analyzeTrack(
        trackId,
        bpm || undefined,
        key || undefined,
        scale || undefined
      )

      setStatus("idle")
      setActiveTab("instruments")

      toast({
        title: "Analysis complete",
        description: "Tempo and key detected successfully",
      })
    } catch (error) {
      console.error("Analysis failed:", error)
      setStatus("error")
      toast({
        title: "Analysis failed",
        description: "Could not analyze your track.",
        variant: "destructive",
      })
    }
  }

  const handleGenerationComplete = (newJobId: string) => {
    setMixUrl(`/api/job/${newJobId}/mix.wav`)
    setActiveTab("preview")
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const enabledInstruments = instruments.filter((i) => i.enabled)

  const progressPercentage = Math.min(
    100,
    (vocalFile ? 20 : 0) +
      (bpm ? 20 : 0) +
      (enabledInstruments.length ? 20 : 0) +
      (status === "ready" ? 20 : 0) +
      (mixUrl ? 20 : 0)
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Studio</h1>
        <p className="text-muted-foreground">Create your AI-generated accompaniment</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Project Progress</h2>
            <span className="text-sm text-muted-foreground">
              {progressPercentage}% complete
            </span>
          </div>

          <Progress value={progressPercentage} className="mb-4" />

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileAudio className="h-4 w-4" />
              <span>{vocalFile?.name || "None"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(durationSec)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              <span>{bpm || "--"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Music2 className="h-4 w-4" />
              <span>{key && scale ? `${key} ${scale}` : "Auto"}</span>
            </div>

            <Badge>{status}</Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="tempo">Tempo</TabsTrigger>
          <TabsTrigger value="instruments">Instruments</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <ErrorBoundary fallback={StudioErrorFallback}>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <FileUploader onFileSelect={handleFileSelect} />
                {vocalFile && vocalUrl && (
                  <WavePlayer
                    audioUrl={vocalUrl}
                    title={`Preview: ${vocalFile.name}`}
                  />
                )}
              </div>

              <div className="space-y-6">
                <AudioRecorder onRecordingComplete={handleFileSelect} />
                <Metronome />
              </div>
            </div>

            {vocalFile && (
              <div className="flex justify-end mt-4">
                <Button onClick={() => setActiveTab("tempo")}>
                  Next: Set Tempo & Key →
                </Button>
              </div>
            )}
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="tempo">
          <TempoKeyForm onAnalyze={handleAnalyze} />
        </TabsContent>

        <TabsContent value="instruments">
          <InstrumentSelector />
        </TabsContent>

        <TabsContent value="generate">
          <GeneratePanel
            trackId={trackId}
            onGenerationComplete={handleGenerationComplete}
          />
        </TabsContent>

        <TabsContent value="preview">
          <div className="grid lg:grid-cols-2 gap-6">
            {mixUrl && <WavePlayer audioUrl={mixUrl} title="Generated Mix" />}
            <MixConsole mixUrl={mixUrl || undefined} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
