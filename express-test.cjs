// Simple Express server test
const express = require('express');
const app = express();

// Basic logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  console.log(`Request started: ${req.method} ${req.url}`);
  
  // Capture the response finish event
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`Response sent: ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  
  // Capture response errors
  res.on('error', (err) => {
    const duration = Date.now() - startTime;
    console.error(`Response error: ${req.method} ${req.url} - ${err.message} (${duration}ms)`);
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Processing health check request');
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  console.log('Health check response prepared');
});

// Add delay endpoint to test timeouts
app.get('/delay/:ms', (req, res) => {
  const delay = parseInt(req.params.ms, 10) || 1000;
  console.log(`Processing delay request (${delay}ms)`);
  
  setTimeout(() => {
    res.status(200).json({ 
      status: 'ok', 
      delay: delay,
      message: `Delayed response by ${delay}ms`,
      timestamp: new Date().toISOString() 
    });
    console.log(`Delay (${delay}ms) response prepared`);
  }, delay);
});

// Start the server
const PORT = 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express test server running on port ${PORT}`);
});

// Add server event handlers
server.on('error', (err) => {
  console.error('Server error:', err.message);
});

// Set a timeout handler
server.setTimeout(30000, (socket) => {
  console.log('Socket timeout detected');
});