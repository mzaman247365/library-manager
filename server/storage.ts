import { users, type User, type InsertUser, books, type Book, type InsertBook, borrows, type Borrow, type InsertBorrow } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private books: Map<number, Book>;
  private borrows: Map<number, Borrow>;
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private bookIdCounter: number;
  private borrowIdCounter: number;

  constructor() {
    this.users = new Map();
    this.books = new Map();
    this.borrows = new Map();
    this.userIdCounter = 1;
    this.bookIdCounter = 1;
    this.borrowIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      fullName: "Admin User",
      isAdmin: true,
    });
    
    // Create sample books
    this.createBook({
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      isbn: "9780061120084",
      description: "A classic novel about a young girl's coming-of-age in a Southern town, as her father defends a black man unjustly accused of a crime.",
      category: "Fiction",
      coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
      totalCopies: 5,
      availableCopies: 5,
      publicationYear: 1960
    });
    
    this.createBook({
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      isbn: "9780743273565",
      description: "Set in the Jazz Age, this novel tells the tragic story of Jay Gatsby and his obsession with Daisy Buchanan.",
      category: "Fiction",
      coverImage: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
      totalCopies: 3,
      availableCopies: 3,
      publicationYear: 1925
    });
    
    this.createBook({
      title: "1984",
      author: "George Orwell",
      isbn: "9780451524935",
      description: "A dystopian novel about totalitarianism, surveillance, and the suppression of truth.",
      category: "Science Fiction",
      coverImage: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80",
      totalCopies: 4,
      availableCopies: 4,
      publicationYear: 1949
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  // Book operations
  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }
  
  async getBookByISBN(isbn: string): Promise<Book | undefined> {
    return Array.from(this.books.values()).find(
      (book) => book.isbn === isbn
    );
  }
  
  async createBook(insertBook: InsertBook): Promise<Book> {
    const id = this.bookIdCounter++;
    const book: Book = { ...insertBook, id };
    this.books.set(id, book);
    return book;
  }
  
  async updateBook(id: number, book: Partial<InsertBook>): Promise<Book | undefined> {
    const existingBook = this.books.get(id);
    if (!existingBook) return undefined;
    
    const updatedBook = { ...existingBook, ...book };
    this.books.set(id, updatedBook);
    return updatedBook;
  }
  
  async deleteBook(id: number): Promise<boolean> {
    return this.books.delete(id);
  }
  
  async getAllBooks(): Promise<Book[]> {
    return Array.from(this.books.values());
  }
  
  async searchBooks(query: string): Promise<Book[]> {
    if (!query) return this.getAllBooks();
    
    query = query.toLowerCase();
    return Array.from(this.books.values()).filter(
      (book) => 
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.isbn.toLowerCase().includes(query) ||
        (book.category && book.category.toLowerCase().includes(query)) ||
        (book.description && book.description.toLowerCase().includes(query))
    );
  }
  
  // Borrow operations
  async getBorrow(id: number): Promise<Borrow | undefined> {
    return this.borrows.get(id);
  }
  
  async createBorrow(insertBorrow: InsertBorrow): Promise<Borrow> {
    const id = this.borrowIdCounter++;
    const borrow: Borrow = { 
      ...insertBorrow, 
      id, 
      borrowDate: new Date(),
      returnDate: null,
      isReturned: false
    };
    
    // Update book available copies
    const book = this.books.get(borrow.bookId);
    if (book && book.availableCopies > 0) {
      book.availableCopies -= 1;
      this.books.set(book.id, book);
    }
    
    this.borrows.set(id, borrow);
    return borrow;
  }
  
  async returnBook(id: number): Promise<Borrow | undefined> {
    const borrow = this.borrows.get(id);
    if (!borrow || borrow.isReturned) return undefined;
    
    // Update the borrow record
    borrow.isReturned = true;
    borrow.returnDate = new Date();
    this.borrows.set(id, borrow);
    
    // Update book available copies
    const book = this.books.get(borrow.bookId);
    if (book) {
      book.availableCopies += 1;
      this.books.set(book.id, book);
    }
    
    return borrow;
  }
  
  async getBorrowsByUser(userId: number): Promise<(Borrow & { book: Book })[]> {
    const userBorrows = Array.from(this.borrows.values())
      .filter(borrow => borrow.userId === userId);
    
    return userBorrows.map(borrow => {
      const book = this.books.get(borrow.bookId);
      return {
        ...borrow,
        book: book!
      };
    });
  }
  
  async getActiveBorrowsByUser(userId: number): Promise<(Borrow & { book: Book })[]> {
    const userBorrows = Array.from(this.borrows.values())
      .filter(borrow => borrow.userId === userId && !borrow.isReturned);
    
    return userBorrows.map(borrow => {
      const book = this.books.get(borrow.bookId);
      return {
        ...borrow,
        book: book!
      };
    });
  }
  
  async getAllBorrows(): Promise<(Borrow & { user: User, book: Book })[]> {
    return Array.from(this.borrows.values()).map(borrow => {
      const user = this.users.get(borrow.userId);
      const book = this.books.get(borrow.bookId);
      return {
        ...borrow,
        user: user!,
        book: book!
      };
    });
  }
}

export const storage = new MemStorage();
