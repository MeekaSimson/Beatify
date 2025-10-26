import Link from "next/link"
import { Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function NavBar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Music className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">Beatify</span>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              <Link href="/studio">
                <Button variant="ghost">Studio</Button>
              </Link>
              <Link href="/library">
                <Button variant="ghost">Library</Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}
