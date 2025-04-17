import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertBookSchema, insertBorrowSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  
  next();
};

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Book routes
  app.get("/api/books", async (req, res) => {
    try {
      const searchQuery = req.query.q as string;
      const books = searchQuery 
        ? await storage.searchBooks(searchQuery)
        : await storage.getAllBooks();
      
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving books" });
    }
  });
  
  app.get("/api/books/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const book = await storage.getBook(id);
      
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      res.json(book);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving book" });
    }
  });
  
  app.post("/api/books", isAdmin, async (req, res) => {
    try {
      const bookData = insertBookSchema.parse(req.body);
      
      // Check if ISBN already exists
      const existingBook = await storage.getBookByISBN(bookData.isbn);
      if (existingBook) {
        return res.status(400).json({ message: "Book with this ISBN already exists" });
      }
      
      const book = await storage.createBook(bookData);
      res.status(201).json(book);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error creating book" });
    }
  });
  
  app.put("/api/books/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const bookData = insertBookSchema.partial().parse(req.body);
      
      // Check if ISBN is being updated and already exists
      if (bookData.isbn) {
        const existingBook = await storage.getBookByISBN(bookData.isbn);
        if (existingBook && existingBook.id !== id) {
          return res.status(400).json({ message: "Book with this ISBN already exists" });
        }
      }
      
      const updatedBook = await storage.updateBook(id, bookData);
      
      if (!updatedBook) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      res.json(updatedBook);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error updating book" });
    }
  });
  
  app.delete("/api/books/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBook(id);
      
      if (!success) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting book" });
    }
  });
  
  // Borrow routes
  app.get("/api/borrows", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (req.user?.isAdmin && req.query.all === 'true') {
        const borrows = await storage.getAllBorrows();
        return res.json(borrows);
      }
      
      const borrows = await storage.getBorrowsByUser(userId!);
      res.json(borrows);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving borrows" });
    }
  });
  
  app.get("/api/borrows/active", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const borrows = await storage.getActiveBorrowsByUser(userId!);
      res.json(borrows);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving active borrows" });
    }
  });
  
  app.post("/api/borrows", isAuthenticated, async (req, res) => {
    try {
      const borrowData = insertBorrowSchema.parse({
        ...req.body,
        userId: req.user?.id
      });
      
      // Check if book exists and is available
      const book = await storage.getBook(borrowData.bookId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      if (book.availableCopies <= 0) {
        return res.status(400).json({ message: "Book is not available for borrowing" });
      }
      
      // Check if user has already borrowed this book and not returned
      const userBorrows = await storage.getActiveBorrowsByUser(req.user!.id);
      const alreadyBorrowed = userBorrows.some(b => b.bookId === borrowData.bookId);
      
      if (alreadyBorrowed) {
        return res.status(400).json({ message: "You have already borrowed this book" });
      }
      
      const borrow = await storage.createBorrow(borrowData);
      res.status(201).json(borrow);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Error borrowing book" });
    }
  });
  
  app.post("/api/borrows/:id/return", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const borrow = await storage.getBorrow(id);
      
      if (!borrow) {
        return res.status(404).json({ message: "Borrow record not found" });
      }
      
      // Check if user is admin or the borrower
      if (!req.user?.isAdmin && borrow.userId !== req.user?.id) {
        return res.status(403).json({ message: "You can only return your own borrowed books" });
      }
      
      // Check if already returned
      if (borrow.isReturned) {
        return res.status(400).json({ message: "Book has already been returned" });
      }
      
      const returnedBorrow = await storage.returnBook(id);
      res.json(returnedBorrow);
    } catch (error) {
      res.status(500).json({ message: "Error returning book" });
    }
  });
  
  // User routes (admin only)
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords from response
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving users" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
