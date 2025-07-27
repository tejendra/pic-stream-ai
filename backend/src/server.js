const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const mediaRoutes = require('./routes/media');
const shareRoutes = require('./routes/share');
const albumRoutes = require('./routes/albums');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 8080;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
// Set CSP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "connect-src": ["'self'", "https://identitytoolkit.googleapis.com", "*.googleapis.com"],
        "style-src": ["'self'", "'unsafe-inline'"], // allow inline styles (for goober)
        "img-src": ["'self'", "data:", "blob:", "*.googleapis.com"]
      },
    },
  })
);
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

let FRONTEND_BUILD_PATH

if (process.env.NODE_ENV === 'development') {
  FRONTEND_BUILD_PATH = '../../frontend/build'
} else if (process.env.NODE_ENV === 'production') {
  FRONTEND_BUILD_PATH = './public'
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', authenticateToken, uploadRoutes);
app.use('/api/media', authenticateToken, mediaRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/albums', authenticateToken, albumRoutes);

// Serve static files from frontend/build (after API routes)
app.use(express.static(path.join(__dirname, FRONTEND_BUILD_PATH), {
  setHeaders: (res, path) => {
    // Set correct MIME types for common file types
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (path.endsWith('.ico')) {
      res.setHeader('Content-Type', 'image/x-icon');
    }
  }
}));

// Error handling middleware
app.use(errorHandler);

// Fallback to index.html for SPA routes (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, FRONTEND_BUILD_PATH, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app; 