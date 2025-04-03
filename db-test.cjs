// Simple database connection test script
const { Pool } = require('pg');

// Get database URL from environment
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log('Creating test pool with DATABASE_URL');
// Parse the database URL to display info without credentials
try {
  const parsedUrl = new URL(dbUrl);
  console.log(`Connection details:
  Protocol: ${parsedUrl.protocol}
  Host: ${parsedUrl.hostname}
  Port: ${parsedUrl.port}
  Database: ${parsedUrl.pathname.slice(1)}
  Username: ${parsedUrl.username ? '(set)' : '(not set)'}
  Password: ${parsedUrl.password ? '(set)' : '(not set)'}
  `);
} catch (error) {
  console.error('Invalid DATABASE_URL format:', error.message);
  process.exit(1);
}

// Create a pool with more debug information
const pool = new Pool({
  connectionString: dbUrl,
  connectionTimeoutMillis: 5000, // 5 second timeout
  query_timeout: 5000, // 5 second query timeout
  max: 1, // Single connection for this test
  ssl: { rejectUnauthorized: false } // Accept self-signed certificates
});

// Setup diagnostic listeners
pool.on('connect', client => {
  console.log('Client connected to database');
});

pool.on('acquire', client => {
  console.log('Client acquired from pool');
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client:', err.message);
  if (err.stack) console.error('Error stack:', err.stack);
  if (err.cause) console.error('Error cause:', err.cause);
});

// Test the connection with a simple query
async function testConnection() {
  console.log('Testing database connection...');
  
  try {
    const client = await pool.connect();
    try {
      console.log('Successfully connected to the database');
      console.log('Running test query...');
      
      const result = await client.query('SELECT NOW() as current_time');
      console.log('Query successful! Current server time:', result.rows[0].current_time);
      
      // Test session table creation
      console.log('Testing session table creation...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS session_test (
          sid VARCHAR(255) NOT NULL PRIMARY KEY,
          sess JSON NOT NULL,
          expire TIMESTAMP(6) NOT NULL
        )
      `);
      console.log('Session table test successful');
      
      return 'Connection and query successful';
    } catch (error) {
      console.error('Query error:', error.message);
      if (error.stack) console.error('Error stack:', error.stack);
      if (error.cause) console.error('Error cause:', error.cause);
      return `Query error: ${error.message}`;
    } finally {
      client.release();
      console.log('Client released');
    }
  } catch (error) {
    console.error('Connection error:', error.message);
    if (error.stack) console.error('Error stack:', error.stack);
    if (error.cause) console.error('Error cause:', error.cause);
    return `Connection error: ${error.message}`;
  } finally {
    console.log('Ending test...');
    await pool.end();
    console.log('Pool terminated');
  }
}

// Run the test
console.log('Starting database test...');
testConnection()
  .then(result => {
    console.log('Test completed:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error.message);
    process.exit(1);
  });