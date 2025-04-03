// Simple Express diagnostic server
const express = require('express');
const app = express();
const http = require('http');

// Basic logging middleware with full request details
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.floor(Math.random() * 10000);
  
  console.log(`[${requestId}] Request started: ${req.method} ${req.url}`);
  console.log(`[${requestId}] Headers:`, JSON.stringify(req.headers, null, 2));
  
  // Capture the original write and end methods to log response body
  const originalWrite = res.write;
  const originalEnd = res.end;
  const chunks = [];

  // Override write method to capture response chunks
  res.write = function(chunk, ...args) {
    chunks.push(Buffer.from(chunk));
    return originalWrite.apply(res, [chunk, ...args]);
  };

  // Override end method to capture final response chunk and log everything
  res.end = function(chunk, ...args) {
    if (chunk) {
      chunks.push(Buffer.from(chunk));
    }
    
    const responseBody = Buffer.concat(chunks).toString('utf8');
    const duration = Date.now() - startTime;
    
    console.log(`[${requestId}] Response completed: ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    console.log(`[${requestId}] Response body: ${responseBody.length > 500 ? 
      responseBody.substring(0, 500) + '... (truncated)' : responseBody}`);
    
    return originalEnd.apply(res, [chunk, ...args]);
  };
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Processing health check request');
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Echo endpoint to reflect the request
app.get('/echo', (req, res) => {
  const responseData = {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    timestamp: new Date().toISOString()
  };
  
  res.status(200).json(responseData);
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
  }, delay);
});

// Start the server with better error handling
const PORT = 3000;
const server = http.createServer(app);

// Add proper error handling
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Monitor connections
server.on('connection', (socket) => {
  console.log('New client connection established');
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  socket.on('close', (hadError) => {
    console.log(`Connection closed ${hadError ? 'with' : 'without'} error`);
  });
});

// Set a longer timeout to accommodate slower connections
server.timeout = 30000;

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Diagnostic Express server running on port ${PORT}`);
  console.log(`Testing URLs:`);
  console.log(`- Health check: http://localhost:${PORT}/health`);
  console.log(`- Echo request: http://localhost:${PORT}/echo`);
  console.log(`- Delayed response (2s): http://localhost:${PORT}/delay/2000`);
});