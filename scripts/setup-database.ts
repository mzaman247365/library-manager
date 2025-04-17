import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Create a pool connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Reading initialization SQL file...');
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'init-database.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Executing SQL script...');
    // Execute the SQL script
    await pool.query(sqlScript);

    console.log('Database setup completed successfully!');
    console.log('\nDefault credentials:');
    console.log('Admin user:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('\nRegular user:');
    console.log('  Username: user');
    console.log('  Password: user123');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await pool.end();
  }
}

main();