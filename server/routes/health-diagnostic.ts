import { Router } from "express";
import { db } from "@db";

const router = Router();

// Simple health check that doesn't depend on database
router.get("/health/basic", (req, res) => {
  console.log("[Health] Processing basic health check request");
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "Basic health check endpoint is responding correctly"
  });
  console.log("[Health] Basic health check response sent");
});

// Database health check
router.get("/health/db", async (req, res) => {
  console.log("[Health] Processing database health check");
  try {
    // Use raw query for simplicity
    const result = await db.execute("SELECT NOW() as current_time");
    console.log("[Health] Database query successful");
    
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        serverTime: result[0].current_time
      }
    });
    console.log("[Health] Database health check response sent");
  } catch (error) {
    console.error("[Health] Database health check failed:", error);
    res.status(500).json({ 
      status: "error", 
      timestamp: new Date().toISOString(),
      message: "Database connection failed",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Echo endpoint that doesn't use database
router.get("/echo", (req, res) => {
  console.log("[Echo] Processing echo request");
  const responseData = {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    timestamp: new Date().toISOString()
  };
  
  res.status(200).json(responseData);
  console.log("[Echo] Echo response sent");
});

// Test long-running requests
router.get("/delay/:ms", (req, res) => {
  const delay = parseInt(req.params.ms, 10) || 1000;
  console.log(`[Delay] Processing delay request (${delay}ms)`);
  
  setTimeout(() => {
    res.status(200).json({ 
      status: "ok", 
      delay: delay,
      message: `Delayed response by ${delay}ms`,
      timestamp: new Date().toISOString() 
    });
    console.log(`[Delay] Delay (${delay}ms) response sent`);
  }, delay);
});

// Session test endpoint
router.get("/session-test", (req, res) => {
  console.log("[Session] Processing session test request");
  
  if (!req.session) {
    return res.status(500).json({
      status: "error",
      message: "Session middleware not properly configured"
    });
  }
  
  // Count visits in this session
  if (typeof req.session.views === 'undefined') {
    req.session.views = 1;
  } else {
    req.session.views++;
  }
  
  res.status(200).json({
    status: "ok",
    sessionId: req.sessionID,
    views: req.session.views,
    loggedIn: req.isAuthenticated ? req.isAuthenticated() : false
  });
  
  console.log("[Session] Session test response sent");
});

export default router;