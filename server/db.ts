import { config } from 'dotenv';
import * as schema from "@shared/schema";
import * as pg from 'pg';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Load environment variables
config();

// Database configuration options
const dbType = process.env.DB_TYPE || 'neon';
const useWebSockets = process.env.USE_WEBSOCKETS === 'true';

// Initialize database connection
let pool: any;
let db: any;

// Configure connection based on database type
if (dbType === 'neon') {
  // Always set WebSocket for Neon connections
  // This is required for serverless environments like Replit
  neonConfig.webSocketConstructor = ws;
  
  // Validate connection string
  if (!process.env.NEON_DATABASE_URL && !process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set when using Neon database type.");
  }
  
  // Connect to Neon database
  const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  pool = new NeonPool({ connectionString });
  db = drizzle(pool, { schema });
  
  console.log('Connected to Neon PostgreSQL database');
} else {
  // Setup standard PostgreSQL connection
  const requiredEnvVars = ['PGHOST', 'PGUSER', 'PGDATABASE'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables for PostgreSQL connection: ${missingVars.join(', ')}`
    );
  }
  
  // Connect to standard PostgreSQL
  pool = new pg.Pool({
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  });
  
  db = drizzle(pool, { schema });
  
  console.log('Connected to standard PostgreSQL database');
}

// Export database connection
export { pool, db };