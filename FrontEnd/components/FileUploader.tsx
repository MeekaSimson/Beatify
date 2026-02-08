"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, File, X, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// ---------------- TYPES ----------------
interface AnalysisResult {
  notes: Array<{
    pitch: number
    startTime: number
    endTime: number
    duration: number
    velocity: number
  }>
  noteCount: number
  key: string
  scale: string
  keyConfidence: number
  bpm: number
  tempoConfidence: number
  duration: number
}

interface FileUploaderProps {
  onFileSelect: (file: File, duration: number, audioUrl: string) => void
  onAnalysisComplete?: (results: AnalysisResult) => void
  className?: string
}

export function FileUploader({
  onFileSelect,
  onAnalysisComplete,
  className,
}: FileUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null)

  const { toast } = useToast()
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

  // ---------------- HELPERS ----------------
  const getAudioDuration = (file: File): Promise<number> =>
    new Promise((resolve, reject) => {
      const audio = new Audio()
      const url = URL.createObjectURL(file)

      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url)
        resolve(audio.duration)
      }

      audio.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error("Failed to load audio"))
      }

      audio.src = url
    })

  // ---------------- BACKEND FLOW ----------------
  const analyzeAudioFile = async (file: File) => {
    setIsAnalyzing(true)

    try {
      // 1️⃣ UPLOAD
      const uploadForm = new FormData()
      uploadForm.append("audio", file)

      const uploadRes = await fetch(`${API_BASE_URL}/api/audio/upload`, {
        method: "POST",
        body: uploadForm,
      })

      if (!uploadRes.ok) throw new Error("Upload failed")

      const uploadData = await uploadRes.json()
      const filePath: string = uploadData.filePath

      // 2️⃣ ANALYZE
      const analyzeRes = await fetch(`${API_BASE_URL}/api/audio/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      })

      const analyzeData = await analyzeRes.json()

      if (!analyzeRes.ok || !analyzeData.success) {
        throw new Error(analyzeData.error || "Analysis failed")
      }

      return { analysis: analyzeData.analysis, filePath }
    } finally {
      setIsAnalyzing(false)
    }
  }

  // ---------------- FILE PROCESS ----------------
  const processFile = async (file: File) => {
    setIsProcessing(true)
    setUploadProgress(0)

    try {
      const duration = await getAudioDuration(file)

      const progressTimer = setInterval(() => {
        setUploadProgress((p) => (p < 90 ? p + 10 : p))
      }, 100)

      const result = await analyzeAudioFile(file)

      clearInterval(progressTimer)
      setUploadProgress(100)

      if (!result) return

      const { analysis, filePath } = result

      // ✅ BUILD PUBLIC AUDIO URL
      const filename = filePath.split("/").pop()
      const audioUrl = `${API_BASE_URL}/uploads/${filename}`

      setAnalysisResults(analysis)
      onAnalysisComplete?.(analysis)
      onFileSelect(file, duration, audioUrl)

      toast({
        title: "Analysis complete 🎉",
        description: `${analysis.key} ${analysis.scale} • ${analysis.bpm} BPM`,
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // ---------------- DROPZONE ----------------
  const onDrop = useCallback(
    (files: File[]) => {
      if (!files[0]) return
      setSelectedFile(files[0])
      processFile(files[0])
    },
    [],
  )

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      "audio/*": [".wav", ".mp3", ".m4a", ".ogg", ".flac"],
    },
    disabled: isProcessing || isAnalyzing,
  })

  const clearFile = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setAnalysisResults(null)
  }

  // ---------------- UI ----------------
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Upload Audio</CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedFile ? (
          <div {...getRootProps()} className="border-dashed border p-8 text-center cursor-pointer">
            <input {...getInputProps()} />
            <Upload className="mx-auto mb-4" />
            <p>Drag & drop or click to upload</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <span>{selectedFile.name}</span>
              <Button variant="ghost" onClick={clearFile}>
                <X />
              </Button>
            </div>

            {(isProcessing || isAnalyzing) && <Progress value={uploadProgress} />}

            {analysisResults && (
              <div
                  className="
                  mt-4 p-3 rounded border
                  bg-green-50 dark:bg-green-900/30
                  border-green-200 dark:border-green-700
                  text-green-900 dark:text-green-100
                  font-semibold
                  ">
                  <CheckCircle className="inline mr-2 text-green-600 dark:text-green-400" />
                  {analysisResults.key} {analysisResults.scale} • {analysisResults.bpm} BPM
              </div>
            )}

          </>
        )}
      </CardContent>
    </Card>
  )
}
