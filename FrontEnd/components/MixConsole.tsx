"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Volume2, Headphones, Download, RotateCcw, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StemTrack {
  id: string
  name: string
  url: string
  volume: number
  muted: boolean
  soloed: boolean
  pan: number
}

interface MixConsoleProps {
  stems?: StemTrack[]
  mixUrl?: string
  onRegenerate?: () => void
  onDownload?: () => void
  className?: string
}

const DEFAULT_STEMS: StemTrack[] = [
  { id: "vocals", name: "Vocals", url: "", volume: 85, muted: false, soloed: false, pan: 0 },
  { id: "drums", name: "Drums", url: "", volume: 80, muted: false, soloed: false, pan: 0 },
  { id: "bass", name: "Bass", url: "", volume: 75, muted: false, soloed: false, pan: 0 },
  { id: "piano", name: "Piano", url: "", volume: 65, muted: false, soloed: false, pan: -20 },
  { id: "guitar", name: "Guitar", url: "", volume: 70, muted: false, soloed: false, pan: 20 },
  { id: "strings", name: "Strings", url: "", volume: 60, muted: false, soloed: false, pan: 0 },
]

export function MixConsole({ stems = DEFAULT_STEMS, mixUrl, onRegenerate, onDownload, className }: MixConsoleProps) {
  const [tracks, setTracks] = useState<StemTrack[]>(stems)
  const [masterVolume, setMasterVolume] = useState(80)
  const [isPlaying, setIsPlaying] = useState(false)

  const { toast } = useToast()

  const updateTrack = (id: string, updates: Partial<StemTrack>) => {
    setTracks((prev) => prev.map((track) => (track.id === id ? { ...track, ...updates } : track)))
  }

  const toggleMute = (id: string) => {
    const track = tracks.find((t) => t.id === id)
    if (track) {
      updateTrack(id, { muted: !track.muted })
      toast({
        title: track.muted ? "Unmuted" : "Muted",
        description: `${track.name} ${track.muted ? "unmuted" : "muted"}`,
      })
    }
  }

  const toggleSolo = (id: string) => {
    const track = tracks.find((t) => t.id === id)
    if (track) {
      // If soloing, unsolo all others; if unsoloing, leave others as is
      if (!track.soloed) {
        setTracks((prev) => prev.map((t) => ({ ...t, soloed: t.id === id })))
      } else {
        updateTrack(id, { soloed: false })
      }
      toast({
        title: track.soloed ? "Unsolo" : "Solo",
        description: `${track.name} ${track.soloed ? "unsoloed" : "soloed"}`,
      })
    }
  }

  const resetMix = () => {
    setTracks(DEFAULT_STEMS)
    setMasterVolume(80)
    toast({
      title: "Mix reset",
      description: "All levels and settings restored to defaults",
    })
  }

  const handleDownload = () => {
    onDownload?.()
    toast({
      title: "Download started",
      description: "Your mixed track is being prepared for download",
    })
  }

  const soloedTracks = tracks.filter((t) => t.soloed)
  const hasSoloedTracks = soloedTracks.length > 0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Mix Console
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {tracks.filter((t) => !t.muted).length}/{tracks.length} active
            </Badge>
            {hasSoloedTracks && (
              <Badge variant="secondary" className="text-xs">
                {soloedTracks.length} solo
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Master</h3>
            <span className="text-sm text-muted-foreground">{masterVolume}%</span>
          </div>
          <Slider
            value={[masterVolume]}
            onValueChange={(value) => setMasterVolume(value[0])}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Individual Tracks */}
        <div className="space-y-4">
          <h3 className="font-medium">Stems</h3>
          {tracks.map((track) => (
            <div key={track.id} className="space-y-3 p-4 bg-muted/30 rounded-lg">
              {/* Track Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{track.name}</span>
                  {track.soloed && (
                    <Badge variant="secondary" className="text-xs">
                      SOLO
                    </Badge>
                  )}
                  {track.muted && (
                    <Badge variant="outline" className="text-xs">
                      MUTE
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">{track.volume}%</span>
              </div>

              {/* Volume Control */}
              <Slider
                value={[track.volume]}
                onValueChange={(value) => updateTrack(track.id, { volume: value[0] })}
                max={100}
                step={1}
                className="w-full"
                disabled={track.muted || (hasSoloedTracks && !track.soloed)}
              />

              {/* Pan Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Pan</span>
                  <span className="text-muted-foreground">
                    {track.pan === 0 ? "Center" : track.pan > 0 ? `${track.pan}R` : `${Math.abs(track.pan)}L`}
                  </span>
                </div>
                <Slider
                  value={[track.pan]}
                  onValueChange={(value) => updateTrack(track.id, { pan: value[0] })}
                  min={-50}
                  max={50}
                  step={5}
                  className="w-full"
                  disabled={track.muted || (hasSoloedTracks && !track.soloed)}
                />
              </div>

              {/* Mute/Solo Controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id={`mute-${track.id}`} checked={track.muted} onCheckedChange={() => toggleMute(track.id)} />
                  <label htmlFor={`mute-${track.id}`} className="text-sm font-medium">
                    Mute
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id={`solo-${track.id}`} checked={track.soloed} onCheckedChange={() => toggleSolo(track.id)} />
                  <label htmlFor={`solo-${track.id}`} className="text-sm font-medium">
                    Solo
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={resetMix} className="gap-2 bg-transparent">
            <RotateCcw className="h-4 w-4" />
            Reset Mix
          </Button>
          <Button variant="outline" onClick={onRegenerate} className="gap-2 bg-transparent">
            <Sparkles className="h-4 w-4" />
            Re-generate
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Headphones className="h-4 w-4" />
            Preview Mix
          </Button>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>

        {/* Helper Text */}
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <strong>Tip:</strong> Mix stems, fine-tune volumes, and download your track. Use solo to isolate instruments
          or mute to remove them from the mix.
        </div>
      </CardContent>
    </Card>
  )
}

export default MixConsole
