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
  CheckCircle,
  AlertCircle,
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

  const { vocalFile, vocalUrl, durationSec, bpm, key, scale, instruments, status, jobId, setVocalFile, setStatus } =
    useStudioStore()

  const { toast } = useToast()

  // Check for demo mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("demo") === "true") {
      // Load demo track
      setVocalFile(new File([], "demo-vocal.wav", { type: "audio/wav" }), "/audio-waveform.png", 45)
      setTrackId("demo-track-123")
      toast({
        title: "Demo loaded",
        description: "Try the workflow with our sample vocal track",
      })
    }
  }, [setVocalFile, toast])

  const handleFileSelect = async (file: File, duration: number) => {
    try {
      setStatus("uploading")

      // Upload file to backend
      const response = await ApiClient.uploadTrack(file)
      setTrackId(response.trackId)

      // Create object URL for preview
      const url = URL.createObjectURL(file)
      setVocalFile(file, url, duration)

      setStatus("idle")
      setActiveTab("tempo")

      toast({
        title: "Upload successful",
        description: `${file.name} uploaded and ready for processing`,
      })
    } catch (error) {
      console.error("Upload failed:", error)
      setStatus("error")
      toast({
        title: "Upload failed",
        description: "Could not upload your file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAnalyze = async () => {
    if (!trackId) return

    try {
      setStatus("analyzing")
      await ApiClient.analyzeTrack(trackId, bpm, key || undefined, scale || undefined)
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
        description: "Could not analyze your track. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleGenerationComplete = (newJobId: string) => {
    setMixUrl(`/api/job/${newJobId}/mix.wav`)
    setActiveTab("preview")
  }

  const getTabStatus = (tab: string) => {
    switch (tab) {
      case "upload":
        return vocalFile ? "complete" : "pending"
      case "tempo":
        return bpm && (key || status === "analyzing") ? "complete" : vocalFile ? "active" : "pending"
      case "instruments":
        return instruments.some((i) => i.enabled) ? "complete" : bpm ? "active" : "pending"
      case "generate":
        return status === "ready" ? "complete" : status === "generating" ? "active" : "pending"
      case "preview":
        return mixUrl ? "complete" : status === "ready" ? "active" : "pending"
      default:
        return "pending"
    }
  }

  const getStatusIcon = (tabStatus: string) => {
    switch (tabStatus) {
      case "complete":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "active":
        return <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 rounded-full bg-muted-foreground/30" />
    }
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
      (enabledInstruments.length > 0 ? 20 : 0) +
      (status === "ready" ? 20 : 0) +
      (mixUrl ? 20 : 0),
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Studio</h1>
        <p className="text-muted-foreground">Create your AI-generated accompaniment in 5 simple steps</p>
      </div>

      {/* Progress Overview */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Project Progress</h2>
            <span className="text-sm text-muted-foreground">{progressPercentage}% complete</span>
          </div>
          <Progress value={progressPercentage} className="mb-4" />

          {/* Status Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileAudio className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">File:</span>
              <span className="font-medium truncate">{vocalFile?.name || "None"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{formatDuration(durationSec)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">BPM:</span>
              <span className="font-medium">{bpm || "--"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Music2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Key:</span>
              <span className="font-medium">{key && scale ? `${key} ${scale}` : "Auto"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status === "ready" ? "default" : status === "error" ? "destructive" : "secondary"}>
                {status === "idle" ? "Ready" : status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Workflow Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            {getStatusIcon(getTabStatus("upload"))}
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </TabsTrigger>
          <TabsTrigger value="tempo" className="flex items-center gap-2">
            {getStatusIcon(getTabStatus("tempo"))}
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Tempo</span>
          </TabsTrigger>
          <TabsTrigger value="instruments" className="flex items-center gap-2">
            {getStatusIcon(getTabStatus("instruments"))}
            <Music2 className="h-4 w-4" />
            <span className="hidden sm:inline">Instruments</span>
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center gap-2">
            {getStatusIcon(getTabStatus("generate"))}
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Generate</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            {getStatusIcon(getTabStatus("preview"))}
            <Headphones className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
          </TabsTrigger>
        </TabsList>

        {/* Upload/Record Tab */}
        <TabsContent value="upload" className="space-y-6">
          <ErrorBoundary fallback={StudioErrorFallback}>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <FileUploader onFileSelect={handleFileSelect} />
                {vocalFile && vocalUrl && <WavePlayer audioUrl={vocalUrl} title={`Preview: ${vocalFile.name}`} />}
              </div>
              <div className="space-y-6">
                <AudioRecorder onRecordingComplete={handleFileSelect} />
                <Metronome />
              </div>
            </div>

            {vocalFile && (
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab("tempo")} size="lg">
                  Next: Set Tempo & Key
                </Button>
              </div>
            )}
          </ErrorBoundary>
        </TabsContent>

        {/* Tempo & Key Tab */}
        <TabsContent value="tempo" className="space-y-6">
          <ErrorBoundary fallback={StudioErrorFallback}>
            <div className="grid lg:grid-cols-2 gap-6">
              <TempoKeyForm onAnalyze={handleAnalyze} />
              {vocalFile && vocalUrl && <WavePlayer audioUrl={vocalUrl} title="Your Vocal Track" />}
            </div>

            {bpm && (
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab("instruments")} size="lg">
                  Next: Choose Instruments
                </Button>
              </div>
            )}
          </ErrorBoundary>
        </TabsContent>

        {/* Instruments Tab */}
        <TabsContent value="instruments" className="space-y-6">
          <ErrorBoundary fallback={StudioErrorFallback}>
            <InstrumentSelector />

            {enabledInstruments.length > 0 && (
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab("generate")} size="lg">
                  Next: Generate Music
                </Button>
              </div>
            )}
          </ErrorBoundary>
        </TabsContent>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          <ErrorBoundary fallback={StudioErrorFallback}>
            <GeneratePanel trackId={trackId} onGenerationComplete={handleGenerationComplete} />
          </ErrorBoundary>
        </TabsContent>

        {/* Preview & Mix Tab */}
        <TabsContent value="preview" className="space-y-6">
          <ErrorBoundary fallback={StudioErrorFallback}>
            <div className="grid lg:grid-cols-2 gap-6">
              {mixUrl && <WavePlayer audioUrl={mixUrl} title="Generated Mix" />}
              <MixConsole
                mixUrl={mixUrl || undefined}
                onRegenerate={() => setActiveTab("generate")}
                onDownload={() => {
                  toast({
                    title: "Download started",
                    description: "Your track is being prepared for download",
                  })
                }}
              />
            </div>
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  )
}
