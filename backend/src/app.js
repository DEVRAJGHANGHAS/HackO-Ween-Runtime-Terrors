const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/error');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Security Headers (configured to allow Leaflet OSM tiles, Chart.js, FontAwesome)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:5001,http://localhost:5001').split(',').map(s => s.trim());

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for local development and demo testing
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to API endpoints
app.use('/api', apiLimiter);

// Mount API routes
app.use('/api', routes);

// Serve the frontend directly so full-stack app works at http://localhost:5001
const frontendRoot = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendRoot));
app.use('/frontend', express.static(frontendRoot));

// Fallback to index.html for root if needed
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendRoot, 'index.html'));
});

// 404 for unmatched API routes
app.use('/api/*', notFoundHandler);

// Centralized Error Handling
app.use(errorHandler);

module.exports = app;
