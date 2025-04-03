// Simple diagnostic server to test HTTP responses
import express from 'express';
const app = express();

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Basic health endpoint
app.get('/health', (req, res) => {
  console.log('Responding to health check');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Database URL information (without exposing credentials)
app.get('/db-info', (req, res) => {
  console.log('Responding to db-info request');
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL not set' });
    }
    
    const url = new URL(process.env.DATABASE_URL);
    res.status(200).json({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      has_username: !!url.username,
      has_password: !!url.password
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Invalid DATABASE_URL format',
      message: error.message
    });
  }
});

// Start the server on a different port
const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Diagnostic server running on port ${PORT}`);
});