"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Pause, RotateCcw } from "lucide-react"
import { useStudioStore } from "@/lib/store"

const PRESET_TEMPOS = [
  { name: "Ballad", bpm: 70 },
  { name: "Pop", bpm: 120 },
  { name: "Rock", bpm: 140 },
  { name: "Dance", bpm: 128 },
  { name: "Hip Hop", bpm: 90 },
]

interface MetronomeProps {
  className?: string
}

export function Metronome({ className }: MetronomeProps) {
  const { bpm, timeSig, setBpm, setTimeSig } = useStudioStore()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentBeat, setCurrentBeat] = useState(0)
  const [tapTimes, setTapTimes] = useState<number[]>([])

  const audioContextRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const nextBeatTimeRef = useRef(0)

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new AudioContext()
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const playClick = useCallback((isAccent = false) => {
    if (!audioContextRef.current) return

    const oscillator = audioContextRef.current.createOscillator()
    const gainNode = audioContextRef.current.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContextRef.current.destination)

    oscillator.frequency.value = isAccent ? 800 : 400
    oscillator.type = "square"

    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1)

    oscillator.start(audioContextRef.current.currentTime)
    oscillator.stop(audioContextRef.current.currentTime + 0.1)
  }, [])

  const startMetronome = useCallback(() => {
    if (!audioContextRef.current) return

    setIsPlaying(true)
    setCurrentBeat(0)
    nextBeatTimeRef.current = audioContextRef.current.currentTime

    const beatsPerMeasure = Number.parseInt(timeSig.split("/")[0])
    const beatInterval = 60 / bpm

    const scheduleBeat = () => {
      if (!audioContextRef.current) return

      const currentTime = audioContextRef.current.currentTime

      // Schedule beats slightly ahead
      while (nextBeatTimeRef.current < currentTime + 0.1) {
        const isAccent = currentBeat === 0

        // Schedule the click sound
        const oscillator = audioContextRef.current.createOscillator()
        const gainNode = audioContextRef.current.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContextRef.current.destination)

        oscillator.frequency.value = isAccent ? 800 : 400
        oscillator.type = "square"

        gainNode.gain.setValueAtTime(0, nextBeatTimeRef.current)
        gainNode.gain.setValueAtTime(0.1, nextBeatTimeRef.current + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.01, nextBeatTimeRef.current + 0.1)

        oscillator.start(nextBeatTimeRef.current)
        oscillator.stop(nextBeatTimeRef.current + 0.1)

        // Update beat counter
        setCurrentBeat((prev) => (prev + 1) % beatsPerMeasure)
        nextBeatTimeRef.current += beatInterval
      }
    }

    intervalRef.current = setInterval(scheduleBeat, 25)
  }, [bpm, timeSig, currentBeat])

  const stopMetronome = useCallback(() => {
    setIsPlaying(false)
    setCurrentBeat(0)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [])

  const handleTapTempo = () => {
    const now = Date.now()
    const newTapTimes = [...tapTimes, now].slice(-4) // Keep last 4 taps

    if (newTapTimes.length >= 2) {
      const intervals = []
      for (let i = 1; i < newTapTimes.length; i++) {
        intervals.push(newTapTimes[i] - newTapTimes[i - 1])
      }
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
      const calculatedBpm = Math.round(60000 / avgInterval)

      if (calculatedBpm >= 60 && calculatedBpm <= 200) {
        setBpm(calculatedBpm)
      }
    }

    setTapTimes(newTapTimes)

    // Clear tap times after 3 seconds of inactivity
    setTimeout(() => {
      setTapTimes((current) => current.filter((time) => now - time < 3000))
    }, 3000)
  }

  const beatsPerMeasure = Number.parseInt(timeSig.split("/")[0])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Metronome</span>
          <div className="text-sm font-normal text-muted-foreground">
            {bpm} BPM • {timeSig}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={isPlaying ? stopMetronome : startMetronome}
            size="lg"
            variant={isPlaying ? "destructive" : "default"}
            className="gap-2"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? "Stop" : "Start"}
          </Button>

          <Button onClick={handleTapTempo} variant="outline" size="lg" className="gap-2 bg-transparent">
            <RotateCcw className="h-4 w-4" />
            Tap Tempo
          </Button>
        </div>

        {/* Beat Indicator */}
        {isPlaying && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: beatsPerMeasure }, (_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-colors ${
                  i === currentBeat ? "bg-primary border-primary" : "bg-background border-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        )}

        {/* BPM Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Tempo (BPM)</label>
            <span className="text-sm text-muted-foreground">{bpm}</span>
          </div>
          <Slider
            value={[bpm]}
            onValueChange={(value) => setBpm(value[0])}
            min={60}
            max={200}
            step={1}
            className="w-full"
          />
        </div>

        {/* Preset Tempos */}
        <div className="grid grid-cols-2 gap-2">
          {PRESET_TEMPOS.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              onClick={() => setBpm(preset.bpm)}
              className={bpm === preset.bpm ? "bg-primary/10 border-primary" : ""}
            >
              {preset.name} ({preset.bpm})
            </Button>
          ))}
        </div>

        {/* Time Signature */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Time Signature</label>
          <Select value={timeSig} onValueChange={(value: any) => setTimeSig(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4/4">4/4 (Common Time)</SelectItem>
              <SelectItem value="3/4">3/4 (Waltz)</SelectItem>
              <SelectItem value="2/4">2/4 (March)</SelectItem>
              <SelectItem value="6/8">6/8 (Compound)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
