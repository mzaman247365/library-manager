-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS borrows;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS users;

-- Create Users Table
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

-- Create Books Table
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(20) UNIQUE,
  publication_year INTEGER,
  publisher VARCHAR(255),
  description TEXT,
  category VARCHAR(100),
  page_count INTEGER,
  cover_image VARCHAR(255),
  available_copies INTEGER DEFAULT 1,
  total_copies INTEGER DEFAULT 1,
  average_rating DECIMAL(3,2),
  language VARCHAR(50) DEFAULT 'English'
);

-- Create Borrows Table
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

-- Insert Admin User
-- Password is hashed version of 'admin123'
INSERT INTO users (username, password, full_name, is_admin, email)
VALUES (
  'admin',
  '$2b$12$g89e2bZU6V8rg7T710h65.p1A1ty2ByqC.VJcJQwvlie9woiA3ziG',
  'Administrator',
  TRUE,
  'admin@library.local'
);

-- Insert Regular User
-- Password is hashed version of 'user123'
INSERT INTO users (username, password, full_name, is_admin, email)
VALUES (
  'user',
  '$2b$12$ECk7j1T/ZP5NnfWzQ3StZuWEv0A8AKjDQYGE9HbDXOoHwsEQYOQT.',
  'Regular User',
  FALSE,
  'user@library.local'
);

