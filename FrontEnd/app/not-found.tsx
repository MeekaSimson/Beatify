import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <Music className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl mb-2">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button className="gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
            <Link href="/studio">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Music className="h-4 w-4" />
                Go to Studio
              </Button>
            </Link>
            <Link href="/library">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Search className="h-4 w-4" />
                Browse Library
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
