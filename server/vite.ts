import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { looksLikeFile, registerSitemap, renderIndex } from "./page-meta";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      middlewareMode: true,
      hmr: { server },
    },
    appType: "custom",
  });

  app.use(vite.middlewares);
  registerSitemap(app, path.resolve(__dirname, "..", "client", "public"));
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (looksLikeFile(req.originalUrl.split("?")[0])) return res.status(404).end();

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`)
      template = await vite.transformIndexHtml(url, template);
      const { status, html } = await renderIndex(req, template, path.resolve(__dirname, "..", "client", "public"));
      res.status(status).set({ "Content-Type": "text/html", "Cache-Control": "no-cache" }).end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  registerSitemap(app, distPath);
  app.use(
    express.static(distPath, {
      // index.html goes out below with the page's own tags, never as a plain file
      index: false,
      // hashed bundles never change; everything else revalidates
      setHeaders: (res, file) => {
        if (file.includes(`${path.sep}assets${path.sep}`)) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      },
    }),
  );

  // fall through to index.html, with this page's title and share tags, if the file doesn't exist
  const template = fs.readFileSync(path.resolve(distPath, "index.html"), "utf-8");
  app.use("*", async (req, res) => {
    // a missing bundle or image is a 404, not the app: an old cached index.html
    // asking for last deploy's bundle would otherwise get HTML back and go blank
    if (looksLikeFile(req.originalUrl.split("?")[0])) return res.status(404).end();
    const { status, html } = await renderIndex(req, template, distPath);
    res.status(status).set({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" }).end(html);
  });
}