-- Insert Sample Books
INSERT INTO books (title, author, isbn, publication_year, publisher, description, category, page_count, cover_image, available_copies, total_copies, average_rating, language)
VALUES
  (
    'To Kill a Mockingbird',
    'Harper Lee',
    '9780061120084',
    1960,
    'HarperCollins',
    'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it. "To Kill A Mockingbird" became both an instant bestseller and a critical success when it was first published in 1960. It went on to win the Pulitzer Prize in 1961 and was later made into an Academy Award-winning film, also a classic.',
    'Fiction',
    336,
    'https://images-na.ssl-images-amazon.com/images/I/71FxgtFKcQL.jpg',
    3,
    5,
    4.5,
    'English'
  ),
  (
    '1984',
    'George Orwell',
    '9780451524935',
    1949,
    'Signet Classic',
    'Among the seminal texts of the 20th century, Nineteen Eighty-Four is a rare work that grows more haunting as its futuristic purgatory becomes more real. Published in 1949, the book offers political satirist George Orwell's nightmare vision of a totalitarian, bureaucratic world and one poor stiff's attempt to find individuality.',
    'Science Fiction',
    328,
    'https://images-na.ssl-images-amazon.com/images/I/71kxa1-0mfL.jpg',
    2,
    4,
    4.3,
    'English'
  ),
  (
    'The Great Gatsby',
    'F. Scott Fitzgerald',
    '9780743273565',
    1925,
    'Scribner',
    'The Great Gatsby, F. Scott Fitzgerald's third book, stands as the supreme achievement of his career. This exemplary novel of the Jazz Age has been acclaimed by generations of readers. The story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan, of lavish parties on Long Island at a time when The New York Times noted "gin was the national drink and sex the national obsession," it is an exquisitely crafted tale of America in the 1920s.',
    'Classic',
    180,
    'https://images-na.ssl-images-amazon.com/images/I/71FTb9X6wsL.jpg',
    1,
    3,
    4.0,
    'English'
  ),
  (
    'Pride and Prejudice',
    'Jane Austen',
    '9780141439518',
    1813,
    'Penguin Classics',
    'Since its immediate success in 1813, Pride and Prejudice has remained one of the most popular novels in the English language. Jane Austen called this brilliant work "her own darling child" and its vivacious heroine, Elizabeth Bennet, "as delightful a creature as ever appeared in print."',
    'Romance',
    480,
    'https://images-na.ssl-images-amazon.com/images/I/71Q1tPupKjL.jpg',
    2,
    2,
    4.7,
    'English'
  ),
  (
    'The Hobbit',
    'J.R.R. Tolkien',
    '9780547928227',
    1937,
    'Houghton Mifflin Harcourt',
    'Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life, rarely traveling any farther than his pantry or cellar. But his contentment is disturbed when the wizard Gandalf and a company of dwarves arrive on his doorstep one day to whisk him away on an adventure.',
    'Fantasy',
    320,
    'https://images-na.ssl-images-amazon.com/images/I/81WcnNQ-TBL.jpg',
    0,
    2,
    4.8,
    'English'
  ),
  (
    'Brave New World',
    'Aldous Huxley',
    '9780060850524',
    1932,
    'Harper Perennial',
    'Aldous Huxley's profoundly important classic of world literature, Brave New World is a searching vision of an unequal, technologically-advanced future where humans are genetically bred, socially indoctrinated, and pharmaceutically anesthetized to passively uphold an authoritarian ruling order.',
    'Science Fiction',
    288,
    'https://images-na.ssl-images-amazon.com/images/I/81zE42gT3xL.jpg',
    1,
    1,
    4.2,
    'English'
  ),
  (
    'The Catcher in the Rye',
    'J.D. Salinger',
    '9780316769488',
    1951,
    'Little, Brown and Company',
    'The hero-narrator of The Catcher in the Rye is an ancient child of sixteen, a native New Yorker named Holden Caulfield. Through circumstances that tend to preclude adult, secondhand description, he leaves his prep school in Pennsylvania and goes underground in New York City for three days.',
    'Fiction',
    224,
    'https://images-na.ssl-images-amazon.com/images/I/81OthjkJBuL.jpg',
    3,
    3,
    4.1,
    'English'
  ),
  (
    'Moby-Dick',
    'Herman Melville',
    '9780142437247',
    1851,
    'Penguin Classics',
    '"Call me Ishmael." Thus begins one of the most famous journeys in literature—the voyage of the whaling ship Pequod and its embattled, monomaniacal Captain Ahab. Ishmael quickly learns that the Pequod's captain sails for revenge against the elusive Moby Dick, a sperm whale with a snow-white hump and mottled skin that had destroyed Ahab's former vessel and left him crippled.',
    'Adventure',
    720,
    'https://images-na.ssl-images-amazon.com/images/I/41h1CVFjjdL.jpg',
    1,
    1,
    3.9,
    'English'
  ),
  (
    'The Lord of the Rings',
    'J.R.R. Tolkien',
    '9780618640157',
    1954,
    'Mariner Books',
    'In ancient times the Rings of Power were crafted by the Elven-smiths, and Sauron, the Dark Lord, forged the One Ring, filling it with his own power so that he could rule all others. But the One Ring was taken from him, and though he sought it throughout Middle-earth, it remained lost to him. After many ages it fell into the hands of Bilbo Baggins, as told in The Hobbit.',
    'Fantasy',
    1178,
    'https://images-na.ssl-images-amazon.com/images/I/51EstVXM1UL.jpg',
    1,
    1,
    4.9,
    'English'
  ),
  (
    'Crime and Punishment',
    'Fyodor Dostoevsky',
    '9780143058144',
    1866,
    'Penguin Classics',
    'Raskolnikov, a destitute and desperate former student, wanders through the slums of St Petersburg and commits a random murder without remorse or regret. He imagines himself to be a great man, a Napoleon: acting for a higher purpose beyond conventional moral law. But as he embarks on a dangerous game of cat and mouse with a suspicious police investigator, Raskolnikov is pursued by the growing voice of his conscience and finds the noose of his own guilt tightening around his neck.',
    'Classic',
    671,
    'https://images-na.ssl-images-amazon.com/images/I/81JdFbMw5QL.jpg',
    2,
    2,
    4.4,
    'English'
  );

-- Insert Sample Borrows (None are active as default)
-- Let's add some sample borrow history
INSERT INTO borrows (user_id, book_id, borrow_date, due_date, return_date, is_returned)
VALUES
  (
    2, 1, 
    CURRENT_TIMESTAMP - INTERVAL '60 days', 
    CURRENT_TIMESTAMP - INTERVAL '46 days',
    CURRENT_TIMESTAMP - INTERVAL '50 days',
    TRUE
  ),
  (
    2, 3, 
    CURRENT_TIMESTAMP - INTERVAL '45 days', 
    CURRENT_TIMESTAMP - INTERVAL '31 days',
    CURRENT_TIMESTAMP - INTERVAL '32 days',
    TRUE
  ),
  (
    2, 5, 
    CURRENT_TIMESTAMP - INTERVAL '30 days', 
    CURRENT_TIMESTAMP - INTERVAL '16 days',
    NULL,
    FALSE
  );

-- Add 'The Hobbit' as currently borrowed (matches the 0 available copies)
UPDATE books SET available_copies = 0 WHERE title = 'The Hobbit';