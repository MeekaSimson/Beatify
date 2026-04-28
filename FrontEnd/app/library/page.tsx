"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Filter, Music, Plus, SortAsc, SortDesc } from "lucide-react"
import { TrackCard } from "@/components/TrackCard"
import { WavePlayer } from "@/components/WavePlayer"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import type { TrackMeta } from "@/lib/types"

// Mock data for development
const MOCK_TRACKS: TrackMeta[] = [
  {
    trackId: "track-1",
    filename: "My Awesome Song.wav",
    durationSec: 180,
    bpm: 120,
    key: "C",
    scale: "major",
    createdAt: "2024-01-15T10:30:00Z",
    jobs: ["job-1", "job-2"],
  },
  {
    trackId: "track-2",
    filename: "Ballad Demo.mp3",
    durationSec: 240,
    bpm: 80,
    key: "G",
    scale: "minor",
    createdAt: "2024-01-14T15:45:00Z",
    jobs: ["job-3"],
  },
  {
    trackId: "track-3",
    filename: "Rock Vocal Take 1.wav",
    durationSec: 195,
    bpm: 140,
    key: "E",
    scale: "major",
    createdAt: "2024-01-13T09:20:00Z",
    jobs: [],
  },
  {
    trackId: "track-4",
    filename: "Jazz Improvisation.wav",
    durationSec: 320,
    bpm: 110,
    key: "F",
    scale: "major",
    createdAt: "2024-01-12T14:10:00Z",
    jobs: ["job-4", "job-5", "job-6"],
  },
]

type SortOption = "date-desc" | "date-asc" | "name-asc" | "name-desc" | "bpm-asc" | "bpm-desc"

export default function LibraryPage() {
  const [tracks, setTracks] = useState<TrackMeta[]>([])
  const [filteredTracks, setFilteredTracks] = useState<TrackMeta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("date-desc")
  const [filterKey, setFilterKey] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [currentTrack, setCurrentTrack] = useState<TrackMeta | null>(null)

  const { toast } = useToast()

  // Load tracks
  useEffect(() => {
    const loadTracks = async () => {
      setIsLoading(true)
      try {
        // In production, fetch from API
        // const response = await ApiClient.getAllTracks()
        // setTracks(response)

        // For now, use mock data
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate loading
        setTracks(MOCK_TRACKS)
      } catch (error) {
        console.error("Failed to load tracks:", error)
        toast({
          title: "Failed to load tracks",
          description: "Could not load your track library. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadTracks()
  }, [toast])

  // Filter and sort tracks
  useEffect(() => {
    let filtered = [...tracks]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((track) => track.filename.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Apply key filter
    if (filterKey !== "all") {
      filtered = filtered.filter((track) => track.key === filterKey)
    }

    // Apply status filter
    if (filterStatus !== "all") {
      if (filterStatus === "generated") {
        filtered = filtered.filter((track) => track.jobs.length > 0)
      } else if (filterStatus === "pending") {
        filtered = filtered.filter((track) => track.jobs.length === 0)
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "date-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "name-asc":
          return a.filename.localeCompare(b.filename)
        case "name-desc":
          return b.filename.localeCompare(a.filename)
        case "bpm-asc":
          return (a.bpm || 0) - (b.bpm || 0)
        case "bpm-desc":
          return (b.bpm || 0) - (a.bpm || 0)
        default:
          return 0
      }
    })

    setFilteredTracks(filtered)
  }, [tracks, searchQuery, sortBy, filterKey, filterStatus])

  const handleTrackDelete = (trackId: string) => {
    setTracks((prev) => prev.filter((track) => track.trackId !== trackId))
    if (currentTrack?.trackId === trackId) {
      setCurrentTrack(null)
    }
  }

  const handleTrackPlay = (track: TrackMeta) => {
    setCurrentTrack(track)
  }

  const uniqueKeys = Array.from(new Set(tracks.map((track) => track.key).filter(Boolean)))

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Library</h1>
          <p className="text-muted-foreground">
            {isLoading ? "Loading..." : `${filteredTracks.length} track${filteredTracks.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/studio">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Track
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tracks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">
                  <div className="flex items-center gap-2">
                    <SortDesc className="h-4 w-4" />
                    Newest First
                  </div>
                </SelectItem>
                <SelectItem value="date-asc">
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" />
                    Oldest First
                  </div>
                </SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="bpm-asc">BPM Low-High</SelectItem>
                <SelectItem value="bpm-desc">BPM High-Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Key Filter */}
            <Select value={filterKey} onValueChange={setFilterKey}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by key" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Keys</SelectItem>
                {uniqueKeys.map((key) => (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tracks</SelectItem>
                <SelectItem value="generated">With Generations</SelectItem>
                <SelectItem value="pending">Pending Generation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {(searchQuery || filterKey !== "all" || filterStatus !== "all") && (
            <div className="flex flex-wrap gap-2 mt-4">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery("")} className="ml-1 hover:bg-muted-foreground/20 rounded">
                    ×
                  </button>
                </Badge>
              )}
              {filterKey !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Key: {filterKey}
                  <button onClick={() => setFilterKey("all")} className="ml-1 hover:bg-muted-foreground/20 rounded">
                    ×
                  </button>
                </Badge>
              )}
              {filterStatus !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Status: {filterStatus}
                  <button onClick={() => setFilterStatus("all")} className="ml-1 hover:bg-muted-foreground/20 rounded">
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Playing Track */}
      {currentTrack && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Now Playing: {currentTrack.filename}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WavePlayer audioUrl={`/api/track/${currentTrack.trackId}/audio`} title={currentTrack.filename} />
          </CardContent>
        </Card>
      )}

      {/* Track Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTracks.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {tracks.length === 0 ? "No tracks yet" : "No tracks match your filters"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {tracks.length === 0
                ? "Create your first track to get started with Beatify."
                : "Try adjusting your search or filter criteria."}
            </p>
            {tracks.length === 0 && (
              <Link href="/studio">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Track
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTracks.map((track) => (
            <TrackCard key={track.trackId} track={track} onDelete={handleTrackDelete} onPlay={handleTrackPlay} />
          ))}
        </div>
      )}
    </div>
  )
}
