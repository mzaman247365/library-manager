import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import path from 'path';

// Configure Neon to use WebSocket
neonConfig.webSocketConstructor = ws;

async function main() {
  try {
    console.log('Starting script execution...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    console.log('Connecting to database...');
    // Create a pool connection
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    console.log('Database connection established!');

    console.log('Adding additional borrows...');
    
    // Check if "reader" user exists, if not create it
    console.log('Checking for "reader" user...');
    const readerCheckResult = await pool.query(`
      SELECT id FROM users WHERE username = 'reader'
    `);
    
    let readerId;
    
    if (readerCheckResult.rows.length === 0) {
      // Create a new reader user
      console.log('Creating new "reader" user...');
      const readerHash = '$2b$12$ECk7j1T/ZP5NnfWzQ3StZuWEv0A8AKjDQYGE9HbDXOoHwsEQYOQT.'; // user123
      const readerResult = await pool.query(`
        INSERT INTO users (username, password, full_name, is_admin, email)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, ['reader', readerHash, 'Avid Reader', false, 'reader@library.local']);
      
      readerId = readerResult.rows[0].id;
      console.log('Created new "reader" user with ID:', readerId);
    } else {
      readerId = readerCheckResult.rows[0].id;
      console.log('Using existing "reader" user with ID:', readerId);
    }
    
    // Calculate dates for borrows
    console.log('Calculating borrow dates...');
    const now = new Date();
    
    // Date calculations for different borrow scenarios
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const twentyDaysAgo = new Date(now);
    twentyDaysAgo.setDate(now.getDate() - 20);
    
    const fifteenDaysAgo = new Date(now);
    fifteenDaysAgo.setDate(now.getDate() - 15);
    
    const tenDaysAgo = new Date(now);
    tenDaysAgo.setDate(now.getDate() - 10);
    
    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setDate(now.getDate() - 5);
    
    const inFiveDays = new Date(now);
    inFiveDays.setDate(now.getDate() + 5);
    
    const inTenDays = new Date(now);
    inTenDays.setDate(now.getDate() + 10);
    
    const inFifteenDays = new Date(now);
    inFifteenDays.setDate(now.getDate() + 15);

    // 1. Add active borrows for "user" (ID 2)
    console.log('Adding active borrows for "user"...');
    
    // Borrow 1 (Pride and Prejudice)
    await pool.query(`
      INSERT INTO borrows (user_id, book_id, borrow_date, due_date, is_returned)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, book_id, borrow_date) DO NOTHING
    `, [2, 4, fifteenDaysAgo, inFifteenDays, false]);
    
    // Update book availability
    await pool.query(`
      UPDATE books 
      SET available_copies = available_copies - 1 
      WHERE id = 4 AND available_copies > 0
    `);
    console.log('Added borrow for "Pride and Prejudice"');

    // Borrow 2 (Brave New World)
    await pool.query(`
      INSERT INTO borrows (user_id, book_id, borrow_date, due_date, is_returned)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, book_id, borrow_date) DO NOTHING
    `, [2, 6, tenDaysAgo, inTenDays, false]);
    
    // Update book availability
    await pool.query(`
      UPDATE books 
      SET available_copies = available_copies - 1 
      WHERE id = 6 AND available_copies > 0
    `);
    console.log('Added borrow for "Brave New World"');

    // 2. Add active borrows for new "reader" user
    console.log('Adding active borrows for "reader"...');
    
    // Borrow 1 (The Catcher in the Rye)
    await pool.query(`
      INSERT INTO borrows (user_id, book_id, borrow_date, due_date, is_returned)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, book_id, borrow_date) DO NOTHING
    `, [readerId, 7, twentyDaysAgo, inFiveDays, false]);
    
    // Update book availability
    await pool.query(`
      UPDATE books 
      SET available_copies = available_copies - 1 
      WHERE id = 7 AND available_copies > 0
    `);
    console.log('Added borrow for "The Catcher in the Rye"');
    
    // Borrow 2 (Moby-Dick)
    await pool.query(`
      INSERT INTO borrows (user_id, book_id, borrow_date, due_date, is_returned)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, book_id, borrow_date) DO NOTHING
    `, [readerId, 8, thirtyDaysAgo, fiveDaysAgo, false]);
    
    // Update book availability
    await pool.query(`
      UPDATE books 
      SET available_copies = available_copies - 1 
      WHERE id = 8 AND available_copies > 0
    `);
    console.log('Added borrow for "Moby-Dick"');
    
    // 3. Add some returned borrows for history
    console.log('Adding returned borrows for history...');
    
    // Returned borrow for user (The Lord of the Rings)
    await pool.query(`
      INSERT INTO borrows (user_id, book_id, borrow_date, due_date, return_date, is_returned)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, book_id, borrow_date) DO NOTHING
    `, [2, 9, thirtyDaysAgo, tenDaysAgo, fiveDaysAgo, true]);
    console.log('Added historical record for "The Lord of the Rings"');
    
    // Returned borrow for reader (1984)
    await pool.query(`
      INSERT INTO borrows (user_id, book_id, borrow_date, due_date, return_date, is_returned)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, book_id, borrow_date) DO NOTHING
    `, [readerId, 2, twentyDaysAgo, tenDaysAgo, fiveDaysAgo, true]);
    console.log('Added historical record for "1984"');

    console.log('Successfully added borrow records!');
    console.log('Summary:');
    console.log('- Added 2 active borrows for "user"');
    console.log('- Added 2 active borrows for "reader"');
    console.log('- Added 2 history records for returned books');
    console.log('- Updated book availability counts');

  } catch (error) {
    console.error('Error adding borrows:', error);
  } finally {
    console.log('Script execution complete.');
    process.exit(0);
  }
}

console.log('Script started');
main().catch(err => {
  console.error('Unhandled error in main:', err);
  process.exit(1);
});
