import { Book } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface BookDetailDialogProps {
  book: Book;
  open: boolean;
  onClose: () => void;
  onBorrow?: () => void;
  isBorrowed?: boolean;
}

/**
 * Book Detail Dialog Component
 * 
 * Displays detailed information about a book in a modal dialog.
 * Includes cover image, metadata, description, and borrow functionality.
 * Handles cases where book properties might be undefined.
 */
export function BookDetailDialog({
  book,
  open,
  onClose,
  onBorrow,
  isBorrowed,
}: BookDetailDialogProps) {
  // Guard against null or undefined book object
  if (!book) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Book Details Unavailable</DialogTitle>
            <DialogDescription>Unable to load book information</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
            Book data could not be loaded. Please try again later.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{book.title || 'Untitled Book'}</DialogTitle>
          <DialogDescription>By {book.author || 'Unknown Author'}</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
          <div className="relative min-h-40 bg-muted rounded-md overflow-hidden">
            {book.coverImage ? (
              <img 
                src={book.coverImage} 
                alt={`${book.title || 'Book'} cover`} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                No Cover Available
              </div>
            )}
          </div>
          
          <div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <div>
                  <span className="text-sm font-medium">ISBN:</span>
                  <span className="ml-2 text-sm">{book.isbn || 'N/A'}</span>
                </div>
                {book.category && (
                  <Badge variant="outline">{book.category}</Badge>
                )}
              </div>
              
              {book.publicationYear && (
                <div>
                  <span className="text-sm font-medium">Published:</span>
                  <span className="ml-2 text-sm">{book.publicationYear}</span>
                </div>
              )}
              
              <div>
                <span className="text-sm font-medium">Availability:</span>
                <span className="ml-2 text-sm">
                  {typeof book.availableCopies === 'number' ? book.availableCopies : 0} of {typeof book.totalCopies === 'number' ? book.totalCopies : 0} copies available
                </span>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            {book.description ? (
              <div className="text-sm mt-2">
                <p>{book.description}</p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                No description available for this book.
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          {onBorrow && (
            <Button
              onClick={onBorrow}
              disabled={(typeof book.availableCopies !== 'number' || book.availableCopies === 0) || isBorrowed}
            >
              {isBorrowed 
                ? "Already Borrowed" 
                : (typeof book.availableCopies !== 'number' || book.availableCopies === 0) 
                  ? "Not Available" 
                  : "Borrow Book"
              }
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
