import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarEventCard } from './CalendarEventCard';
import { useUpcomingCalendarEvents } from '@/hooks/calendar/useCalendarEvents';
import { useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Displays upcoming calendar events in a list view with infinite scroll
 */
export function UpcomingEventsList() {
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading, 
    isError 
  } = useUpcomingCalendarEvents();
  
  const { ref, inView } = useInView();
  
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load events. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  const events = data?.pages.flat() || [];
  
  if (events.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No upcoming events found. Create one or try a different relay.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      {events.map(event => (
        <CalendarEventCard 
          key={event.id}
          event={event}
          showRSVP={true}
        />
      ))}
      
      <div 
        ref={ref} 
        className={`flex justify-center py-8 ${!hasNextPage ? 'hidden' : ''}`}
      >
        {isFetchingNextPage ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : hasNextPage ? (
          <Button 
            variant="outline"
            onClick={() => fetchNextPage()}
          >
            Load more events
          </Button>
        ) : null}
      </div>
    </div>
  );
}