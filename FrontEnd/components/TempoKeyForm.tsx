"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Music, Settings } from "lucide-react"
import { useStudioStore } from "@/lib/store"
import type { TimeSignature } from "@/lib/types"

const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
const SCALES = ["major", "minor"] as const

const tempoKeySchema = z.object({
  bpm: z.number().min(60).max(200),
  timeSig: z.enum(["4/4", "3/4", "2/4", "6/8"]),
  key: z.string().optional(),
  scale: z.enum(["major", "minor"]).optional(),
  autoDetect: z.boolean(),
})

type TempoKeyFormData = z.infer<typeof tempoKeySchema>

interface TempoKeyFormProps {
  onAnalyze?: () => void
  className?: string
}

export function TempoKeyForm({ onAnalyze, className }: TempoKeyFormProps) {
  const { bpm, timeSig, key, scale, setBpm, setTimeSig, setKey, setScale } = useStudioStore()

  const form = useForm<TempoKeyFormData>({
    resolver: zodResolver(tempoKeySchema),
    defaultValues: {
      bpm,
      timeSig,
      key: key || undefined,
      scale: scale || undefined,
      autoDetect: !key || !scale,
    },
  })

  const autoDetect = form.watch("autoDetect")

  const onSubmit = (data: TempoKeyFormData) => {
    setBpm(data.bpm)
    setTimeSig(data.timeSig as TimeSignature)

    if (!data.autoDetect) {
      setKey(data.key || null)
      setScale(data.scale || null)
    } else {
      setKey(null)
      setScale(null)
      onAnalyze?.()
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Tempo & Key Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* BPM Slider */}
            <FormField
              control={form.control}
              name="bpm"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Tempo (BPM)</FormLabel>
                    <span className="text-sm text-muted-foreground">{field.value}</span>
                  </div>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      min={60}
                      max={200}
                      step={1}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Signature */}
            <FormField
              control={form.control}
              name="timeSig"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Signature</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time signature" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="4/4">4/4 (Common Time)</SelectItem>
                      <SelectItem value="3/4">3/4 (Waltz)</SelectItem>
                      <SelectItem value="2/4">2/4 (March)</SelectItem>
                      <SelectItem value="6/8">6/8 (Compound)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Auto-detect Toggle */}
            <FormField
              control={form.control}
              name="autoDetect"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Auto-detect Key & Scale</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Let AI analyze your vocal to determine the musical key
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Manual Key/Scale Selection */}
            {!autoDetect && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select key" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {KEYS.map((k) => (
                            <SelectItem key={k} value={k}>
                              {k}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scale</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select scale" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="major">Major</SelectItem>
                          <SelectItem value="minor">Minor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <Button type="submit" className="w-full">
              <Music className="h-4 w-4 mr-2" />
              {autoDetect ? "Analyze & Set Parameters" : "Update Settings"}
            </Button>
          </form>
        </Form>

        {/* Helper Text */}
        <div className="mt-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <strong>Tip:</strong> Use the slider to set BPM & select time signature. Optional: choose key/scale or let AI
          infer it from your vocal.
        </div>
      </CardContent>
    </Card>
  )
}
