export type InstrumentName = "drums" | "bass" | "piano" | "guitar" | "strings" | "synth"

export interface InstrumentConfig {
  name: InstrumentName
  enabled: boolean
  volume: number // 0..100
  style?: string // "pop"|"rock"|"lofi"|...
  complexity?: number // 1..5
}

export interface TrackMeta {
  trackId: string
  filename: string
  durationSec?: number
  bpm?: number
  key?: string
  scale?: "major" | "minor"
  createdAt: string
  jobs: string[]
}

export interface JobStatus {
  jobId: string
  trackId: string
  status: "queued" | "processing" | "done" | "error"
  mixUrl?: string
  stems?: string[]
  error?: string
}

export interface UploadResponse {
  trackId: string
  originalFilename: string
  durationSec: number
}

export interface AnalyzeResponse {
  trackId: string
  bpm: number
  key: string
  scale: string
  confidence: {
    bpm: number
    key: number
  }
}

export interface GenerateResponse {
  jobId: string
  trackId: string
  status: string
}

export type StudioStatus = "idle" | "uploading" | "analyzing" | "generating" | "ready" | "error"
export type TimeSignature = "4/4" | "3/4" | "2/4" | "6/8"
