import { useNavigate } from 'react-router-dom';
import { CalendarEventForm } from '@/components/calendar/CalendarEventForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarLayout } from '@/components/calendar/CalendarLayout';
import { useSeoMeta } from '@unhead/react';

export function NewCalendarEventPage() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  
  useSeoMeta({
    title: 'Create New Event - NostCal',
    description: 'Create a new calendar event on Nostr',
  });
  
  return (
    <CalendarLayout>
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/calendar')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Calendar
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Create Calendar Event</CardTitle>
          <CardDescription>
            Add a new event to the Nostr calendar using NIP-52
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <CalendarEventForm />
          ) : (
            <Alert>
              <AlertDescription>
                You need to log in to create a calendar event.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </CalendarLayout>
  );
}