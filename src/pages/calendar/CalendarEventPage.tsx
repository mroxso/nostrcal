import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarEventCard } from '@/components/calendar/CalendarEventCard';
import { useCalendarEvent } from '@/hooks/calendar/useCalendarEvents';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarLayout } from '@/components/calendar/CalendarLayout';
import { useSeoMeta } from '@unhead/react';

export function CalendarEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notFound, setNotFound] = useState(false);
  
  const { data: event, isLoading, isError } = useCalendarEvent(id || '');
  
  useSeoMeta({
    title: event ? `${event.title} - NostCal` : 'Event Details - NostCal',
    description: event?.summary || 'View calendar event details',
  });
  
  useEffect(() => {
    // If the event isn't found after loading, set notFound to true
    if (!isLoading && !event && !isError) {
      setNotFound(true);
    }
  }, [event, isLoading, isError]);
  
  if (isLoading) {
    return (
      <CalendarLayout>
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </CalendarLayout>
    );
  }
  
  if (isError) {
    return (
      <CalendarLayout>
        <Alert variant="destructive">
          <AlertDescription>
            Error loading event. Please try again later.
          </AlertDescription>
        </Alert>
      </CalendarLayout>
    );
  }
  
  if (notFound || !event) {
    return (
      <CalendarLayout>
        <Alert>
          <AlertDescription>
            Event not found. It may have been deleted or is not available on the current relay.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate('/calendar')}>
            Back to Calendar
          </Button>
        </div>
      </CalendarLayout>
    );
  }
  
  return (
    <CalendarLayout>
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/calendar')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Calendar
        </Button>
      </div>
      
      <CalendarEventCard event={event} />
    </CalendarLayout>
  );
}