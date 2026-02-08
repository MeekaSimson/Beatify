"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Pause } from "lucide-react"

interface WavePlayerProps {
  audioUrl: string
  title?: string
}

export function WavePlayer({ audioUrl, title }: WavePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = new Audio()
    audio.src = audioUrl
    audio.preload = "metadata"

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0)
    }

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime)
    }

    audio.onended = () => {
      setIsPlaying(false)
    }

    audio.onerror = () => {
      console.error("Audio load failed:", audioUrl)
    }

    audioRef.current = audio

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [audioUrl])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Audio Preview"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Button onClick={togglePlay} size="icon">
            {isPlaying ? <Pause /> : <Play />}
          </Button>
          <div className="text-sm font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          step={0.01}
          onChange={(e) => {
            const t = Number(e.target.value)
            if (audioRef.current) audioRef.current.currentTime = t
            setCurrentTime(t)
          }}
          className="w-full"
        />
      </CardContent>
    </Card>
  )
}
