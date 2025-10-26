import axios from "axios"
import type { UploadResponse, AnalyzeResponse, GenerateResponse, JobStatus, TrackMeta, InstrumentConfig } from "./types"

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
})

export class ApiClient {
  static async uploadTrack(file: File): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append("file", file)

    const response = await api.post<UploadResponse>("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })

    return response.data
  }

  static async analyzeTrack(trackId: string, bpm?: number, key?: string, scale?: string): Promise<AnalyzeResponse> {
    const response = await api.post<AnalyzeResponse>("/analyze", {
      trackId,
      bpm,
      key,
      scale,
    })

    return response.data
  }

  static async generateAccompaniment(
    trackId: string,
    bpm: number,
    key: string,
    scale: string,
    instruments: InstrumentConfig[],
  ): Promise<GenerateResponse> {
    const response = await api.post<GenerateResponse>("/generate", {
      trackId,
      bpm,
      key,
      scale,
      instruments,
    })

    return response.data
  }

  static async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await api.get<JobStatus>(`/job/${jobId}`)
    return response.data
  }

  static async getTrack(trackId: string): Promise<TrackMeta> {
    const response = await api.get<TrackMeta>(`/track/${trackId}`)
    return response.data
  }

  static async deleteTrack(trackId: string): Promise<void> {
    await api.delete(`/track/${trackId}`)
  }

  static async getHealth(): Promise<{ ok: boolean; version: string }> {
    const response = await api.get("/health")
    return response.data
  }
}
