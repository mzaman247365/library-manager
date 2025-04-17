# Database Setup Scripts

This directory contains scripts for setting up and managing the PostgreSQL database for the Library Management System.

## Available Scripts

### Database Initialization

The `init-database.sql` file contains the schema definition and sample data for the application. This script will:

1. Drop existing tables if they exist
2. Create new tables with proper relations
3. Create indexes for better performance
4. Insert sample users (admin and regular user)
5. Insert sample books
6. Insert sample borrow records

### Setup Database Script

The `setup-database.ts` script executes the SQL initialization script against your database:

```bash
# Run the database setup script
npx tsx scripts/setup-database.ts
```

Make sure your DATABASE_URL environment variable is properly set before running this script.

### Add Admin User

The `add-admin.ts` script helps you create a new admin user interactively:

```bash
# Create a new admin user
npx tsx scripts/add-admin.ts
```

You will be prompted to enter:
- Username
- Password 
- Full name
- Email

### Add Book

The `add-book.ts` script allows you to add a new book to the system interactively:

```bash
# Add a new book
npx tsx scripts/add-book.ts
```

You will be prompted to enter various book details such as title, author, ISBN, etc.

## Default Admin Credentials

The initialization script creates one admin user with the following credentials:

- Username: `admin`
- Password: `admin123`
- Email: `admin@library.local`

## Default Regular User Credentials

A regular user account is also created:

- Username: `user`
- Password: `user123`
- Email: `user@library.local`