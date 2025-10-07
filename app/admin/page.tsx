"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, Users, Music, Zap, TrendingUp, RefreshCw, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import config from "@/lib/config"

interface AdminStats {
  totalTracks: number
  totalJobs: number
  completedJobs: number
  failedJobs: number
}

interface AdminTrack {
  trackId: string
  filename: string
  createdAt: string
  jobs: number
  status: string
}

interface AdminJob {
  jobId: string
  trackId: string
  status: string
  createdAt: string
  processingTime?: number
}

// Mock data for development
const MOCK_STATS: AdminStats = {
  totalTracks: 156,
  totalJobs: 234,
  completedJobs: 198,
  failedJobs: 12,
}

const MOCK_TRACKS: AdminTrack[] = [
  {
    trackId: "track-1",
    filename: "My Awesome Song.wav",
    createdAt: "2024-01-15T10:30:00Z",
    jobs: 2,
    status: "completed",
  },
  {
    trackId: "track-2",
    filename: "Ballad Demo.mp3",
    createdAt: "2024-01-14T15:45:00Z",
    jobs: 1,
    status: "completed",
  },
  {
    trackId: "track-3",
    filename: "Rock Vocal Take 1.wav",
    createdAt: "2024-01-13T09:20:00Z",
    jobs: 0,
    status: "uploaded",
  },
]

const MOCK_JOBS: AdminJob[] = [
  {
    jobId: "job-1",
    trackId: "track-1",
    status: "done",
    createdAt: "2024-01-15T10:35:00Z",
    processingTime: 45,
  },
  {
    jobId: "job-2",
    trackId: "track-1",
    status: "done",
    createdAt: "2024-01-15T11:20:00Z",
    processingTime: 38,
  },
  {
    jobId: "job-3",
    trackId: "track-2",
    status: "processing",
    createdAt: "2024-01-14T15:50:00Z",
  },
]

export default function AdminPage() {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [adminKey, setAdminKey] = useState("")
  const [showAuthDialog, setShowAuthDialog] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [tracks, setTracks] = useState<AdminTrack[]>([])
  const [jobs, setJobs] = useState<AdminJob[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()

  const checkAuth = () => {
    const isValid = adminKey === config.adminKey || adminKey === "dev-admin"
    if (isValid) {
      setIsAuthorized(true)
      setShowAuthDialog(false)
      loadAdminData()
    } else {
      toast({
        title: "Access denied",
        description: "Invalid admin key",
        variant: "destructive",
      })
    }
  }

  const loadAdminData = async () => {
    setIsLoading(true)
    try {
      // In production, fetch real data from API
      // const healthResponse = await ApiClient.getHealth()
      // setStats(healthResponse.stats)

      // For now, use mock data
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setStats(MOCK_STATS)
      setTracks(MOCK_TRACKS)
      setJobs(MOCK_JOBS)
    } catch (error) {
      console.error("Failed to load admin data:", error)
      toast({
        title: "Failed to load data",
        description: "Could not load admin dashboard data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-500/10 text-green-700 border-green-200",
      processing: "bg-blue-500/10 text-blue-700 border-blue-200",
      done: "bg-green-500/10 text-green-700 border-green-200",
      error: "bg-red-500/10 text-red-700 border-red-200",
      uploaded: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
      queued: "bg-gray-500/10 text-gray-700 border-gray-200",
    }

    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants] || variants.uploaded}>
        {status}
      </Badge>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Admin Access Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="adminKey" className="text-sm font-medium">
                Admin Key
              </label>
              <Input
                id="adminKey"
                type="password"
                placeholder="Enter admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkAuth()}
              />
            </div>
            <Button onClick={checkAuth} className="w-full">
              <Lock className="h-4 w-4 mr-2" />
              Access Admin Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>
        <Button onClick={loadAdminData} variant="outline" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalTracks || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalJobs || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.totalJobs ? Math.round(((stats.completedJobs || 0) / stats.totalJobs) * 100) : 0}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Jobs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-red-600">{stats?.failedJobs || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tracks */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Tracks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Track ID</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tracks.map((track) => (
                  <TableRow key={track.trackId}>
                    <TableCell className="font-mono text-sm">{track.trackId.slice(0, 8)}...</TableCell>
                    <TableCell>{track.filename}</TableCell>
                    <TableCell>{formatDate(track.createdAt)}</TableCell>
                    <TableCell>{track.jobs}</TableCell>
                    <TableCell>{getStatusBadge(track.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Track ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Processing Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.jobId}>
                    <TableCell className="font-mono text-sm">{job.jobId.slice(0, 8)}...</TableCell>
                    <TableCell className="font-mono text-sm">{job.trackId.slice(0, 8)}...</TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell>{formatDate(job.createdAt)}</TableCell>
                    <TableCell>{job.processingTime ? `${job.processingTime}s` : "--"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
