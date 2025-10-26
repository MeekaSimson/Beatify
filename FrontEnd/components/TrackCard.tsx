"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Play, Download, Share, Trash2, MoreVertical, Music, Clock, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ApiClient } from "@/lib/apiClient"
import type { TrackMeta } from "@/lib/types"

interface TrackCardProps {
  track: TrackMeta
  onDelete?: (trackId: string) => void
  onPlay?: (track: TrackMeta) => void
}

export function TrackCard({ track, onDelete, onPlay }: TrackCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { toast } = useToast()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "--:--"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handlePlay = () => {
    onPlay?.(track)
    toast({
      title: "Playing track",
      description: track.filename,
    })
  }

  const handleDownload = () => {
    // In production, this would trigger actual download
    toast({
      title: "Download started",
      description: `Downloading ${track.filename}`,
    })
  }

  const handleShare = () => {
    // Mock share functionality
    navigator.clipboard?.writeText(`https://beatify.app/track/${track.trackId}`)
    toast({
      title: "Link copied",
      description: "Track link copied to clipboard",
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await ApiClient.deleteTrack(track.trackId)
      onDelete?.(track.trackId)
      toast({
        title: "Track deleted",
        description: `${track.filename} has been deleted`,
      })
    } catch (error) {
      console.error("Delete failed:", error)
      toast({
        title: "Delete failed",
        description: "Could not delete the track. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const hasCompletedJobs = track.jobs.length > 0
  const statusColor = hasCompletedJobs ? "bg-green-500/10 text-green-700" : "bg-yellow-500/10 text-yellow-700"

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{track.filename}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(track.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(track.durationSec)}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePlay}>
                  <Play className="h-4 w-4 mr-2" />
                  Play
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Track Details */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="text-muted-foreground">BPM:</span>
              <span className="ml-2 font-medium">{track.bpm || "--"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Key:</span>
              <span className="ml-2 font-medium">
                {track.key && track.scale ? `${track.key} ${track.scale}` : "--"}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className={statusColor}>
              {hasCompletedJobs
                ? `${track.jobs.length} generation${track.jobs.length > 1 ? "s" : ""}`
                : "No generations"}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Music className="h-3 w-3" />
              {track.jobs.length} job{track.jobs.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handlePlay} size="sm" className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Play
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm" className="bg-transparent">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Track</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{track.filename}"? This action cannot be undone and will also delete all
              associated generated tracks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
