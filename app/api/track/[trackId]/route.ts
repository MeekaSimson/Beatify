import { type NextRequest, NextResponse } from "next/server"
import { repository } from "@/lib/repository"
import { deleteTrackFiles } from "@/lib/fileUtils"

export async function GET(request: NextRequest, { params }: { params: { trackId: string } }) {
  try {
    const { trackId } = params

    const track = repository.getTrack(trackId)
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    return NextResponse.json({
      trackId: track.trackId,
      filename: track.filename,
      durationSec: track.durationSec,
      bpm: track.bpm,
      key: track.key,
      scale: track.scale,
      createdAt: track.createdAt,
      jobs: track.jobs,
    })
  } catch (error) {
    console.error("Track get error:", error)
    return NextResponse.json({ error: "Failed to get track" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { trackId: string } }) {
  try {
    const { trackId } = params

    const track = repository.getTrack(trackId)
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    // Delete associated files
    await deleteTrackFiles(track.filePath, track.jobs)

    // Delete from repository
    repository.deleteTrack(trackId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Track delete error:", error)
    return NextResponse.json({ error: "Failed to delete track" }, { status: 500 })
  }
}
