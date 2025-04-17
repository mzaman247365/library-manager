import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Load environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

async function main() {
  console.log('Starting database setup...');

  // Create a new pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'init-database.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Executing SQL script...');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

main();