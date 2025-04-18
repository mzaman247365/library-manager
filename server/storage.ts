import { users, type User, type InsertUser, books, type Book, type InsertBook, borrows, type Borrow, type InsertBorrow } from "@shared/schema";
import session from "express-session";
import { db, pool } from "./db";
import { eq, and, like, or, desc, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { config } from 'dotenv';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Load environment variables
config();

// Configure session store based on the database type
const dbType = process.env.DB_TYPE || 'neon';
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByOAuthId(provider: string, oauthId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Book operations
  getBook(id: number): Promise<Book | undefined>;
  getBookByISBN(isbn: string): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, book: Partial<InsertBook>): Promise<Book | undefined>;
  deleteBook(id: number): Promise<boolean>;
  getAllBooks(): Promise<Book[]>;
  searchBooks(query: string): Promise<Book[]>;
  
  // Borrow operations
  getBorrow(id: number): Promise<Borrow | undefined>;
  createBorrow(borrow: InsertBorrow): Promise<Borrow>;
  returnBook(id: number): Promise<Borrow | undefined>;
  getBorrowsByUser(userId: number): Promise<(Borrow & { book: Book })[]>;
  getActiveBorrowsByUser(userId: number): Promise<(Borrow & { book: Book })[]>;
  getAllBorrows(): Promise<(Borrow & { user: User, book: Book })[]>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(sql`LOWER(${users.username})`, username.toLowerCase()));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(sql`LOWER(${users.email})`, email.toLowerCase()));
    return user;
  }

  async getUserByOAuthId(provider: string, oauthId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.oauthProvider, provider),
          eq(users.oauthId, oauthId)
        )
      );
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Book operations
  async getBook(id: number): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book;
  }

  async getBookByISBN(isbn: string): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.isbn, isbn));
    return book;
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const [book] = await db.insert(books).values(insertBook).returning();
    return book;
  }

  async updateBook(id: number, bookData: Partial<InsertBook>): Promise<Book | undefined> {
    const [updatedBook] = await db
      .update(books)
      .set(bookData)
      .where(eq(books.id, id))
      .returning();
    return updatedBook;
  }

  async deleteBook(id: number): Promise<boolean> {
    const result = await db.delete(books).where(eq(books.id, id)).returning();
    return result.length > 0;
  }

  async getAllBooks(): Promise<Book[]> {
    return await db.select().from(books);
  }

  async searchBooks(query: string): Promise<Book[]> {
    if (!query) return this.getAllBooks();

    const searchQuery = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(books)
      .where(
        or(
          like(sql`LOWER(${books.title})`, searchQuery),
          like(sql`LOWER(${books.author})`, searchQuery),
          like(sql`LOWER(${books.isbn})`, searchQuery),
          like(sql`LOWER(${books.category})`, searchQuery),
          like(sql`LOWER(${books.description})`, searchQuery)
        )
      );
  }

  // Borrow operations
  async getBorrow(id: number): Promise<Borrow | undefined> {
    const [borrow] = await db.select().from(borrows).where(eq(borrows.id, id));
    return borrow;
  }

  async createBorrow(insertBorrow: InsertBorrow): Promise<Borrow> {
    // Start a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // Get the book
      const [book] = await tx
        .select()
        .from(books)
        .where(eq(books.id, insertBorrow.bookId));

      if (!book || book.availableCopies <= 0) {
        throw new Error("Book not available for borrowing");
      }

      // Update available copies
      await tx
        .update(books)
        .set({ availableCopies: book.availableCopies - 1 })
        .where(eq(books.id, insertBorrow.bookId));

      // Create borrow record
      const [borrow] = await tx
        .insert(borrows)
        .values({
          ...insertBorrow,
          borrowDate: new Date(),
          returnDate: null,
          isReturned: false,
        })
        .returning();

      return borrow;
    });
  }

  async returnBook(id: number): Promise<Borrow | undefined> {
    // Start a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // Get the borrow record
      const [borrow] = await tx
        .select()
        .from(borrows)
        .where(eq(borrows.id, id));

      if (!borrow || borrow.isReturned) {
        return undefined;
      }

      // Update the borrow record
      const [updatedBorrow] = await tx
        .update(borrows)
        .set({
          isReturned: true,
          returnDate: new Date(),
        })
        .where(eq(borrows.id, id))
        .returning();

      // Update book available copies
      await tx
        .update(books)
        .set({
          availableCopies: sql`${books.availableCopies} + 1`,
        })
        .where(eq(books.id, borrow.bookId));

      return updatedBorrow;
    });
  }

  async getBorrowsByUser(userId: number): Promise<(Borrow & { book: Book })[]> {
    const result = await db
      .select({
        borrow: borrows,
        book: books,
      })
      .from(borrows)
      .where(eq(borrows.userId, userId))
      .innerJoin(books, eq(borrows.bookId, books.id))
      .orderBy(desc(borrows.borrowDate));

    return result.map(({ borrow, book }) => ({ ...borrow, book }));
  }

  async getActiveBorrowsByUser(userId: number): Promise<(Borrow & { book: Book })[]> {
    const result = await db
      .select({
        borrow: borrows,
        book: books,
      })
      .from(borrows)
      .where(
        and(
          eq(borrows.userId, userId),
          eq(borrows.isReturned, false)
        )
      )
      .innerJoin(books, eq(borrows.bookId, books.id))
      .orderBy(desc(borrows.borrowDate));

    return result.map(({ borrow, book }) => ({ ...borrow, book }));
  }

  async getAllBorrows(): Promise<(Borrow & { user: User; book: Book })[]> {
    const result = await db
      .select({
        borrow: borrows,
        user: users,
        book: books,
      })
      .from(borrows)
      .innerJoin(users, eq(borrows.userId, users.id))
      .innerJoin(books, eq(borrows.bookId, books.id))
      .orderBy(desc(borrows.borrowDate));

    return result.map(({ borrow, user, book }) => ({
      ...borrow,
      user,
      book,
    }));
  }
}

export const storage = new DatabaseStorage();
