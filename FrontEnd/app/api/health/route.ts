import { NextResponse } from "next/server"
import { repository } from "@/lib/repository"

export async function GET() {
  try {
    const stats = repository.getStats()

    return NextResponse.json({
      ok: true,
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      stats,
    })
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        ok: false,
        error: "Health check failed",
      },
      { status: 500 },
    )
  }
}
