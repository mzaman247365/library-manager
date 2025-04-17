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

export function BookCard({ book, onBorrow, onDetails, isBorrowed }: BookCardProps) {
  return (
    <Card className="w-full h-full flex flex-col overflow-hidden">
      <div className="relative h-64 w-full bg-muted">
        {book.coverImage ? (
          <img 
            src={book.coverImage} 
            alt={`${book.title} cover`} 
            className="w-full h-full object-cover transition-all hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
            No Cover Available
          </div>
        )}
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <h3 className="font-medium line-clamp-1 text-lg">{book.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{book.author}</p>
        
        <div className="flex justify-between items-center mt-auto">
          <div className="flex items-center text-amber-500">
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <StarHalf className="h-4 w-4 fill-current" />
          </div>
          <span className="text-xs text-muted-foreground">
            {book.availableCopies} {book.availableCopies === 1 ? 'copy' : 'copies'} available
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
              disabled={book.availableCopies === 0 || isBorrowed}
            >
              {isBorrowed ? 'Borrowed' : 'Borrow'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
