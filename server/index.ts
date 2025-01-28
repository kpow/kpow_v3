import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "net";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request logging middleware
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

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  log(`Error: ${err.message}`);
  res.status(500).json({ error: err.message });
});

async function startServer() {
  try {
    log("Starting server...");
    const server = registerRoutes(app);

    // Set up Vite or static serving based on environment
    if (app.get("env") === "development") {
      log("Setting up Vite development server...");
      await setupVite(app, server);
    } else {
      log("Setting up static file serving...");
      serveStatic(app);
    }

    // Try ports starting from 5000
    for (let port = 5000; port < 5100; port++) {
      try {
        await new Promise((resolve, reject) => {
          server.listen(port, "0.0.0.0")
            .once('listening', () => {
              log(`Server started successfully on port ${port}`);
              resolve(true);
            })
            .once('error', (err) => {
              if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
                log(`Port ${port} is in use, trying next port...`);
                resolve(false);
              } else {
                reject(err);
              }
            });
        });

        // If we get here, the server started successfully
        return;
      } catch (err) {
        log(`Failed to start server on port ${port}: ${(err as Error).message}`);
      }
    }

    throw new Error('Could not find an available port');
  } catch (error) {
    log(`Fatal error starting server: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Start the server
startServer();