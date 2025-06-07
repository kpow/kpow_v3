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

  // Use PORT from environment variable (Digital Ocean) or default to 5000 for local development
  const PORT = parseInt(process.env.PORT || "5000", 10);
  console.log(`[Server] Attempting to start server on port ${PORT}...`);

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Server is now running on port ${PORT}`);
    log(`serving on port ${PORT}`);
  });
})();