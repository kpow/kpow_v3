/**
 * Database utility functions to handle connection resilience
 */

import { pool } from "@db";

/**
 * Execute a database operation with retries and exponential backoff
 * 
 * @param operation Function that performs the database operation
 * @param maxRetries Maximum number of retry attempts
 * @param options Additional retry options
 * @returns Result of the operation
 * @throws Last error encountered after all retries fail
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>, 
  maxRetries = 3,
  options = {
    baseDelay: 100, // Base delay in ms
    maxDelay: 3000, // Maximum delay in ms
    shouldRetry: (error: any) => true // Function to determine if error is retryable
  }
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      console.warn(`[DB Helper] Operation failed (attempt ${attempt}/${maxRetries}): ${error.message}`);
      
      // Log additional error details if available
      if (error.code) console.warn(`[DB Helper] Error code: ${error.code}`);
      if (error.cause) console.warn(`[DB Helper] Error cause: ${error.cause}`);
      
      lastError = error;
      
      // Check if we should retry this specific error
      if (!options.shouldRetry(error)) {
        console.warn(`[DB Helper] Error not retryable, giving up`);
        break;
      }
      
      if (attempt < maxRetries) {
        // Exponential backoff with jitter: baseDelay * 2^(attempt-1) * (0.5 + random/2)
        // This helps prevent thundering herd problems
        const randomFactor = 0.5 + Math.random() * 0.5; // Random between 0.5 and 1.0
        const exponentialDelay = options.baseDelay * Math.pow(2, attempt - 1);
        const delay = Math.min(exponentialDelay * randomFactor, options.maxDelay);
        
        console.log(`[DB Helper] Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Check database connectivity with resilience
 * 
 * @returns Boolean indicating if database is connected
 */
export async function checkDatabaseConnectivity(): Promise<boolean> {
  try {
    return await executeWithRetry(async () => {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
        return true;
      } finally {
        client.release();
      }
    }, 2); // Only try twice for health checks
  } catch (error) {
    console.error("[DB Helper] Database connectivity check failed:", error);
    return false;
  }
}

/**
 * Get database information for diagnostics
 * 
 * @returns Object with database diagnostics
 */
export function getDatabaseInfo() {
  try {
    if (!process.env.DATABASE_URL) return { error: 'DATABASE_URL not set' };
    
    const url = new URL(process.env.DATABASE_URL);
    return {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || 'default',
      pathname: url.pathname,
      // Hide credentials
      has_username: !!url.username,
      has_password: !!url.password,
      search_params: Object.fromEntries(
        Array.from(url.searchParams.entries())
          .filter(([key]) => !key.includes('password') && !key.includes('user'))
      ),
      // Pool stats
      pool_total: pool.totalCount,
      pool_idle: pool.idleCount,
      pool_waiting: pool.waitingCount,
    };
  } catch (error) {
    return { 
      error: 'Invalid DATABASE_URL format',
      message: error instanceof Error ? error.message : String(error)
    };
  }
}