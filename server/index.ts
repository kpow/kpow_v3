import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
console.log("[Server] Starting application initialization...");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log("[Server] Registering routes...");
  const server = registerRoutes(app);
  console.log("[Server] Routes registered successfully");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[Server] Error:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    console.log("[Server] Setting up Vite in development mode...");
    await setupVite(app, server);
    console.log("[Server] Vite setup complete");
  } else {
    console.log("[Server] Setting up static serving in production mode...");
    serveStatic(app);
  }

  // Try multiple ports, starting with 5000
  const PORTS = [5000, 3000, 5001, 8080, 4000];
  let currentPortIndex = 0;
  
  const startServer = () => {
    if (currentPortIndex >= PORTS.length) {
      console.error("[Server] Failed to start on any port");
      process.exit(1);
      return;
    }
    
    const PORT = PORTS[currentPortIndex];
    console.log(`[Server] Attempting to start server on port ${PORT}...`);
    
    server.listen(PORT, "0.0.0.0")
      .on("listening", () => {
        console.log(`[Server] Server is now running on port ${PORT}`);
        log(`serving on port ${PORT}`);
      })
      .on("error", (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`[Server] Port ${PORT} is already in use, trying next port...`);
          currentPortIndex++;
          startServer(); // Try next port
        } else {
          console.error("[Server] Error starting server:", err);
          process.exit(1);
        }
      });
  };
  
  startServer();
})();