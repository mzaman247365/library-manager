import { Layout } from "@/components/ui/layout";
import { BookCard } from "@/components/ui/book-card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Book, Borrow } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { BookDetailDialog } from "@/components/ui/book-detail-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BrowseBooks() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Fetch all books
  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books", searchQuery],
    queryFn: async ({ queryKey }) => {
      const [_, query] = queryKey;
      const url = query ? `/api/books?q=${encodeURIComponent(query as string)}` : "/api/books";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch books");
      return res.json();
    },
  });

  // Fetch active borrows for current user
  const { data: activeBorrows } = useQuery<(Borrow & { book: Book })[]>({
    queryKey: ["/api/borrows/active"],
  });

  // Borrow book mutation
  const borrowBookMutation = useMutation({
    mutationFn: async (bookId: number) => {
      // Set due date to 14 days from now
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      
      const res = await apiRequest("POST", "/api/borrows", {
        bookId,
        dueDate
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Book borrowed",
        description: "You have successfully borrowed this book.",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/borrows/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (error) => {
      toast({
        title: "Error borrowing book",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to check if user has already borrowed a specific book
  const isBookBorrowed = (bookId: number) => {
    return activeBorrows?.some(borrow => borrow.bookId === bookId);
  };

  // Handle book borrow
  const handleBorrowBook = (book: Book) => {
    if (book.availableCopies <= 0) {
      toast({
        title: "Book unavailable",
        description: "This book is currently unavailable for borrowing.",
        variant: "destructive",
      });
      return;
    }
    
    borrowBookMutation.mutate(book.id);
  };

  // Extract unique categories
  const categories = books 
    ? [...new Set(books.filter(book => book.category).map(book => book.category))]
    : [];

  // Filter books by category if selected
  const filteredBooks = selectedCategory
    ? books?.filter(book => book.category === selectedCategory)
    : books;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h2 className="text-2xl font-medium">Browse Books</h2>
          
          <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
            <div className="relative md:w-64">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Search by title, author, or ISBN..." 
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select 
              value={selectedCategory} 
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category!}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredBooks && filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onBorrow={handleBorrowBook}
                onDetails={() => setSelectedBook(book)}
                isBorrowed={isBookBorrowed(book.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory 
                ? "No books found matching your criteria." 
                : "No books available in the library."}
            </p>
          </div>
        )}
      </div>

      {/* Book Details Dialog */}
      {selectedBook && (
        <BookDetailDialog
          book={selectedBook}
          open={!!selectedBook}
          onClose={() => setSelectedBook(null)}
          onBorrow={() => {
            handleBorrowBook(selectedBook);
            setSelectedBook(null);
          }}
          isBorrowed={isBookBorrowed(selectedBook.id)}
        />
      )}
    </Layout>
  );
}
