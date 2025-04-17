import { Layout } from "@/components/ui/layout";
import { BorrowedBookCard } from "@/components/ui/borrowed-book-card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Book, Borrow } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default function BorrowedBooks() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("active");

  // Fetch borrows for current user
  const { data: borrows, isLoading, refetch } = useQuery<(Borrow & { book: Book })[]>({
    queryKey: ["/api/borrows"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/borrows"] });
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

  // Handle book return
  const handleReturnBook = (borrowId: number) => {
    returnBookMutation.mutate(borrowId);
  };

  // Filter borrows based on active tab
  const activeBorrows = borrows?.filter(borrow => !borrow.isReturned) || [];
  const returnedBorrows = borrows?.filter(borrow => borrow.isReturned) || [];
  const overdueBooks = borrows?.filter(borrow => {
    const dueDate = new Date(borrow.dueDate);
    return !borrow.isReturned && dueDate < new Date();
  }) || [];

  // Get current borrows based on active tab
  const currentBorrows = activeTab === "active" 
    ? activeBorrows 
    : activeTab === "overdue" 
      ? overdueBooks 
      : returnedBorrows;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h2 className="text-2xl font-medium">My Borrowed Books</h2>
          
          <Button
            variant="outline"
            size="sm"
            className="mt-4 md:mt-0"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">
              Active ({activeBorrows.length})
            </TabsTrigger>
            <TabsTrigger value="overdue">
              Overdue ({overdueBooks.length})
            </TabsTrigger>
            <TabsTrigger value="returned">
              Returned ({returnedBorrows.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : currentBorrows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentBorrows.map((borrow) => (
              <BorrowedBookCard 
                key={borrow.id} 
                borrow={borrow} 
                onReturn={handleReturnBook} 
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-muted-foreground">
              {activeTab === "active" && "You don't have any active borrowings."}
              {activeTab === "overdue" && "You don't have any overdue books."}
              {activeTab === "returned" && "You haven't returned any books yet."}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
