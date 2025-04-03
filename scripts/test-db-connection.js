// Test DB Connection
import pg from 'pg';
const { Pool } = pg;

// Create a new pool with minimal connections and shorter timeout
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // Just one connection for testing
  connectionTimeoutMillis: 10000, // 10 seconds timeout
  idleTimeoutMillis: 10000 // 10 seconds idle timeout
});

console.log('Attempting to connect to database...');
console.log('Database URL format check:', process.env.DATABASE_URL ? 
  `URL starts with: ${process.env.DATABASE_URL.substring(0, 12)}...` : 
  'DATABASE_URL is not defined!');

async function testConnection() {
  let client;
  try {
    // Get a client from the pool
    console.log('Acquiring client from pool...');
    client = await pool.connect();
    
    console.log('Connection established successfully!');
    
    // Try a simple query
    console.log('Executing test query...');
    const result = await client.query('SELECT current_timestamp as time');
    console.log('Query executed successfully!');
    console.log(`Server time: ${result.rows[0].time}`);
    
    // Try to get database information
    console.log('\nFetching database information...');
    const dbInfoResult = await client.query(`
      SELECT current_database() as db_name, 
             current_user as db_user,
             version() as db_version
    `);
    
    console.log('Database Name:', dbInfoResult.rows[0].db_name);
    console.log('Database User:', dbInfoResult.rows[0].db_user);
    console.log('Database Version:', dbInfoResult.rows[0].db_version);
    
    return true;
  } catch (err) {
    console.error('Database connection test failed with error:');
    console.error(err);
    return false;
  } finally {
    // Release the client back to the pool
    if (client) {
      console.log('Releasing client back to pool...');
      client.release();
    }
    
    // End the pool - this is important for the script to finish
    console.log('Ending pool...');
    await pool.end();
  }
}

// Run the test
testConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Database connection test PASSED');
      process.exit(0);
    } else {
      console.log('\n❌ Database connection test FAILED');
      process.exit(1);
    }
  });