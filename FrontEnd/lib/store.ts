import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { InstrumentConfig, StudioStatus, TimeSignature } from "./types"

interface StudioState {
  // Vocal file state
  vocalFile: File | null
  vocalUrl: string | null
  durationSec: number | null

  // Musical parameters
  bpm: number
  timeSig: TimeSignature
  key: string | null
  scale: "major" | "minor" | null

  // Instruments configuration
  instruments: InstrumentConfig[]

  // Job state
  jobId: string | null
  status: StudioStatus

  // Actions
  setVocalFile: (file: File | null, url?: string | null, duration?: number | null) => void
  setBpm: (bpm: number) => void
  setTimeSig: (timeSig: TimeSignature) => void
  setKey: (key: string | null) => void
  setScale: (scale: "major" | "minor" | null) => void
  setInstruments: (instruments: InstrumentConfig[]) => void
  updateInstrument: (name: string, updates: Partial<InstrumentConfig>) => void
  setJobId: (jobId: string | null) => void
  setStatus: (status: StudioStatus) => void
  reset: () => void
}

const defaultInstruments: InstrumentConfig[] = [
  { name: "drums", enabled: true, volume: 80, style: "pop", complexity: 3 },
  { name: "bass", enabled: true, volume: 70, style: "pop", complexity: 3 },
  { name: "piano", enabled: false, volume: 60, style: "pop", complexity: 2 },
  { name: "guitar", enabled: false, volume: 65, style: "pop", complexity: 3 },
  { name: "strings", enabled: false, volume: 50, style: "pop", complexity: 2 },
  { name: "synth", enabled: false, volume: 55, style: "pop", complexity: 2 },
]

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      // Initial state
      vocalFile: null,
      vocalUrl: null,
      durationSec: null,
      bpm: 120,
      timeSig: "4/4",
      key: null,
      scale: null,
      instruments: defaultInstruments,
      jobId: null,
      status: "idle",

      // Actions
      setVocalFile: (file, url = null, duration = null) =>
        set({ vocalFile: file, vocalUrl: url, durationSec: duration }),

      setBpm: (bpm) => set({ bpm }),
      setTimeSig: (timeSig) => set({ timeSig }),
      setKey: (key) => set({ key }),
      setScale: (scale) => set({ scale }),
      setInstruments: (instruments) => set({ instruments }),

      updateInstrument: (name, updates) =>
        set((state) => ({
          instruments: state.instruments.map((inst) => (inst.name === name ? { ...inst, ...updates } : inst)),
        })),

      setJobId: (jobId) => set({ jobId }),
      setStatus: (status) => set({ status }),

      reset: () =>
        set({
          vocalFile: null,
          vocalUrl: null,
          durationSec: null,
          jobId: null,
          status: "idle",
        }),
    }),
    {
      name: "beatify-studio",
      partialize: (state) => ({
        bpm: state.bpm,
        timeSig: state.timeSig,
        key: state.key,
        scale: state.scale,
        instruments: state.instruments,
      }),
    },
  ),
)
