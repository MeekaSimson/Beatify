# Beatify - Beautify your voice with beats

A production-ready web application that transforms raw vocals into complete songs using AI-generated instrumental accompaniments.

## Features

- **Audio Recording & Upload**: Record vocals directly in the browser or upload existing audio files (WAV, MP3, M4A)
- **Tempo & Key Detection**: Automatic BPM and musical key analysis with manual override options
- **Instrument Selection**: Choose from drums, bass, piano, guitar, strings, and synth with customizable styles and complexity
- **AI Generation**: Create professional accompaniments tailored to your vocal track
- **Mix Console**: Fine-tune individual instrument levels, panning, and effects
- **Track Library**: Organize and manage your created tracks with advanced filtering and search
- **Admin Dashboard**: Monitor system performance and track usage statistics

## Tech Stack

- **Framework**: Next.js 14+ with App Router and TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand with persistence
- **Audio Processing**: Web Audio API with wavesurfer.js
- **Forms**: react-hook-form with Zod validation
- **HTTP Client**: Axios with typed API client
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/your-username/beatify.git
cd beatify
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit `.env.local` with your configuration:
\`\`\`env
NEXT_PUBLIC_SITE_NAME="Beatify"
AI_SERVICE_URL="http://localhost:8000"
NEXT_PUBLIC_ADMIN_KEY="your-admin-key"
\`\`\`

4. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SITE_NAME` | Application name displayed in UI | No |
| `AI_SERVICE_URL` | URL for AI processing service | Yes (for production) |
| `NEXT_PUBLIC_ADMIN_KEY` | Admin dashboard access key | No |

## API Endpoints

- `POST /api/upload` - Upload audio files
- `POST /api/analyze` - Analyze tempo and key
- `POST /api/generate` - Generate AI accompaniment
- `GET /api/job/:jobId` - Check generation job status
- `GET /api/track/:trackId` - Get track metadata
- `DELETE /api/track/:trackId` - Delete track and associated files
- `GET /api/health` - System health check

## Project Structure

\`\`\`
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   ├── studio/            # Studio workflow page
│   ├── library/           # Track library page
│   └── admin/             # Admin dashboard
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── AudioRecorder.tsx # Voice recording component
│   ├── FileUploader.tsx  # File upload component
│   └── ...               # Other components
├── lib/                   # Utilities and configuration
│   ├── store.ts          # Zustand state management
│   ├── apiClient.ts      # HTTP client
│   ├── types.ts          # TypeScript definitions
│   └── utils.ts          # Helper functions
└── hooks/                 # Custom React hooks
\`\`\`

## Development

### Adding New Features

1. Create components in `src/components/`
2. Add API routes in `src/app/api/`
3. Update types in `src/lib/types.ts`
4. Add state management in `src/lib/store.ts`

### Testing

\`\`\`bash
npm run test        # Run tests
npm run test:watch  # Run tests in watch mode
\`\`\`

### Linting

\`\`\`bash
npm run lint        # Check for linting errors
npm run lint:fix    # Fix linting errors
\`\`\`

## Production Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker

\`\`\`bash
docker build -t beatify .
docker run -p 3000:3000 beatify
\`\`\`

## AI Service Integration

Beatify is designed to work with external AI services for audio processing. To integrate:

1. Set `AI_SERVICE_URL` environment variable
2. Implement the following endpoints in your AI service:
   - `POST /analyze` - Audio analysis
   - `POST /generate` - Accompaniment generation

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@beatify.app or open an issue on GitHub.
