import { Pool, neonConfig } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';
import path from 'path';
import ws from 'ws';

// Configure Neon to use WebSocket
neonConfig.webSocketConstructor = ws;

async function createTables(pool: Pool) {
  // Drop tables if they exist (in reverse order of dependencies)
  await pool.query(`
    DROP TABLE IF EXISTS borrows;
    DROP TABLE IF EXISTS books;
    DROP TABLE IF EXISTS users;
  `);

  // Create users table
  await pool.query(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      is_admin BOOLEAN DEFAULT FALSE,
      oauth_provider VARCHAR(255),
      oauth_id VARCHAR(255),
      email VARCHAR(255),
      profile_image VARCHAR(255)
    );
  `);

  // Create books table
  await pool.query(`
    CREATE TABLE books (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      isbn VARCHAR(20) UNIQUE NOT NULL,
      publication_year INTEGER,
      publisher VARCHAR(255),
      description TEXT,
      category VARCHAR(100),
      page_count INTEGER,
      cover_image VARCHAR(255),
      available_copies INTEGER DEFAULT 1,
      total_copies INTEGER DEFAULT 1,
      average_rating VARCHAR(10),
      language VARCHAR(50) DEFAULT 'English'
    );
  `);

  // Create borrows table
  await pool.query(`
    CREATE TABLE borrows (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
      borrow_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      due_date TIMESTAMP WITH TIME ZONE NOT NULL,
      return_date TIMESTAMP WITH TIME ZONE,
      is_returned BOOLEAN DEFAULT FALSE,
      CONSTRAINT borrow_unique UNIQUE (user_id, book_id, borrow_date)
    );

    -- Create index for faster querying
    CREATE INDEX idx_borrows_user_id ON borrows(user_id);
    CREATE INDEX idx_borrows_book_id ON borrows(book_id);
    CREATE INDEX idx_borrows_is_returned ON borrows(is_returned);
    CREATE INDEX idx_books_title ON books(title);
    CREATE INDEX idx_books_author ON books(author);
    CREATE INDEX idx_books_category ON books(category);
  `);
}

// Function to insert users with hashed passwords (already hashed for our default users)
async function insertUsers(pool: Pool) {
  const adminHash = '$2b$12$g89e2bZU6V8rg7T710h65.p1A1ty2ByqC.VJcJQwvlie9woiA3ziG'; // admin123
  const userHash = '$2b$12$ECk7j1T/ZP5NnfWzQ3StZuWEv0A8AKjDQYGE9HbDXOoHwsEQYOQT.'; // user123

  // Insert admin user
  await pool.query(`
    INSERT INTO users (username, password, full_name, is_admin, email)
    VALUES ($1, $2, $3, $4, $5)
  `, ['admin', adminHash, 'Administrator', true, 'admin@library.local']);

  // Insert regular user
  await pool.query(`
    INSERT INTO users (username, password, full_name, is_admin, email)
    VALUES ($1, $2, $3, $4, $5)
  `, ['user', userHash, 'Regular User', false, 'user@library.local']);
}

// Function to insert sample books
async function insertBooks(pool: Pool) {
  const books = [
    {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '9780061120084',
      publicationYear: 1960,
      publisher: 'HarperCollins',
      description: 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it. "To Kill A Mockingbird" became both an instant bestseller and a critical success when it was first published in 1960. It went on to win the Pulitzer Prize in 1961 and was later made into an Academy Award-winning film, also a classic.',
      category: 'Fiction',
      pageCount: 336,
      coverImage: 'https://images-na.ssl-images-amazon.com/images/I/71FxgtFKcQL.jpg',
      availableCopies: 3,
      totalCopies: 5,
      averageRating: 4.5,
      language: 'English'
    },
    {
      title: '1984',
      author: 'George Orwell',
      isbn: '9780451524935',
      publicationYear: 1949,
      publisher: 'Signet Classic',
      description: 'Among the seminal texts of the 20th century, Nineteen Eighty-Four is a rare work that grows more haunting as its futuristic purgatory becomes more real. Published in 1949, the book offers political satirist George Orwell\'s nightmare vision of a totalitarian, bureaucratic world and one poor stiff\'s attempt to find individuality.',
      category: 'Science Fiction',
      pageCount: 328,
      coverImage: 'https://images-na.ssl-images-amazon.com/images/I/71kxa1-0mfL.jpg',
      availableCopies: 2,
      totalCopies: 4,
      averageRating: 4.3,
      language: 'English'
    },
    {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '9780743273565',
      publicationYear: 1925,
      publisher: 'Scribner',
      description: 'The Great Gatsby, F. Scott Fitzgerald\'s third book, stands as the supreme achievement of his career. This exemplary novel of the Jazz Age has been acclaimed by generations of readers. The story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan, of lavish parties on Long Island at a time when The New York Times noted "gin was the national drink and sex the national obsession," it is an exquisitely crafted tale of America in the 1920s.',
      category: 'Classic',
      pageCount: 180,
      coverImage: 'https://images-na.ssl-images-amazon.com/images/I/71FTb9X6wsL.jpg',
      availableCopies: 1,
      totalCopies: 3,
      averageRating: 4.0,
      language: 'English'
    },
    {
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      isbn: '9780141439518',
      publicationYear: 1813,
      publisher: 'Penguin Classics',
      description: 'Since its immediate success in 1813, Pride and Prejudice has remained one of the most popular novels in the English language. Jane Austen called this brilliant work "her own darling child" and its vivacious heroine, Elizabeth Bennet, "as delightful a creature as ever appeared in print."',
      category: 'Romance',
      pageCount: 480,
      coverImage: 'https://images-na.ssl-images-amazon.com/images/I/71Q1tPupKjL.jpg',
      availableCopies: 2,
      totalCopies: 2,
      averageRating: 4.7,
      language: 'English'
    },
    {
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      isbn: '9780547928227',
      publicationYear: 1937,
      publisher: 'Houghton Mifflin Harcourt',
      description: 'Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life, rarely traveling any farther than his pantry or cellar. But his contentment is disturbed when the wizard Gandalf and a company of dwarves arrive on his doorstep one day to whisk him away on an adventure.',
      category: 'Fantasy',
      pageCount: 320,
      coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81WcnNQ-TBL.jpg',
      availableCopies: 0,
      totalCopies: 2,
      averageRating: 4.8,
      language: 'English'
    },
    {
      title: 'Brave New World',
      author: 'Aldous Huxley',
      isbn: '9780060850524',
      publicationYear: 1932,
      publisher: 'Harper Perennial',
      description: 'Aldous Huxley\'s profoundly important classic of world literature, Brave New World is a searching vision of an unequal, technologically-advanced future where humans are genetically bred, socially indoctrinated, and pharmaceutically anesthetized to passively uphold an authoritarian ruling order.',
      category: 'Science Fiction',
      pageCount: 288,
      coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81zE42gT3xL.jpg',
      availableCopies: 1,
      totalCopies: 1,
      averageRating: 4.2,
      language: 'English'
    },
    {
      title: 'The Catcher in the Rye',
      author: 'J.D. Salinger',
      isbn: '9780316769488',
      publicationYear: 1951,
      publisher: 'Little, Brown and Company',
      description: 'The hero-narrator of The Catcher in the Rye is an ancient child of sixteen, a native New Yorker named Holden Caulfield. Through circumstances that tend to preclude adult, secondhand description, he leaves his prep school in Pennsylvania and goes underground in New York City for three days.',
      category: 'Fiction',
      pageCount: 224,
      coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81OthjkJBuL.jpg',
      availableCopies: 3,
      totalCopies: 3,
      averageRating: 4.1,
      language: 'English'
    },
    {
      title: 'Moby-Dick',
      author: 'Herman Melville',
      isbn: '9780142437247',
      publicationYear: 1851,
      publisher: 'Penguin Classics',
      description: '"Call me Ishmael." Thus begins one of the most famous journeys in literature—the voyage of the whaling ship Pequod and its embattled, monomaniacal Captain Ahab. Ishmael quickly learns that the Pequod\'s captain sails for revenge against the elusive Moby Dick, a sperm whale with a snow-white hump and mottled skin that had destroyed Ahab\'s former vessel and left him crippled.',
      category: 'Adventure',
      pageCount: 720,
      coverImage: 'https://images-na.ssl-images-amazon.com/images/I/41h1CVFjjdL.jpg',
      availableCopies: 1,
      totalCopies: 1,
      averageRating: 3.9,
      language: 'English'
    },
    {
      title: 'The Lord of the Rings',
      author: 'J.R.R. Tolkien',
      isbn: '9780618640157',
      publicationYear: 1954,
      publisher: 'Mariner Books',
      description: 'In ancient times the Rings of Power were crafted by the Elven-smiths, and Sauron, the Dark Lord, forged the One Ring, filling it with his own power so that he could rule all others. But the One Ring was taken from him, and though he sought it throughout Middle-earth, it remained lost to him. After many ages it fell into the hands of Bilbo Baggins, as told in The Hobbit.',
      category: 'Fantasy',
      pageCount: 1178,
      coverImage: 'https://images-na.ssl-images-amazon.com/images/I/51EstVXM1UL.jpg',
      availableCopies: 1,
      totalCopies: 1,
      averageRating: 4.9,
      language: 'English'
    },
    {
      title: 'Crime and Punishment',
      author: 'Fyodor Dostoevsky',
      isbn: '9780143058144',
      publicationYear: 1866,
      publisher: 'Penguin Classics',
      description: 'Raskolnikov, a destitute and desperate former student, wanders through the slums of St Petersburg and commits a random murder without remorse or regret. He imagines himself to be a great man, a Napoleon: acting for a higher purpose beyond conventional moral law. But as he embarks on a dangerous game of cat and mouse with a suspicious police investigator, Raskolnikov is pursued by the growing voice of his conscience and finds the noose of his own guilt tightening around his neck.',
      category: 'Classic',
      pageCount: 671,
      coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81JdFbMw5QL.jpg',
      availableCopies: 2,
      totalCopies: 2,
      averageRating: 4.4,
      language: 'English'
    }
  ];

  // Use prepared statements to safely handle any special characters
  for (const book of books) {
    await pool.query(`
      INSERT INTO books (
        title, author, isbn, publication_year, publisher, description, 
        category, page_count, cover_image, available_copies, 
        total_copies, average_rating, language
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      book.title, book.author, book.isbn, book.publicationYear,
      book.publisher, book.description, book.category, book.pageCount,
      book.coverImage, book.availableCopies, book.totalCopies,
      book.averageRating, book.language
    ]);
  }
}

