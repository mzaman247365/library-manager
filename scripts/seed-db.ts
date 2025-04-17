import { db } from "../server/db";
import { users, books } from "../shared/schema";
import bcrypt from "bcrypt";

// Number of salt rounds for bcrypt
const SALT_ROUNDS = 12;

// Helper function to hash a password using bcrypt
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log("Starting database seeding...");

  // Create the admin user with encrypted password
  const adminExists = await db.select().from(users).where(eq(users.username, "admin"));
  if (adminExists.length === 0) {
    console.log("Creating admin user...");
    await db.insert(users).values({
      username: "admin",
      password: await hashPassword("n1mD@"),
      fullName: "Administrator",
      isAdmin: true,
      email: "admin@library.local",
    });
    console.log("Admin user created.");
  } else {
    console.log("Admin user already exists.");
  }

  // Add sample books
  const existingBooks = await db.select().from(books);
  if (existingBooks.length === 0) {
    console.log("Adding sample books...");
    
    const sampleBooks = [
      {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        isbn: "9780061120084",
        description: "A classic novel about a young girl's coming-of-age in a Southern town, as her father defends a black man unjustly accused of a crime.",
        category: "Fiction",
        coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
        totalCopies: 5,
        availableCopies: 5,
        publicationYear: 1960
      },
      {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        isbn: "9780743273565",
        description: "Set in the Jazz Age, this novel tells the tragic story of Jay Gatsby and his obsession with Daisy Buchanan.",
        category: "Fiction",
        coverImage: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
        totalCopies: 3,
        availableCopies: 3,
        publicationYear: 1925
      },
      {
        title: "1984",
        author: "George Orwell",
        isbn: "9780451524935",
        description: "A dystopian novel about totalitarianism, surveillance, and the suppression of truth.",
        category: "Science Fiction",
        coverImage: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
        totalCopies: 4,
        availableCopies: 4,
        publicationYear: 1949
      },
      {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        isbn: "9780141439518",
        description: "A classic romance novel about the emotional development of Elizabeth Bennet, who learns about the repercussions of hasty judgments.",
        category: "Classic",
        coverImage: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
        totalCopies: 3,
        availableCopies: 3,
        publicationYear: 1813
      },
      {
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        isbn: "9780547928227",
        description: "A children's fantasy novel about the adventures of a hobbit named Bilbo Baggins as he journeys to the Lonely Mountain.",
        category: "Fantasy",
        coverImage: "https://images.unsplash.com/photo-1505063366573-38928ae5567e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
        totalCopies: 6,
        availableCopies: 6,
        publicationYear: 1937
      },
      {
        title: "Harry Potter and the Philosopher's Stone",
        author: "J.K. Rowling",
        isbn: "9780747532743",
        description: "The first novel in the Harry Potter series about a young wizard who discovers his magical heritage.",
        category: "Fantasy",
        coverImage: "https://images.unsplash.com/photo-1600189261867-30e5ffe7b8da?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
        totalCopies: 10,
        availableCopies: 10,
        publicationYear: 1997
      },
      {
        title: "The Catcher in the Rye",
        author: "J.D. Salinger",
        isbn: "9780316769488",
        description: "The story of Holden Caulfield, a teenage boy dealing with issues of identity, alienation, and connection.",
        category: "Fiction",
        coverImage: "https://images.unsplash.com/photo-1616681235102-922c0c4edd92?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
        totalCopies: 4,
        availableCopies: 4,
        publicationYear: 1951
      },
      {
        title: "The Lord of the Rings",
        author: "J.R.R. Tolkien",
        isbn: "9780618640157",
        description: "An epic high-fantasy novel set in Middle-earth, following the hobbit Frodo Baggins as he and the Fellowship embark on a quest to destroy the One Ring.",
        category: "Fantasy",
        coverImage: "https://images.unsplash.com/photo-1599136842577-6264eb4c9cae?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
        totalCopies: 5,
        availableCopies: 5,
        publicationYear: 1954
      },
      {
        title: "Brave New World",
        author: "Aldous Huxley",
        isbn: "9780060850524",
        description: "A dystopian novel set in a futuristic World State of genetically modified citizens and an intelligence-based social hierarchy.",
        category: "Science Fiction",
        coverImage: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
        totalCopies: 3,
        availableCopies: 3,
        publicationYear: 1932
      },
      {
        title: "Moby-Dick",
        author: "Herman Melville",
        isbn: "9780142437247",
        description: "The story of Captain Ahab's quest to avenge the whale that 'reaped' his leg, and his obsession with finding and destroying the white whale.",
        category: "Classic",
        coverImage: "https://images.unsplash.com/photo-1580934738772-3d5574752cab?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
        totalCopies: 2,
        availableCopies: 2,
        publicationYear: 1851
      }
    ];

    await db.insert(books).values(sampleBooks);
    console.log(`Added ${sampleBooks.length} sample books.`);
  } else {
    console.log("Sample books already exist.");
  }

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    // Close the database connection
    await db.end?.();
    process.exit(0);
  });