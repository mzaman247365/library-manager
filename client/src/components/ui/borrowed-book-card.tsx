import { Borrow, Book } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, TimerOff } from "lucide-react";
import { formatDistanceToNow, format, isPast } from "date-fns";

interface BorrowedBookCardProps {
  borrow: Borrow & { book: Book };
  onReturn: (borrowId: number) => void;
}

export function BorrowedBookCard({ borrow, onReturn }: BorrowedBookCardProps) {
  const borrowDate = new Date(borrow.borrowDate);
  const dueDate = new Date(borrow.dueDate);
  const isOverdue = isPast(dueDate) && !borrow.isReturned;
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start">
          <div className="min-w-16 h-24 bg-muted rounded overflow-hidden">
            {borrow.book.coverImage ? (
              <img 
                src={borrow.book.coverImage} 
                alt={`${borrow.book.title} cover`} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                No Cover
              </div>
            )}
          </div>
          
          <div className="ml-4 flex-1">
            <h4 className="font-medium text-lg line-clamp-1">{borrow.book.title}</h4>
            <p className="text-muted-foreground text-sm mb-2">{borrow.book.author}</p>
            
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <CalendarIcon className="h-3 w-3 mr-1" />
              <span>
                Borrowed: {format(borrowDate, 'MMM d, yyyy')}
              </span>
            </div>
            
            <div className={`flex items-center text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
              <Clock className="h-3 w-3 mr-1" />
              <span>
                Due: {format(dueDate, 'MMM d, yyyy')} 
                {' '}
                ({isOverdue 
                  ? `${formatDistanceToNow(dueDate)} overdue` 
                  : `in ${formatDistanceToNow(dueDate)}`})
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/20 pt-3 pb-3 flex justify-end">
        {!borrow.isReturned && (
          <Button 
            size="sm"
            className="rounded-full"
            onClick={() => onReturn(borrow.id)}
          >
            Return Book
          </Button>
        )}
        
        {borrow.isReturned && (
          <span className="text-xs flex items-center text-muted-foreground">
            <TimerOff className="h-3 w-3 mr-1" />
            Returned on {format(new Date(borrow.returnDate!), 'MMM d, yyyy')}
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
