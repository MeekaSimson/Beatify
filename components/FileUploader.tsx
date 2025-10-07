"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, File, X, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FileUploaderProps {
  onFileSelect: (file: File, duration: number) => void
  className?: string
}

export function FileUploader({ onFileSelect, className }: FileUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileInfo, setFileInfo] = useState<{ duration: number; size: string } | null>(null)

  const { toast } = useToast()

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

      setTimeout(() => {
        onFileSelect(file, duration)
        setIsProcessing(false)
        toast({
          title: "File uploaded successfully",
          description: `${file.name} (${formatDuration(duration)})`,
        })
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

      // Validate file size (20MB limit)
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 20MB.",
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
    },
    maxFiles: 1,
    disabled: isProcessing,
  })

  const clearFile = () => {
    setSelectedFile(null)
    setFileInfo(null)
    setUploadProgress(0)
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
                <p className="text-xs text-muted-foreground">Supports WAV, MP3, M4A (max 20MB)</p>
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
                {isProcessing ? (
                  <div className="text-sm text-muted-foreground">Processing...</div>
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                <Button variant="ghost" size="sm" onClick={clearFile} disabled={isProcessing}>
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

            {/* Upload Another File */}
            {!isProcessing && (
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
