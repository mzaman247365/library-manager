# Library Management System

A comprehensive web application for managing book inventory, user registrations, and book borrowing processes in a library setting.

## Features

- **User Authentication**: Secure local login and registration system
- **Book Management**: Search, browse, and manage book inventory
- **Borrowing System**: Track borrowed books with due dates and return functionality
- **Admin Dashboard**: Special access for librarians to manage books and users
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy

## Project Structure

- `/client`: React frontend application
  - `/src/components`: Reusable UI components
  - `/src/pages`: Page components for different routes
  - `/src/hooks`: Custom React hooks
  - `/src/lib`: Utility functions and configuration

- `/server`: Express backend application
  - `auth.ts`: Authentication setup and login/register routes
  - `routes.ts`: API routes for books, users, and borrowing functionality
  - `storage.ts`: Database access layer with Drizzle ORM
  - `db.ts`: Database connection setup

- `/shared`: Common code shared between frontend and backend
  - `schema.ts`: Database schema definitions and TypeScript types

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL database 

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

### Default Credentials

- Admin user: 
  - Username: `admin`
  - Password: `n1mD@`

## API Endpoints

### Authentication
- `POST /api/register`: Create a new user account
- `POST /api/login`: Authenticate a user
- `POST /api/logout`: End the current user session
- `GET /api/user`: Get the current authenticated user

### Books
- `GET /api/books`: Get all books
- `GET /api/books/:id`: Get a specific book
- `POST /api/books`: Create a new book (admin only)
- `PUT /api/books/:id`: Update a book (admin only)
- `DELETE /api/books/:id`: Delete a book (admin only)

### Borrowing
- `GET /api/borrows`: Get all borrows (admin only)
- `GET /api/borrows/user`: Get borrows for the current user
- `POST /api/borrows`: Borrow a book
- `PUT /api/borrows/:id/return`: Return a borrowed book

### Users
- `GET /api/users`: Get all users (admin only)
- `GET /api/users/:id`: Get a specific user (admin only)
- `PUT /api/users/:id`: Update a user (admin only)
- `DELETE /api/users/:id`: Delete a user (admin only)

## License

MIT