import { pgTable, text, serial, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  
  // OAuth fields
  oauthProvider: text("oauth_provider"),
  oauthId: text("oauth_id").unique(),
  email: text("email").unique(),
  profileImage: text("profile_image"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  isAdmin: true,
  email: true,
  oauthProvider: true,
  oauthId: true,
  profileImage: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Book schema
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  isbn: text("isbn").notNull().unique(),
  description: text("description"),
  category: text("category"),
  coverImage: text("cover_image"),
  totalCopies: integer("total_copies").notNull().default(1),
  availableCopies: integer("available_copies").notNull().default(1),
  publicationYear: integer("publication_year"),
  publisher: text("publisher"),
  pageCount: integer("page_count"),
  averageRating: text("average_rating"),
  language: text("language").default("English"),
});

export const insertBookSchema = createInsertSchema(books).pick({
  title: true,
  author: true,
  isbn: true,
  description: true,
  category: true,
  coverImage: true,
  totalCopies: true,
  availableCopies: true,
  publicationYear: true,
});

export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;

// Borrow schema
export const borrows = pgTable("borrows", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull(),
  userId: integer("user_id").notNull(),
  borrowDate: timestamp("borrow_date").notNull().defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  returnDate: timestamp("return_date"),
  isReturned: boolean("is_returned").default(false).notNull(),
}, (t) => ({
  unq: unique().on(t.bookId, t.userId, t.borrowDate)
}));

export const insertBorrowSchema = createInsertSchema(borrows).pick({
  bookId: true,
  userId: true,
  dueDate: true,
});

export type InsertBorrow = z.infer<typeof insertBorrowSchema>;
export type Borrow = typeof borrows.$inferSelect;

// Extends schemas with validations
export const extendedInsertUserSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
});

export const bookWithValidationSchema = insertBookSchema.extend({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  isbn: z.string().min(10, "ISBN must be at least 10 characters"),
  totalCopies: z.number().int().min(1, "Must have at least 1 copy"),
  availableCopies: z.number().int().min(0, "Available copies cannot be negative"),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;

// Extended types for queries
export type BookWithBorrowStatus = Book & {
  isBorrowed?: boolean;
  dueDate?: Date | string | null;
  borrowId?: number;
};

export interface ActivityItem {
  id: number;
  type: 'borrow' | 'return' | 'reminder';
  bookTitle: string;
  date: Date;
  message: string;
}
