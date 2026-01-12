const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept audio files
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/flac'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|ogg|flac)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Beatify Backend API is running!' });
});

// Main analysis endpoint
app.post('/api/analyze', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  const audioFilePath = req.file.path;
  console.log(`Processing file: ${audioFilePath}`);

  try {
    // Path to your Python script
    const pythonScriptPath = path.join(__dirname, '../ml-service/analyze_audio.py');
    
    // Spawn Python process
    const pythonProcess = spawn('python3', [pythonScriptPath, audioFilePath]);

    let outputData = '';
    let errorData = '';

    // Collect stdout data (JSON output)
    pythonProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      outputData += chunk;
      console.log('Python stdout:', chunk.substring(0, 100)); // Debug: first 100 chars
    });

    // Collect stderr data (logs)
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      // Don't log every stderr line, only errors
      const line = data.toString().trim();
      if (line.includes('❌') || line.includes('Error')) {
        console.error(`Python Error: ${line}`);
      }
    });

    // Handle process completion
    pythonProcess.on('close', (code) => {
      // Clean up uploaded file
      fs.unlink(audioFilePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });

      if (code !== 0) {
        console.error(`Python script exited with code ${code}`);
        return res.status(500).json({
          success: false,
          error: 'Analysis failed',
          details: errorData || 'Unknown error occurred'
        });
      }

      try {
        // Clean the output - remove any non-JSON text before parsing
        let jsonOutput = outputData.trim();
        
        // If there's any text before the first '{', remove it
        const jsonStart = jsonOutput.indexOf('{');
        if (jsonStart > 0) {
          console.log('Warning: Non-JSON text detected, cleaning...');
          jsonOutput = jsonOutput.substring(jsonStart);
        }
        
        // Parse the JSON output from Python script
        const result = JSON.parse(jsonOutput);
        
        console.log('✅ Analysis successful:', result.success ? 'true' : 'false');
        console.log('   Notes detected:', result.analysis?.noteCount || 0);
        console.log('   Tempo:', result.analysis?.bpm || 'unknown');
        
        // Return the result exactly as Python returns it
        res.json({
          ...result,
          filename: req.file.originalname
        });
      } catch (parseError) {
        console.error('❌ Error parsing Python output:', parseError.message);
        console.error('Raw output length:', outputData.length);
        console.error('First 200 chars:', outputData.substring(0, 200));
        console.error('Last 200 chars:', outputData.substring(Math.max(0, outputData.length - 200)));
        
        res.status(500).json({
          success: false,
          error: 'Failed to parse analysis results',
          details: parseError.message,
          rawOutputPreview: outputData.substring(0, 300)
        });
      }
    });

  } catch (error) {
    console.error('Error processing file:', error);
    
    // Clean up file on error
    fs.unlink(audioFilePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

    res.status(500).json({
      error: 'Server error during analysis',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        details: 'Maximum file size is 50MB'
      });
    }
  }
  
  res.status(500).json({
    error: error.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Beatify Backend API running on http://localhost:${PORT}`);
  console.log(`📁 Upload endpoint: http://localhost:${PORT}/api/analyze`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});