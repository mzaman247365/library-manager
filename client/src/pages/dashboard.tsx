import { Layout } from "@/components/ui/layout";
import { BorrowedBookCard } from "@/components/ui/borrowed-book-card";
import { BookCard } from "@/components/ui/book-card";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Book, Borrow, ActivityItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { CalendarClock, Clock, History, Loader2, Search } from "lucide-react";
import { BookDetailDialog } from "@/components/ui/book-detail-dialog";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { format, formatDistanceToNow } from "date-fns";

// User interface
interface User {
  id: number;
  username: string;
  fullName: string;
  isAdmin: boolean;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user', { credentials: 'include' });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };
    
    fetchUser();
  }, []);

  // Fetch all books
  const { data: books, isLoading: isLoadingBooks } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  // Fetch active borrows for current user
  const { data: activeBorrows, isLoading: isLoadingBorrows } = useQuery<(Borrow & { book: Book })[]>({
    queryKey: ["/api/borrows/active"],
  });
  
  // Return book mutation
  const returnBookMutation = useMutation({
    mutationFn: async (borrowId: number) => {
      const res = await apiRequest("POST", `/api/borrows/${borrowId}/return`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Book returned",
        description: "The book has been successfully returned.",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/borrows/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (error) => {
      toast({
        title: "Error returning book",
        description: error.message,
        variant: "destructive",
      });
    },
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
  
  /**
   * Function to check if user has already borrowed a specific book
   * 
   * Safely handles undefined borrowIds or activeBorrows array
   * @param bookId - The ID of the book to check
   * @returns boolean indicating if the book is already borrowed
   */
  const isBookBorrowed = (bookId?: number) => {
    if (!bookId || !activeBorrows || !Array.isArray(activeBorrows)) return false;
    return activeBorrows.some(borrow => borrow.bookId === bookId);
  };
  
  // Handle book return
  const handleReturnBook = (borrowId: number) => {
    returnBookMutation.mutate(borrowId);
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
  
  // Show book details
  const handleShowDetails = (book: Book) => {
    setSelectedBook(book);
  };
  
  // Calculate stats
  const activeBorrowCount = activeBorrows?.length || 0;
  const dueSoonCount = activeBorrows?.filter(borrow => {
    const dueDate = new Date(borrow.dueDate);
    const today = new Date();
    const differenceInDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return differenceInDays <= 3 && differenceInDays >= 0;
  }).length || 0;
  
  const overdueCount = activeBorrows?.filter(borrow => {
    const dueDate = new Date(borrow.dueDate);
    return dueDate < new Date();
  }).length || 0;

  // Activity items for dashboard
  const activityItems: ActivityItem[] = activeBorrows?.map(borrow => ({
    id: borrow.id,
    type: 'borrow',
    bookTitle: borrow.book.title || 'Unknown Book',
    date: new Date(borrow.borrowDate),
    message: `You borrowed "${borrow.book.title || 'Unknown Book'}"`
  })) || [];
  
  // Add overdue reminders to activity
  const dueReminders: ActivityItem[] = activeBorrows?.filter(borrow => {
    const dueDate = new Date(borrow.dueDate);
    const today = new Date();
    const differenceInDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return differenceInDays <= 3;
  }).map(borrow => ({
    id: borrow.id + 1000, // Ensure unique ID
    type: 'reminder',
    bookTitle: borrow.book.title || 'Unknown Book',
    date: new Date(), // Today
    message: `Reminder: "${borrow.book.title || 'Unknown Book'}" is due soon`
  })) || [];
  
  // Combine and sort activities
  const allActivities = [...activityItems, ...dueReminders]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  // Custom Layout component that doesn't use useAuth
  const CustomLayout = ({ children }: { children: React.ReactNode }) => {
    const [location] = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    const handleLogout = async () => {
      try {
        await apiRequest("POST", "/api/logout", {});
        navigate("/auth");
      } catch (error) {
        console.error("Logout failed:", error);
      }
    };
    
    const navItems = [
      {
        icon: <Clock className="h-5 w-5 mr-3" />,
        label: "Dashboard",
        href: "/",
        active: location === "/",
      },
      {
        icon: <History className="h-5 w-5 mr-3" />,
        label: "Browse Books",
        href: "/browse",
        active: location === "/browse",
      },
      {
        icon: <CalendarClock className="h-5 w-5 mr-3" />,
        label: "My Borrowed Books",
        href: "/borrowed",
        active: location === "/borrowed",
      },
    ];
    
    const adminItems = [
      {
        icon: <History className="h-5 w-5 mr-3" />,
        label: "Manage Books",
        href: "/manage/books",
        active: location === "/manage/books",
      },
      {
        icon: <Search className="h-5 w-5 mr-3" />,
        label: "Manage Users",
        href: "/manage/users",
        active: location === "/manage/users",
      },
    ];
    
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-primary text-primary-foreground shadow-md z-10 flex items-center px-4 h-16">
          <h1 className="text-xl font-medium flex-1">Library Management System</h1>
          <Button 
            variant="outline" 
            className="ml-auto text-primary-foreground border-primary-foreground"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </header>
        
        <div className="flex flex-1">
          <nav className="hidden md:block w-64 bg-white shadow-sm border-r border-gray-100 p-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Main</h3>
                <ul className="mt-3 space-y-2">
                  {navItems.map(item => (
                    <li key={item.href}>
                      <a 
                        href={item.href}
                        className={`flex items-center px-3 py-2 text-sm rounded-md ${
                          item.active ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              {user?.isAdmin && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</h3>
                  <ul className="mt-3 space-y-2">
                    {adminItems.map(item => (
                      <li key={item.href}>
                        <a 
                          href={item.href}
                          className={`flex items-center px-3 py-2 text-sm rounded-md ${
                            item.active ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </nav>
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    );
  };

  return (
    <CustomLayout>
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h2 className="text-2xl font-medium text-gray-800">Dashboard</h2>
          <div className="mt-4 md:mt-0">
            <div className="relative md:w-64">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Search..." 
                className="pl-8"
                onClick={() => navigate('/browse')}
              />
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <History className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Books Borrowed</p>
                <h3 className="text-xl font-semibold">{activeBorrowCount}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-secondary/10 text-secondary">
                <Clock className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Due Soon</p>
                <h3 className="text-xl font-semibold">{dueSoonCount}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-destructive/10 text-destructive">
                <CalendarClock className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Overdue</p>
                <h3 className="text-xl font-semibold">{overdueCount}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-500/10 text-green-500">
                <History className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Total Borrowed</p>
                <h3 className="text-xl font-semibold">{activeBorrows ? activeBorrows.length : 0}</h3>
              </div>
            </div>
          </div>
        </div>
        
        {/* Currently Borrowed Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium text-gray-800">Currently Borrowed</h3>
            <Button variant="ghost" onClick={() => navigate('/borrowed')}>
              View All
              <span className="material-icons text-sm ml-1">→</span>
            </Button>
          </div>
          
          {isLoadingBorrows ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activeBorrows && activeBorrows.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeBorrows.slice(0, 3).map((borrow) => (
                <BorrowedBookCard 
                  key={borrow.id} 
                  borrow={borrow} 
                  onReturn={handleReturnBook} 
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-muted-foreground">You haven't borrowed any books yet.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/browse')}
              >
                Browse Books
              </Button>
            </div>
          )}
        </div>
        
        {/* Popular Books Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium text-gray-800">Available Books</h3>
            <Button variant="ghost" onClick={() => navigate('/browse')}>
              Browse All
              <span className="material-icons text-sm ml-1">→</span>
            </Button>
          </div>
          
          {isLoadingBooks ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : books && Array.isArray(books) && books.length > 0 ? (
            <div className="relative">
              <div className="flex overflow-x-auto pb-4 space-x-4 no-scrollbar">
                {books.slice(0, 5).map((book) => (
                  <div key={book.id || Math.random()} className="flex-shrink-0 w-48">
                    <BookCard 
                      book={book} 
                      onBorrow={handleBorrowBook}
                      onDetails={handleShowDetails}
                      isBorrowed={isBookBorrowed(book.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-muted-foreground">No books available.</p>
            </div>
          )}
        </div>
        
        {/* Recent Activity Section */}
        <div>
          <h3 className="text-xl font-medium text-gray-800 mb-4">Recent Activity</h3>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-medium">Activity History</h4>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            
            {allActivities.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {allActivities.map((activity) => (
                  <li key={activity.id} className="px-4 py-3 flex items-start hover:bg-gray-50">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'borrow' 
                        ? 'bg-primary/10 text-primary' 
                        : activity.type === 'reminder' 
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-green-500/10 text-green-500'
                    }`}>
                      {activity.type === 'borrow' && <History className="h-5 w-5" />}
                      {activity.type === 'reminder' && <Clock className="h-5 w-5" />}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm">{activity.message}</p>
                      <span className="text-xs text-muted-foreground">
                        {format(activity.date, 'MMM d, yyyy')} at {format(activity.date, 'h:mm a')}
                        {' '}
                        ({formatDistanceToNow(activity.date, { addSuffix: true })})
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No activity yet.
              </div>
            )}
          </div>
        </div>
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
    </CustomLayout>
  );
}