import { useState } from "react";
import { Layout } from "@/components/ui/layout";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Book, insertBookSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ManageBooks() {
  const { toast } = useToast();
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Fetch all books
  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  // Setup form with Zod validation
  const bookValidationSchema = insertBookSchema.extend({
    title: z.string().min(1, "Title is required"),
    author: z.string().min(1, "Author is required"),
    isbn: z.string().min(10, "ISBN must be at least 10 characters"),
    totalCopies: z.coerce.number().int().min(1, "Must have at least 1 copy"),
    availableCopies: z.coerce.number().int().min(0, "Available copies cannot be negative"),
    publicationYear: z.coerce.number().int().optional(),
  });

  const form = useForm<z.infer<typeof bookValidationSchema>>({
    resolver: zodResolver(bookValidationSchema),
    defaultValues: {
      title: "",
      author: "",
      isbn: "",
      description: "",
      category: "",
      coverImage: "",
      totalCopies: 1,
      availableCopies: 1,
      publicationYear: undefined,
    },
  });

  // Create book mutation
  const createBookMutation = useMutation({
    mutationFn: async (data: z.infer<typeof bookValidationSchema>) => {
      const res = await apiRequest("POST", "/api/books", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Book created",
        description: "The book has been successfully added to the library.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setBookDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error creating book",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update book mutation
  const updateBookMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Book> }) => {
      const res = await apiRequest("PUT", `/api/books/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Book updated",
        description: "The book has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setBookDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error updating book",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete book mutation
  const deleteBookMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/books/${id}`, null);
    },
    onSuccess: () => {
      toast({
        title: "Book deleted",
        description: "The book has been successfully removed from the library.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setDeleteDialogOpen(false);
      setSelectedBook(null);
    },
    onError: (error) => {
      toast({
        title: "Error deleting book",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof bookValidationSchema>) => {
    if (selectedBook) {
      updateBookMutation.mutate({ id: selectedBook.id, data });
    } else {
      createBookMutation.mutate(data);
    }
  };

  // Handle edit book
  const handleEditBook = (book: Book) => {
    setSelectedBook(book);
    form.reset({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      description: book.description || "",
      category: book.category || "",
      coverImage: book.coverImage || "",
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      publicationYear: book.publicationYear,
    });
    setBookDialogOpen(true);
  };

  // Handle delete book
  const handleDeleteBook = (book: Book) => {
    setSelectedBook(book);
    setDeleteDialogOpen(true);
  };

  // Handle add new book
  const handleAddBook = () => {
    setSelectedBook(null);
    form.reset({
      title: "",
      author: "",
      isbn: "",
      description: "",
      category: "",
      coverImage: "",
      totalCopies: 1,
      availableCopies: 1,
      publicationYear: undefined,
    });
    setBookDialogOpen(true);
  };

  // Define table columns
  const columns: ColumnDef<Book>[] = [
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "author",
      header: "Author",
    },
    {
      accessorKey: "isbn",
      header: "ISBN",
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "totalCopies",
      header: "Total Copies",
    },
    {
      accessorKey: "availableCopies",
      header: "Available",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const book = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => handleEditBook(book)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDeleteBook(book)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h2 className="text-2xl font-medium">Manage Books</h2>
          
          <Button
            onClick={handleAddBook}
            className="mt-4 md:mt-0"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Book
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={books || []} 
            searchPlaceholder="Search books..."
            searchColumn="title"
          />
        )}
      </div>

      {/* Book Form Dialog */}
      <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedBook ? "Edit Book" : "Add New Book"}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title*</FormLabel>
                      <FormControl>
                        <Input placeholder="Book title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author*</FormLabel>
                      <FormControl>
                        <Input placeholder="Author name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isbn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ISBN*</FormLabel>
                      <FormControl>
                        <Input placeholder="ISBN number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Book category" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="totalCopies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Copies*</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="availableCopies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Copies*</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="publicationYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publication Year</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="YYYY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="coverImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="URL to book cover image" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Book description" 
                        className="resize-none h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createBookMutation.isPending || updateBookMutation.isPending}
                >
                  {createBookMutation.isPending || updateBookMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {selectedBook ? "Update Book" : "Add Book"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBook?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedBook && deleteBookMutation.mutate(selectedBook.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBookMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
