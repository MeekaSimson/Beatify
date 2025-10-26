import { type NextRequest, NextResponse } from "next/server"
import { saveUploadedFile } from "@/lib/fileUtils"
import { repository } from "@/lib/repository"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["audio/wav", "audio/mpeg", "audio/mp4", "audio/webm"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Please upload WAV, MP3, or M4A files." }, { status: 400 })
    }

    // Validate file size (20MB limit)
    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 20MB." }, { status: 400 })
    }

    // Save file and create track record
    const { filePath, trackId } = await saveUploadedFile(file)

    // Mock duration calculation (in production, use audio analysis library)
    const mockDuration = Math.floor(Math.random() * 180) + 30 // 30-210 seconds

    const track = {
      trackId,
      filename: file.name,
      durationSec: mockDuration,
      filePath,
      uploadedAt: new Date(),
      createdAt: new Date().toISOString(),
      jobs: [],
    }

    repository.createTrack(track)

    return NextResponse.json({
      trackId,
      originalFilename: file.name,
      durationSec: mockDuration,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
