"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Music2, Volume2, Settings2 } from "lucide-react"
import { useStudioStore } from "@/lib/store"
import type { InstrumentName } from "@/lib/types"

const INSTRUMENT_STYLES = {
  drums: ["pop", "rock", "jazz", "electronic", "acoustic", "lofi"],
  bass: ["pop", "rock", "funk", "electronic", "acoustic", "slap"],
  piano: ["pop", "classical", "jazz", "electronic", "ballad", "lofi"],
  guitar: ["pop", "rock", "acoustic", "electric", "clean", "distorted"],
  strings: ["orchestral", "pop", "cinematic", "chamber", "synthetic", "ambient"],
  synth: ["pop", "electronic", "retro", "ambient", "lead", "pad"],
}

const INSTRUMENT_ICONS = {
  drums: "🥁",
  bass: "🎸",
  piano: "🎹",
  guitar: "🎸",
  strings: "🎻",
  synth: "🎛️",
}

interface InstrumentSelectorProps {
  className?: string
}

export function InstrumentSelector({ className }: InstrumentSelectorProps) {
  const { instruments, updateInstrument } = useStudioStore()

  const enabledCount = instruments.filter((inst) => inst.enabled).length

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music2 className="h-5 w-5" />
            Instruments
          </div>
          <Badge variant="secondary">{enabledCount} selected</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {instruments.map((instrument) => (
          <div key={instrument.name} className="space-y-4">
            {/* Instrument Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={instrument.name}
                  checked={instrument.enabled}
                  onCheckedChange={(checked) => updateInstrument(instrument.name, { enabled: checked as boolean })}
                />
                <label
                  htmlFor={instrument.name}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <span className="text-lg">{INSTRUMENT_ICONS[instrument.name as InstrumentName]}</span>
                  {instrument.name.charAt(0).toUpperCase() + instrument.name.slice(1)}
                </label>
              </div>
              {instrument.enabled && (
                <Badge variant="outline" className="text-xs">
                  {instrument.style} • {instrument.complexity}/5
                </Badge>
              )}
            </div>

            {/* Instrument Controls */}
            {instrument.enabled && (
              <div className="ml-6 space-y-4 p-4 bg-muted/30 rounded-lg">
                {/* Volume Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Volume2 className="h-4 w-4" />
                      Volume
                    </div>
                    <span className="text-sm text-muted-foreground">{instrument.volume}%</span>
                  </div>
                  <Slider
                    value={[instrument.volume]}
                    onValueChange={(value) => updateInstrument(instrument.name, { volume: value[0] })}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Style Selection */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Settings2 className="h-4 w-4" />
                    Style
                  </div>
                  <Select
                    value={instrument.style}
                    onValueChange={(value) => updateInstrument(instrument.name, { style: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INSTRUMENT_STYLES[instrument.name as InstrumentName]?.map((style) => (
                        <SelectItem key={style} value={style}>
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Complexity Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Complexity</span>
                    <span className="text-sm text-muted-foreground">{instrument.complexity}/5</span>
                  </div>
                  <Slider
                    value={[instrument.complexity || 3]}
                    onValueChange={(value) => updateInstrument(instrument.name, { complexity: value[0] })}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Simple</span>
                    <span>Complex</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Helper Text */}
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <strong>Tip:</strong> Pick instruments and tweak their levels or styles. More instruments create richer
          arrangements but may take longer to generate.
        </div>
      </CardContent>
    </Card>
  )
}
