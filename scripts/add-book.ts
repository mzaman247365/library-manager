import { Pool } from '@neondatabase/serverless';
import readline from 'readline';

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
    // Get book details
    const title = await prompt('Enter book title: ');
    const author = await prompt('Enter book author: ');
    const isbn = await prompt('Enter ISBN (optional): ');
    const publishYearStr = await prompt('Enter publish year (optional): ');
    const publisher = await prompt('Enter publisher (optional): ');
    const description = await prompt('Enter description (optional): ');
    const category = await prompt('Enter category (optional): ');
    const pageCountStr = await prompt('Enter page count (optional): ');
    const coverImage = await prompt('Enter cover image URL (optional): ');
    const totalCopiesStr = await prompt('Enter total copies (default 1): ');
    const availableCopiesStr = await prompt('Enter available copies (default = total): ');
    const averageRatingStr = await prompt('Enter average rating (0-5, optional): ');
    const language = await prompt('Enter language (default "English"): ');

    // Convert string inputs to appropriate types
    const publishYear = publishYearStr ? parseInt(publishYearStr) : null;
    const pageCount = pageCountStr ? parseInt(pageCountStr) : null;
    const totalCopies = totalCopiesStr ? parseInt(totalCopiesStr) : 1;
    const availableCopies = availableCopiesStr ? parseInt(availableCopiesStr) : totalCopies;
    const averageRating = averageRatingStr ? parseFloat(averageRatingStr) : null;

    // Insert the new book
    const result = await pool.query(
      `INSERT INTO books (
        title, author, isbn, "publishYear", publisher, description, 
        category, "pageCount", "coverImage", "totalCopies", 
        "availableCopies", "averageRating", language
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, title, author`,
      [
        title, author, isbn || null, publishYear, publisher || null, 
        description || null, category || null, pageCount, coverImage || null, 
        totalCopies, availableCopies, averageRating, language || 'English'
      ]
    );

    const newBook = result.rows[0];
    console.log(`Book added successfully:`);
    console.log(`- ID: ${newBook.id}`);
    console.log(`- Title: ${newBook.title}`);
    console.log(`- Author: ${newBook.author}`);
  } catch (error) {
    console.error('Error adding book:', error);
  } finally {
    await pool.end();
  }
}

main();