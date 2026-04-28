"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, File, X, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// ✨ NEW: Add TypeScript interface for analysis results
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
  onFileSelect: (file: File, duration: number) => void
  // ✨ NEW: Add callback for analysis results
  onAnalysisComplete?: (results: AnalysisResult) => void
  className?: string
}

export function FileUploader({ onFileSelect, onAnalysisComplete, className }: FileUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileInfo, setFileInfo] = useState<{ duration: number; size: string } | null>(null)
  // ✨ NEW: Add state for analysis results
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const { toast } = useToast()

  // ✨ NEW: Backend API configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      const url = URL.createObjectURL(file)

      audio.addEventListener("loadedmetadata", () => {
        URL.revokeObjectURL(url)
        resolve(audio.duration)
      })

      audio.addEventListener("error", () => {
        URL.revokeObjectURL(url)
        reject(new Error("Could not load audio file"))
      })

      audio.src = url
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // ✨ NEW: Function to send file to backend for analysis
  const analyzeAudioFile = async (file: File): Promise<AnalysisResult | null> => {
    setIsAnalyzing(true)

    try {
      console.log('🎵 Sending file to backend for analysis:', file.name)
      
      // Create FormData
      const formData = new FormData()
      formData.append('audio', file)

      // Call backend API
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      })

      // Parse response
      const data = await response.json()
      console.log('📊 Received analysis results:', data)

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Analysis failed')
      }

      // Return the analysis data
      return data.analysis

    } catch (error) {
      console.error('❌ Analysis error:', error)
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Could not analyze audio file",
        variant: "destructive",
      })
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }

  const processFile = async (file: File) => {
    setIsProcessing(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      const duration = await getAudioDuration(file)

      clearInterval(progressInterval)
      setUploadProgress(100)

      setFileInfo({
        duration,
        size: formatFileSize(file.size),
      })

      // ✨ NEW: Analyze the file with backend
      const analysisData = await analyzeAudioFile(file)
      
      if (analysisData) {
        setAnalysisResults(analysisData)
        
        // Call the parent callback if provided
        if (onAnalysisComplete) {
          onAnalysisComplete(analysisData)
        }

        toast({
          title: "Analysis complete! 🎉",
          description: `${file.name} - ${analysisData.bpm} BPM, ${analysisData.key} ${analysisData.scale}`,
        })
      }

      setTimeout(() => {
        onFileSelect(file, duration)
        setIsProcessing(false)
      }, 500)

    } catch (error) {
      console.error("Error processing file:", error)
      setIsProcessing(false)
      setUploadProgress(0)
      toast({
        title: "Upload failed",
        description: "Could not process the audio file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      // Validate file size (50MB limit - increased for audio files)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 50MB.",
          variant: "destructive",
        })
        return
      }

      setSelectedFile(file)
      processFile(file)
    },
    [onFileSelect, toast],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/wav": [".wav"],
      "audio/mpeg": [".mp3"],
      "audio/mp4": [".m4a"],
      "audio/ogg": [".ogg"],
      "audio/flac": [".flac"],
    },
    maxFiles: 1,
    disabled: isProcessing || isAnalyzing,
  })

  const clearFile = () => {
    setSelectedFile(null)
    setFileInfo(null)
    setUploadProgress(0)
    setAnalysisResults(null)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Audio File
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedFile ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg">Drop your audio file here...</p>
            ) : (
              <div className="space-y-2">
                <p className="text-lg">Drag & drop your audio file here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
                <p className="text-xs text-muted-foreground">Supports WAV, MP3, M4A, OGG, FLAC (max 50MB)</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <File className="h-8 w-8 text-primary" />
                <div>
                  <div className="font-medium">{selectedFile.name}</div>
                  {fileInfo && (
                    <div className="text-sm text-muted-foreground">
                      {fileInfo.size} • {formatDuration(fileInfo.duration)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isProcessing || isAnalyzing ? (
                  <div className="text-sm text-muted-foreground">
                    {isAnalyzing ? 'Analyzing...' : 'Processing...'}
                  </div>
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                <Button variant="ghost" size="sm" onClick={clearFile} disabled={isProcessing || isAnalyzing}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Upload Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* ✨ NEW: Analysis Progress */}
            {isAnalyzing && (
              <div className="space-y-2">
                <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm font-medium text-blue-900">🎵 Analyzing audio...</div>
                    <div className="text-xs text-blue-600 mt-1">This may take 2-5 seconds</div>
                  </div>
                </div>
              </div>
            )}

            {/* ✨ NEW: Analysis Results Display */}
            {analysisResults && !isAnalyzing && (
              <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="font-semibold text-green-900 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Analysis Complete!
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Tempo</div>
                    <div className="font-medium">{analysisResults.bpm} BPM</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Key</div>
                    <div className="font-medium">{analysisResults.key} {analysisResults.scale}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Confidence</div>
                    <div className="font-medium">{(analysisResults.keyConfidence * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Notes</div>
                    <div className="font-medium">{analysisResults.noteCount} detected</div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Another File */}
            {!isProcessing && !isAnalyzing && (
              <Button variant="outline" onClick={clearFile} className="w-full bg-transparent">
                Upload Different File
              </Button>
            )}
          </div>
        )}

        {/* Helper Text */}
        <div className="mt-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <strong>Tip:</strong> Upload a clean vocal recording (WAV/MP3). For best results, record with our metronome
          for consistent timing.
        </div>
      </CardContent>
    </Card>
  )
}