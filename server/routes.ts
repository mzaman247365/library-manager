import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { Book, Borrow } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  // Setup authentication and get middleware
  const { isAuthenticated, isAdmin } = setupAuth(app);

  // Books API
  app.get("/api/books", async (req, res) => {
    try {
      const books = await storage.getAllBooks();
      res.json(books);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ error: "Failed to fetch books" });
    }
  });

  app.get("/api/books/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      const books = await storage.searchBooks(query);
      res.json(books);
    } catch (error) {
      console.error("Error searching books:", error);
      res.status(500).json({ error: "Failed to search books" });
    }
  });

  app.get("/api/books/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid book ID" });
      }
      
      const book = await storage.getBook(id);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      
      res.json(book);
    } catch (error) {
      console.error("Error fetching book:", error);
      res.status(500).json({ error: "Failed to fetch book" });
    }
  });

  // Protected book management routes
  app.post("/api/books", isAdmin, async (req, res) => {
    try {
      const bookData = req.body;
      
      // Check if ISBN already exists
      if (bookData.isbn) {
        const existingBook = await storage.getBookByISBN(bookData.isbn);
        if (existingBook) {
          return res.status(400).json({ error: "Book with this ISBN already exists" });
        }
      }
      
      const book = await storage.createBook(bookData);
      res.status(201).json(book);
    } catch (error) {
      console.error("Error creating book:", error);
      res.status(500).json({ error: "Failed to create book" });
    }
  });

  app.patch("/api/books/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid book ID" });
      }
      
      const bookData = req.body;
      const book = await storage.updateBook(id, bookData);
      
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      
      res.json(book);
    } catch (error) {
      console.error("Error updating book:", error);
      res.status(500).json({ error: "Failed to update book" });
    }
  });

  app.delete("/api/books/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid book ID" });
      }
      
      const success = await storage.deleteBook(id);
      if (!success) {
        return res.status(404).json({ error: "Book not found" });
      }
      
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting book:", error);
      res.status(500).json({ error: "Failed to delete book" });
    }
  });

  // Borrow API
  app.post("/api/borrows", isAuthenticated, async (req, res) => {
    try {
      const { bookId, dueDate } = req.body;
      
      if (!bookId || !dueDate) {
        return res.status(400).json({ error: "Book ID and due date are required" });
      }
      
      // Check if book exists and has available copies
      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      
      if (book.availableCopies <= 0) {
        return res.status(400).json({ error: "No available copies of this book" });
      }
      
      // Check if user already has an active borrow for this book
      const userBorrows = await storage.getActiveBorrowsByUser(req.user.id);
      const alreadyBorrowed = userBorrows.some(borrow => borrow.bookId === bookId);
      
      if (alreadyBorrowed) {
        return res.status(400).json({ error: "You already have this book borrowed" });
      }
      
      // Create borrow record
      const borrow = await storage.createBorrow({
        userId: req.user.id,
        bookId,
        borrowDate: new Date(),
        dueDate: new Date(dueDate),
        returnDate: null
      });
      
      // Update available copies
      await storage.updateBook(bookId, {
        availableCopies: book.availableCopies - 1
      });
      
      res.status(201).json(borrow);
    } catch (error) {
      console.error("Error borrowing book:", error);
      res.status(500).json({ error: "Failed to borrow book" });
    }
  });

  app.post("/api/borrows/:id/return", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid borrow ID" });
      }
      
      // Check if borrow exists and belongs to the user
      const borrow = await storage.getBorrow(id);
      if (!borrow) {
        return res.status(404).json({ error: "Borrow record not found" });
      }
      
      if (borrow.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ error: "You don't have permission to return this book" });
      }
      
      // Return the book
      const updatedBorrow = await storage.returnBook(id);
      if (!updatedBorrow) {
        return res.status(404).json({ error: "Borrow record not found" });
      }
      
      // Update available copies
      const book = await storage.getBook(borrow.bookId);
      if (book) {
        await storage.updateBook(borrow.bookId, {
          availableCopies: book.availableCopies + 1
        });
      }
      
      res.json(updatedBorrow);
    } catch (error) {
      console.error("Error returning book:", error);
      res.status(500).json({ error: "Failed to return book" });
    }
  });

  app.get("/api/borrows", isAuthenticated, async (req, res) => {
    try {
      let borrows;
      
      if (req.user.isAdmin) {
        borrows = await storage.getAllBorrows();
      } else {
        borrows = await storage.getBorrowsByUser(req.user.id);
      }
      
      res.json(borrows);
    } catch (error) {
      console.error("Error fetching borrows:", error);
      res.status(500).json({ error: "Failed to fetch borrows" });
    }
  });

  app.get("/api/borrows/active", isAuthenticated, async (req, res) => {
    try {
      const borrows = await storage.getActiveBorrowsByUser(req.user.id);
      res.json(borrows);
    } catch (error) {
      console.error("Error fetching active borrows:", error);
      res.status(500).json({ error: "Failed to fetch active borrows" });
    }
  });

  // User management (admin only)
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
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const userData = req.body;
      
      // Don't allow updating passwords through this endpoint
      if (userData.password) {
        delete userData.password;
      }
      
      const user = await storage.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Remove password from response
      const { password, ...safeUser } = user;
      
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Prevent deleting self
      if (id === req.user.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}