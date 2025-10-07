import { type NextRequest, NextResponse } from "next/server"
import { repository } from "@/lib/repository"

export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const { jobId } = params

    const job = repository.getJob(jobId)
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({
      jobId: job.jobId,
      status: job.status,
      mixUrl: job.mixUrl,
      stems: job.stems,
      error: job.error,
    })
  } catch (error) {
    console.error("Job status error:", error)
    return NextResponse.json({ error: "Failed to get job status" }, { status: 500 })
  }
}
