import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema, type SelectUser } from "@db/schema";
import { db, pool } from "@db";
import { eq } from "drizzle-orm";
import { fromZodError } from "zod-validation-error";
import pg from "pg";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);
const PostgresSessionStore = connectPg(session);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function getUserByUsername(username: string) {
  return db.select().from(users).where(eq(users.username, username)).limit(1);
}

// Utility function for database operations with retry logic
async function executeWithRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`Database operation failed (attempt ${attempt}/${maxRetries}):`, 
        error instanceof Error ? error.message : error);
      
      // Only wait if we're going to retry
      if (attempt < maxRetries) {
        const delay = Math.min(100 * Math.pow(2, attempt), 2000); // Exponential backoff with max of 2s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Create a separate minimal pool specifically for session management
// This avoids conflicts with the main connection pool but uses similar settings
const sessionPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,                           // Very limited connections for session store
  min: 0,                           // Don't keep minimum connections
  idleTimeoutMillis: 5000,          // Close idle connections after 5 seconds
  connectionTimeoutMillis: 3000,    // 3 second timeout for connection attempts
  query_timeout: 3000,              // 3 second query timeout
  allowExitOnIdle: true,            // Allow the process to exit if pool is idle
  ssl: { rejectUnauthorized: false }, // Accept self-signed certificates if needed
  statement_timeout: 3000,          // 3 seconds timeout for statements
  max_retries: 2,                   // Maximum number of query retries
  retry_delay: 150,                 // Milliseconds between retries
  keepalive: true,                  // Enable TCP keepalive
  keepaliveInitialDelayMillis: 5000 // Initial delay for TCP keepalive
});

// Create a retry-enabled PostgreSQL session store
class RetryPgStore extends PostgresSessionStore {
  // Override all critical methods to add retry logic
  
  // Get a session from the store
  async get(sid: string, callback: Function) {
    try {
      const result = await executeWithRetry(async () => {
        return new Promise((resolve, reject) => {
          super.get(sid, (err: any, data: any) => {
            if (err) reject(err);
            else resolve(data);
          });
        });
      }, 3);
      callback(null, result);
    } catch (err) {
      console.error('[Session Store] Get error with retry:', err);
      callback(err);
    }
  }
  
  // Set a session in the store
  async set(sid: string, session: any, callback?: Function) {
    try {
      await executeWithRetry(async () => {
        return new Promise((resolve, reject) => {
          super.set(sid, session, (err: any) => {
            if (err) reject(err);
            else resolve(true);
          });
        });
      }, 3);
      callback?.(null);
    } catch (err) {
      console.error('[Session Store] Set error with retry:', err);
      callback?.(err);
    }
  }
  
  // Remove a session from the store
  async destroy(sid: string, callback?: Function) {
    try {
      await executeWithRetry(async () => {
        return new Promise((resolve, reject) => {
          super.destroy(sid, (err: any) => {
            if (err) reject(err);
            else resolve(true);
          });
        });
      }, 2);
      callback?.(null);
    } catch (err) {
      console.error('[Session Store] Destroy error with retry:', err);
      callback?.(err);
    }
  }
  
  // Update session expiration time
  async touch(sid: string, session: any, callback?: Function) {
    try {
      await executeWithRetry(async () => {
        return new Promise((resolve, reject) => {
          super.touch(sid, session, (err: any) => {
            if (err) reject(err);
            else resolve(true);
          });
        });
      }, 2);
      callback?.(null);
    } catch (err) {
      console.error('[Session Store] Touch error with retry:', err);
      callback?.(err);
    }
  }
}

export function setupAuth(app: Express) {
  // Enhanced session store with better error handling and retry logic
  console.log('[Auth] Setting up PostgreSQL session store with retry logic...');
  
  // Monitor session pool for debugging
  sessionPool.on('connect', () => console.log('[Session Pool] New connection established'));
  sessionPool.on('error', (err) => {
    console.error('[Session Pool] Error:', err.message);
    if (err.stack) console.error('[Session Pool] Stack:', err.stack);
  });
  
  // Create a more resilient session store with our RetryPgStore implementation
  const store = new RetryPgStore({
    pool: sessionPool,           // Use dedicated session pool
    createTableIfMissing: true,  // Create table if it doesn't exist
    tableName: 'session',        // Table name
    pruneSessionInterval: 60 * 30, // Only prune every 30 minutes to reduce DB load
    errorLog: (err) => {
      console.error('[Session Store] Error:', err.message);
      if (err.stack) console.error('[Session Store] Stack:', err.stack);
    },
    ttl: 60 * 60 * 24 * 7,       // Session TTL: 1 week (in seconds)
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store,
    rolling: true, // Refresh session expiration on each request
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [user] = await getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        if (!user.approved) {
          return done(null, false, { message: "Account pending approval" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        const error = fromZodError(result.error);
        return res.status(400).json({ error: error.toString() });
      }

      const [existingUser] = await getUserByUsername(result.data.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const [user] = await db
        .insert(users)
        .values({
          ...result.data,
          password: await hashPassword(result.data.password),
          approved: false 
        })
        .returning();

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ error: info?.message || "Authentication failed" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    res.json(req.user);
  });

  app.post("/api/admin/approve-user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = req.user?.id;
    if (userId !== 1) { 
      return res.status(403).json({ error: "Not authorized" });
    }

    const targetUserId = req.body.userId;
    if (!targetUserId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    try {
      await db
        .update(users)
        .set({ approved: true })
        .where(eq(users.id, targetUserId));

      res.json({ message: "User approved successfully" });
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ error: "Failed to approve user" });
    }
  });

  app.get("/api/admin/pending-users", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = req.user?.id;
    if (userId !== 1) { 
      return res.status(403).json({ error: "Not authorized" });
    }

    try {
      const pendingUsers = await db
        .select({
          id: users.id,
          username: users.username,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.approved, false));

      res.json(pendingUsers);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ error: "Failed to fetch pending users" });
    }
  });
}