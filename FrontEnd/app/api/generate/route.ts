import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { repository } from "@/lib/repository"
import { createMockOutputFiles } from "@/lib/fileUtils"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackId, bpm, key, scale, instruments } = body

    if (!trackId || !bpm || !key || !scale || !instruments) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const track = repository.getTrack(trackId)
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    const jobId = uuidv4()

    // Create job record
    const job = {
      jobId,
      trackId,
      status: "queued" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      bpm,
      key,
      scale,
      instruments,
    }

    repository.createJob(job)

    // Add job to track
    repository.updateTrack(trackId, {
      jobs: [...track.jobs, jobId],
    })

    // Start background processing (simulate with timeout)
    processGenerationJob(jobId)

    return NextResponse.json({
      jobId,
      trackId,
      status: "queued",
    })
  } catch (error) {
    console.error("Generation error:", error)
    return NextResponse.json({ error: "Generation failed" }, { status: 500 })
  }
}

async function processGenerationJob(jobId: string) {
  try {
    // Update status to processing
    repository.updateJob(jobId, { status: "processing" })

    // Simulate processing time based on complexity
    const job = repository.getJob(jobId)
    if (!job) return

    const processingTime = 2000 + job.instruments.length * 1000 // 2-8 seconds
    await new Promise((resolve) => setTimeout(resolve, processingTime))

    // Create mock output files
    const { mixPath, stemPaths } = await createMockOutputFiles(jobId)

    // Update job with results
    repository.updateJob(jobId, {
      status: "done",
      mixUrl: `/api/job/${jobId}/mix.wav`,
      stems: stemPaths.map((_, index) => `/api/job/${jobId}/stem-${index}.wav`),
    })
  } catch (error) {
    console.error("Job processing error:", error)
    repository.updateJob(jobId, {
      status: "error",
      error: "Processing failed",
    })
  }
}
