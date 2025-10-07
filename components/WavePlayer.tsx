"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react"

interface WavePlayerProps {
  audioUrl?: string
  title?: string
  className?: string
}

export function WavePlayer({ audioUrl, title = "Audio Player", className }: WavePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(75)
  const [isLoading, setIsLoading] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)

  // Initialize audio element
  useEffect(() => {
    if (audioUrl) {
      setIsLoading(true)
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration)
        setIsLoading(false)
      })

      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime)
      })

      audio.addEventListener("ended", () => {
        setIsPlaying(false)
        setCurrentTime(0)
      })

      audio.addEventListener("error", () => {
        setIsLoading(false)
        console.error("Error loading audio")
      })

      return () => {
        audio.pause()
        audio.src = ""
      }
    }
  }, [audioUrl])

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  // Draw waveform visualization
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = () => {
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)

      // Draw waveform background
      ctx.fillStyle = "hsl(var(--muted))"
      ctx.fillRect(0, 0, width, height)

      // Draw progress
      if (duration > 0) {
        const progress = currentTime / duration
        ctx.fillStyle = "hsl(var(--primary))"
        ctx.fillRect(0, 0, width * progress, height)
      }

      // Draw waveform bars (mock visualization)
      ctx.fillStyle = "hsl(var(--foreground))"
      const barWidth = 2
      const barSpacing = 1
      const numBars = Math.floor(width / (barWidth + barSpacing))

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + barSpacing)
        const barHeight = Math.random() * height * 0.8 + height * 0.1
        const y = (height - barHeight) / 2
        ctx.fillRect(x, y, barWidth, barHeight)
      }

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(draw)
      }
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, currentTime, duration])

  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    if (!audioRef.current || duration === 0) return

    const newTime = (value[0] / 100) * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const skipBackward = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.max(0, currentTime - 10)
  }

  const skipForward = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.min(duration, currentTime + 10)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Waveform Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={80}
            className="w-full h-20 rounded border cursor-pointer"
            onClick={(e) => {
              if (!duration) return
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const percentage = (x / rect.width) * 100
              handleSeek([percentage])
            }}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded">
              <div className="text-sm text-muted-foreground">Loading audio...</div>
            </div>
          )}
        </div>

        {/* Progress Slider */}
        <div className="space-y-2">
          <Slider
            value={[progressPercentage]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full"
            disabled={!audioUrl || duration === 0}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={skipBackward} disabled={!audioUrl}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button onClick={togglePlayPause} disabled={!audioUrl || isLoading} className="gap-2">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <Button variant="outline" size="sm" onClick={skipForward} disabled={!audioUrl}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[volume]}
            onValueChange={(value) => setVolume(value[0])}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground w-8">{volume}%</span>
        </div>
      </CardContent>
    </Card>
  )
}
