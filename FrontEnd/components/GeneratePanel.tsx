"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useStudioStore } from "@/lib/store"
import { ApiClient } from "@/lib/apiClient"
import { useToast } from "@/hooks/use-toast"

const GENERATION_STEPS = [
  "Analyzing vocal track...",
  "Detecting tempo and key...",
  "Generating drum patterns...",
  "Creating bass lines...",
  "Adding harmonic instruments...",
  "Mixing and mastering...",
  "Finalizing your track...",
]

interface GeneratePanelProps {
  trackId?: string
  onGenerationComplete?: (jobId: string) => void
  className?: string
}

export function GeneratePanel({ trackId, onGenerationComplete, className }: GeneratePanelProps) {
  const { bpm, key, scale, instruments, status, jobId, setStatus, setJobId } = useStudioStore()
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [estimatedTime, setEstimatedTime] = useState(0)

  const { toast } = useToast()

  const enabledInstruments = instruments.filter((inst) => inst.enabled)
  const canGenerate = trackId && bpm && enabledInstruments.length > 0

  const startGeneration = async () => {
    if (!trackId || !canGenerate) return

    try {
      setStatus("generating")
      setProgress(0)
      setCurrentStep(GENERATION_STEPS[0])

      // Calculate estimated time based on instruments and complexity
      const baseTime = 30 // Base 30 seconds
      const instrumentTime = enabledInstruments.length * 10 // 10 seconds per instrument
      const complexityMultiplier =
        enabledInstruments.reduce((sum, inst) => sum + (inst.complexity || 3), 0) / enabledInstruments.length
      const estimated = Math.round(baseTime + instrumentTime * complexityMultiplier)
      setEstimatedTime(estimated)

      // Start generation
      const response = await ApiClient.generateAccompaniment(
        trackId,
        bpm,
        key || "C",
        scale || "major",
        enabledInstruments,
      )

      setJobId(response.jobId)

      // Simulate progress updates
      const stepDuration = (estimated * 1000) / GENERATION_STEPS.length
      let currentStepIndex = 0

      const progressInterval = setInterval(() => {
        currentStepIndex++
        if (currentStepIndex < GENERATION_STEPS.length) {
          setCurrentStep(GENERATION_STEPS[currentStepIndex])
          setProgress((currentStepIndex / GENERATION_STEPS.length) * 100)
        } else {
          clearInterval(progressInterval)
          setProgress(100)
          setStatus("ready")
          setCurrentStep("Generation complete!")
          onGenerationComplete?.(response.jobId)

          toast({
            title: "Generation complete!",
            description: "Your AI-generated accompaniment is ready to preview.",
          })
        }
      }, stepDuration)

      toast({
        title: "Generation started",
        description: `Creating your accompaniment with ${enabledInstruments.length} instruments...`,
      })
    } catch (error) {
      console.error("Generation failed:", error)
      setStatus("error")
      setCurrentStep("Generation failed")
      toast({
        title: "Generation failed",
        description: "There was an error generating your accompaniment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "generating":
        return <Loader2 className="h-5 w-5 animate-spin" />
      case "ready":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Sparkles className="h-5 w-5" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "generating":
        return "bg-blue-500/10 text-blue-700 border-blue-200"
      case "ready":
        return "bg-green-500/10 text-green-700 border-green-200"
      case "error":
        return "bg-red-500/10 text-red-700 border-red-200"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            AI Generation
          </div>
          {jobId && (
            <Badge variant="outline" className="text-xs">
              Job: {jobId.slice(0, 8)}...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generation Summary */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Tempo:</span>
              <span className="ml-2 font-medium">{bpm} BPM</span>
            </div>
            <div>
              <span className="text-muted-foreground">Key:</span>
              <span className="ml-2 font-medium">{key && scale ? `${key} ${scale}` : "Auto-detect"}</span>
            </div>
          </div>

          <div>
            <span className="text-sm text-muted-foreground">Instruments:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {enabledInstruments.map((inst) => (
                <Badge key={inst.name} variant="secondary" className="text-xs">
                  {inst.name} ({inst.style})
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Generation Status */}
        {status !== "idle" && (
          <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{currentStep}</span>
              {status === "generating" && estimatedTime > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="h-4 w-4" />~
                  {Math.max(0, estimatedTime - Math.floor((progress / 100) * estimatedTime))}s
                </div>
              )}
            </div>
            {status === "generating" && <Progress value={progress} className="h-2" />}
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={startGeneration}
          disabled={!canGenerate || status === "generating"}
          size="lg"
          className="w-full gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {status === "generating" ? "Generating..." : "Generate Accompaniment"}
        </Button>

        {/* Requirements Check */}
        {!canGenerate && (
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="font-medium">Requirements:</div>
            <ul className="space-y-1 ml-4">
              <li className={trackId ? "text-green-600" : ""}>{trackId ? "✓" : "○"} Upload or record a vocal track</li>
              <li className={bpm ? "text-green-600" : ""}>{bpm ? "✓" : "○"} Set tempo (BPM)</li>
              <li className={enabledInstruments.length > 0 ? "text-green-600" : ""}>
                {enabledInstruments.length > 0 ? "✓" : "○"} Select at least one instrument
              </li>
            </ul>
          </div>
        )}

        {/* Helper Text */}
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <strong>Tip:</strong> We'll auto-tune to key and arrange instruments to your tempo. Generation typically takes
          30-90 seconds depending on complexity.
        </div>
      </CardContent>
    </Card>
  )
}
