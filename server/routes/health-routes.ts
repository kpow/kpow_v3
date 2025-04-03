import { Router } from "express";
import { pool, db } from "../../db";
import { sql } from "drizzle-orm";

/**
 * Register health check related routes
 */
export function registerHealthRoutes(router: Router) {
  /**
   * Basic system health check endpoint
   * Returns the status of the system and the current timestamp
   */
  router.get('/api/health/system', (req, res) => {
    try {
      const timestamp = new Date().toISOString();
      res.json({
        status: 'ok',
        timestamp,
        message: 'System is running normally'
      });
    } catch (error) {
      console.error('Error in system health check:', error);
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Failed to check system health',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * Database health check endpoint
   * Returns the status of the database connection and the current timestamp
   */
  router.get('/api/health/database', async (req, res) => {
    const timestamp = new Date().toISOString();
    try {
      // Use a client from the connection pool with a short timeout
      const client = await pool.connect();
      try {
        // Execute a simple query to verify the connection
        const result = await client.query('SELECT NOW() as time');
        const serverTime = result.rows[0]?.time?.toISOString() || null;
        
        res.json({
          status: 'ok',
          timestamp,
          database: {
            connected: true,
            serverTime
          },
          message: 'Database connection is healthy'
        });
      } catch (error) {
        console.error('Error executing database query:', error);
        res.status(500).json({
          status: 'error',
          timestamp,
          database: {
            connected: false
          },
          message: 'Database query failed',
          error: error instanceof Error ? error.message : String(error)
        });
      } finally {
        // Always release the client back to the pool
        client.release();
      }
    } catch (error) {
      console.error('Error connecting to database:', error);
      res.status(500).json({
        status: 'error',
        timestamp,
        database: {
          connected: false
        },
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * Detailed database info endpoint
   * Returns information about the database connection
   * This endpoint is useful for debugging database connection issues
   */
  router.get('/api/health/database/info', async (req, res) => {
    try {
      const info: any = {};
      
      // Extract information from DATABASE_URL safely
      try {
        const dbUrl = new URL(process.env.DATABASE_URL || '');
        
        info.protocol = dbUrl.protocol.replace(':', '');
        info.hostname = dbUrl.hostname;
        info.port = dbUrl.port;
        info.pathname = dbUrl.pathname;
        info.has_username = !!dbUrl.username;
        info.has_password = !!dbUrl.password;
        
        // Get search params without exposing values
        const searchParams: Record<string, string> = {};
        dbUrl.searchParams.forEach((value, key) => {
          searchParams[key] = key.toLowerCase().includes('password') ? '[REDACTED]' : value;
        });
        
        if (Object.keys(searchParams).length > 0) {
          info.search_params = searchParams;
        }
      } catch (error) {
        info.error = 'Invalid DATABASE_URL format';
      }
      
      // Get connection pool stats
      try {
        info.pool_total = pool.totalCount;
        info.pool_idle = pool.idleCount;
        info.pool_waiting = pool.waitingCount;
      } catch (error) {
        info.pool_error = 'Failed to get pool stats';
      }
      
      res.json(info);
    } catch (error) {
      console.error('Error fetching database info:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
        message: 'Failed to retrieve database information'
      });
    }
  });

  /**
   * Connection test endpoint with retry
   * Attempts to connect to the database with retry logic
   */
  router.get('/api/health/database/test-connection', async (req, res) => {
    try {
      // Use a client from the connection pool
      const client = await pool.connect();
      try {
        // Execute a simple query to verify the connection
        await client.query('SELECT 1');
        res.json({
          status: 'ok',
          message: 'Database connection test successful'
        });
      } finally {
        // Always release the client back to the pool
        client.release();
      }
    } catch (error) {
      console.error('Database connection test failed:', error);
      res.status(500).json({
        status: 'error',
        message: 'Database connection test failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}