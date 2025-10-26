// In-memory repository for development
// TODO: Replace with MongoDB/PostgreSQL for production

import type { TrackMeta, JobStatus, InstrumentConfig } from "./types"

interface InMemoryTrack extends TrackMeta {
  filePath: string
  uploadedAt: Date
}

interface InMemoryJob extends JobStatus {
  createdAt: Date
  updatedAt: Date
  trackId: string
  bpm: number
  key: string
  scale: string
  instruments: InstrumentConfig[]
}

class InMemoryRepository {
  private tracks = new Map<string, InMemoryTrack>()
  private jobs = new Map<string, InMemoryJob>()

  // Track operations
  createTrack(track: InMemoryTrack): void {
    this.tracks.set(track.trackId, track)
  }

  getTrack(trackId: string): InMemoryTrack | null {
    return this.tracks.get(trackId) || null
  }

  getAllTracks(): InMemoryTrack[] {
    return Array.from(this.tracks.values()).sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
  }

  updateTrack(trackId: string, updates: Partial<InMemoryTrack>): boolean {
    const track = this.tracks.get(trackId)
    if (!track) return false

    this.tracks.set(trackId, { ...track, ...updates })
    return true
  }

  deleteTrack(trackId: string): boolean {
    return this.tracks.delete(trackId)
  }

  // Job operations
  createJob(job: InMemoryJob): void {
    this.jobs.set(job.jobId, job)
  }

  getJob(jobId: string): InMemoryJob | null {
    return this.jobs.get(jobId) || null
  }

  updateJob(jobId: string, updates: Partial<InMemoryJob>): boolean {
    const job = this.jobs.get(jobId)
    if (!job) return false

    this.jobs.set(jobId, { ...job, ...updates, updatedAt: new Date() })
    return true
  }

  getJobsByTrack(trackId: string): InMemoryJob[] {
    return Array.from(this.jobs.values()).filter((job) => job.trackId === trackId)
  }

  // Stats for admin
  getStats() {
    return {
      totalTracks: this.tracks.size,
      totalJobs: this.jobs.size,
      completedJobs: Array.from(this.jobs.values()).filter((j) => j.status === "done").length,
      failedJobs: Array.from(this.jobs.values()).filter((j) => j.status === "error").length,
    }
  }
}

export const repository = new InMemoryRepository()
