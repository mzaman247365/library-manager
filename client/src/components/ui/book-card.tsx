import { Book } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, StarHalf } from "lucide-react";

interface BookCardProps {
  book: Book;
  onBorrow?: (book: Book) => void;
  onDetails?: (book: Book) => void;
  isBorrowed?: boolean;
}

/**
 * Book Card Component
 * 
 * Displays a book with its cover image, title, author, rating, and action buttons.
 * Handles gracefully when book properties are undefined.
 */
export function BookCard({ book, onBorrow, onDetails, isBorrowed }: BookCardProps) {
  // Guard against null or undefined book object
  if (!book) {
    return (
      <Card className="w-full h-full flex flex-col overflow-hidden">
        <div className="h-64 w-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground">Book data unavailable</span>
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium">Loading...</h3>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full h-full flex flex-col overflow-hidden">
      <div className="relative h-64 w-full bg-muted">
        {book.coverImage ? (
          <img 
            src={book.coverImage} 
            alt={`${book.title || 'Book'} cover`} 
            className="w-full h-full object-cover transition-all hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
            No Cover Available
          </div>
        )}
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <h3 className="font-medium line-clamp-1 text-lg">{book.title || 'Untitled Book'}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{book.author || 'Unknown Author'}</p>
        
        <div className="flex justify-between items-center mt-auto">
          <div className="flex items-center text-amber-500">
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <StarHalf className="h-4 w-4 fill-current" />
          </div>
          <span className="text-xs text-muted-foreground">
            {typeof book.availableCopies === 'number' ? book.availableCopies : 0} 
            {(book.availableCopies === 1) ? ' copy' : ' copies'} available
          </span>
        </div>
        
        <div className="flex gap-2 mt-4">
          {onDetails && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onDetails(book)}
            >
              Details
            </Button>
          )}
          
          {onBorrow && (
            <Button 
              variant={isBorrowed ? "secondary" : "default"} 
              size="sm" 
              className="flex-1"
              onClick={() => onBorrow(book)}
              disabled={(typeof book.availableCopies !== 'number' || book.availableCopies === 0) || isBorrowed}
            >
              {isBorrowed ? 'Borrowed' : 'Borrow'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