// Function to insert sample borrows
async function insertBorrows(pool: Pool) {
  // Calculate dates relative to now
  const now = new Date();
  
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);
  
  const fortyFiveDaysAgo = new Date(now);
  fortyFiveDaysAgo.setDate(now.getDate() - 45);
  
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  const fiftyDaysAgo = new Date(now);
  fiftyDaysAgo.setDate(now.getDate() - 50);
  
  const thirtySixDaysAgo = new Date(now);
  thirtySixDaysAgo.setDate(now.getDate() - 36);
  
  const thirtyTwoDaysAgo = new Date(now);
  thirtyTwoDaysAgo.setDate(now.getDate() - 32);
  
  const sixteenDaysAgo = new Date(now);
  sixteenDaysAgo.setDate(now.getDate() - 16);

  // Insert first borrow (already returned)
  await pool.query(`
    INSERT INTO borrows (user_id, book_id, borrow_date, due_date, return_date, is_returned)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [2, 1, sixtyDaysAgo, fortyFiveDaysAgo, fiftyDaysAgo, true]);

  // Insert second borrow (already returned)
  await pool.query(`
    INSERT INTO borrows (user_id, book_id, borrow_date, due_date, return_date, is_returned)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [2, 3, fortyFiveDaysAgo, thirtyDaysAgo, thirtyTwoDaysAgo, true]);

  // Insert third borrow (active)
  await pool.query(`
    INSERT INTO borrows (user_id, book_id, borrow_date, due_date, is_returned)
    VALUES ($1, $2, $3, $4, $5)
  `, [2, 5, thirtyDaysAgo, sixteenDaysAgo, false]);
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
    console.log('Setting up database tables...');
    await createTables(pool);

    console.log('Inserting users...');
    await insertUsers(pool);

    console.log('Inserting books...');
    await insertBooks(pool);

    console.log('Inserting borrows...');
    await insertBorrows(pool);

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