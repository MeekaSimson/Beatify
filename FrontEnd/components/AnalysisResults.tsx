"use client"

import { CheckCircle, Music, TrendingUp, Key as KeyIcon, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Note {
  pitch: number
  startTime: number
  endTime: number
  duration: number
  velocity: number
}

interface AnalysisResult {
  notes: Note[]
  noteCount: number
  key: string
  scale: string
  keyConfidence: number
  bpm: number
  tempoConfidence: number
  duration: number
}

interface AnalysisResultsProps {
  results: AnalysisResult
  filename?: string
}

// Helper function to convert MIDI pitch to note name
const midiToNoteName = (midi: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const octave = Math.floor(midi / 12) - 1
  const noteName = noteNames[midi % 12]
  return `${noteName}${octave}`
}

export function AnalysisResults({ results, filename }: AnalysisResultsProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-6 w-6" />
          Analysis Complete!
        </CardTitle>
        {filename && (
          <p className="text-sm text-muted-foreground">File: {filename}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Tempo Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                Tempo
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-700">
              {results.bpm}
            </div>
            <div className="text-xs text-blue-600 mt-1">BPM</div>
            <div className="text-xs text-blue-500 mt-2">
              Confidence: {(results.tempoConfidence * 100).toFixed(0)}%
            </div>
          </div>

          {/* Key Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <KeyIcon className="h-4 w-4 text-purple-600" />
              <div className="text-xs font-semibold text-purple-900 uppercase tracking-wide">
                Key
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-700">
              {results.key}
            </div>
            <div className="text-xs text-purple-600 mt-1 capitalize">
              {results.scale}
            </div>
            <div className="text-xs text-purple-500 mt-2">
              Confidence: {(results.keyConfidence * 100).toFixed(0)}%
            </div>
          </div>

          {/* Notes Card */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Music className="h-4 w-4 text-orange-600" />
              <div className="text-xs font-semibold text-orange-900 uppercase tracking-wide">
                Notes
              </div>
            </div>
            <div className="text-3xl font-bold text-orange-700">
              {results.noteCount}
            </div>
            <div className="text-xs text-orange-600 mt-1">Detected</div>
            {results.notes.length > 0 && (
              <div className="text-xs text-orange-500 mt-2">
                Range: {midiToNoteName(Math.min(...results.notes.map(n => n.pitch)))} - {midiToNoteName(Math.max(...results.notes.map(n => n.pitch)))}
              </div>
            )}
          </div>

          {/* Duration Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-green-600" />
              <div className="text-xs font-semibold text-green-900 uppercase tracking-wide">
                Duration
              </div>
            </div>
            <div className="text-3xl font-bold text-green-700">
              {results.duration.toFixed(1)}
            </div>
            <div className="text-xs text-green-600 mt-1">seconds</div>
            <div className="text-xs text-green-500 mt-2">
              {Math.floor(results.duration / 60)}:{(results.duration % 60).toFixed(0).padStart(2, '0')} min
            </div>
          </div>
        </div>

        {/* Detected Notes List */}
        {results.notes && results.notes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              🎹 First 10 Detected Notes
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {results.notes.slice(0, 10).map((note, index) => (
                  <div 
                    key={index} 
                    className="bg-white p-3 rounded-md border border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-bold text-gray-500 w-8">
                          #{index + 1}
                        </div>
                        <div className="text-lg font-bold text-blue-600 w-12">
                          {midiToNoteName(note.pitch)}
                        </div>
                        <div className="text-xs text-gray-500">
                          MIDI {note.pitch}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-gray-500">Start:</span>{' '}
                          <span className="font-mono text-green-600">{note.startTime.toFixed(2)}s</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration:</span>{' '}
                          <span className="font-mono text-orange-600">{note.duration.toFixed(2)}s</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Velocity:</span>{' '}
                          <span className="font-mono text-red-600">{(note.velocity * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {results.notes.length > 10 && (
                <div className="text-center text-sm text-gray-500 italic mt-3 pt-3 border-t border-gray-200">
                  ... and {results.notes.length - 10} more notes
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">📊 Quick Summary</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-blue-700">Average Note Duration:</span>{' '}
              <span className="font-semibold">
                {results.notes.length > 0 
                  ? (results.notes.reduce((acc, n) => acc + n.duration, 0) / results.notes.length).toFixed(2) 
                  : '0.00'}s
              </span>
            </div>
            <div>
              <span className="text-blue-700">Average Velocity:</span>{' '}
              <span className="font-semibold">
                {results.notes.length > 0 
                  ? ((results.notes.reduce((acc, n) => acc + n.velocity, 0) / results.notes.length) * 100).toFixed(0) 
                  : '0'}%
              </span>
            </div>
            <div>
              <span className="text-blue-700">Notes per Second:</span>{' '}
              <span className="font-semibold">
                {results.duration > 0 ? (results.noteCount / results.duration).toFixed(1) : '0.0'}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Key Certainty:</span>{' '}
              <span className={`font-semibold ${results.keyConfidence > 0.7 ? 'text-green-600' : results.keyConfidence > 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                {results.keyConfidence > 0.7 ? 'High' : results.keyConfidence > 0.5 ? 'Medium' : 'Low'}
              </span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-purple-900 mb-2">✨ Ready for Next Phase!</h3>
          <p className="text-sm text-purple-700">
            Analysis complete! Now we can generate chords, create arrangements, and visualize the music on a piano roll.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}