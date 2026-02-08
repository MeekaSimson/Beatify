import { type NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const UPLOAD_DIR = "/tmp/beatify-uploads"
const OUTPUT_DIR = "/tmp/beatify-outputs"

export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const { filename } = params

    // Security: prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
    }

    // Try upload directory first, then output directory
    let filePath = path.join(UPLOAD_DIR, filename)
    if (!existsSync(filePath)) {
      filePath = path.join(OUTPUT_DIR, filename)
    }

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const fileBuffer = await readFile(filePath)
    const contentType = filename.endsWith(".wav") ? "audio/wav" : "audio/mpeg"

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("File serve error:", error)
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 })
  }
}
