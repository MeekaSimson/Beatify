import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Mic, Settings, Download, Zap, Award, Headphones } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8">
            <Music className="h-16 w-16 mx-auto mb-6 text-primary" />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Beautify your voice with beats
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Turn your raw singing into a complete song with AI-generated instruments.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/studio">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Now
              </Button>
            </Link>
            <Link href="/studio?demo=true">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-transparent">
                Try a Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">How it works</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Mic className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>Record/Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Upload your vocal recording or use our built-in recorder with metronome guidance.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Settings className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>Set Tempo/Key</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Define your song's BPM, time signature, and musical key for perfect harmony.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Download className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>Generate & Mix</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  AI creates custom instruments, then mix and download your complete song.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Beatify */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Why Beatify?</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Fast</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Generate professional-quality accompaniments in minutes, not hours. Our AI works at lightning speed to
                  bring your vision to life.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Award className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Creative</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Explore different musical styles and instrument combinations. From pop to rock to lofi, discover new
                  sounds for your voice.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Headphones className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Studio-grade</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Professional mixing tools and high-quality audio processing ensure your tracks sound polished and
                  radio-ready.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to create your masterpiece?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of artists who've transformed their vocals into complete songs.
          </p>
          <Link href="/studio">
            <Button size="lg" className="text-lg px-8 py-6">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
