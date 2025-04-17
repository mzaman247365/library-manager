import { Pool } from '@neondatabase/serverless';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import readline from 'readline';

const scryptAsync = promisify(scrypt);

// Function to hash password
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Function to get user input
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Create a pool connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Get admin details
    const username = await prompt('Enter admin username: ');
    const password = await prompt('Enter admin password: ');
    const fullName = await prompt('Enter admin full name: ');
    const email = await prompt('Enter admin email: ');

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Insert the new admin user
    const result = await pool.query(
      `INSERT INTO users (username, password, "fullName", "isAdmin", email)
       VALUES ($1, $2, $3, TRUE, $4)
       RETURNING id, username, "fullName"`,
      [username, hashedPassword, fullName, email]
    );

    const newAdmin = result.rows[0];
    console.log(`Admin user created successfully:`);
    console.log(`- ID: ${newAdmin.id}`);
    console.log(`- Username: ${newAdmin.username}`);
    console.log(`- Full Name: ${newAdmin.fullName}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

main();