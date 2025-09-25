import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCalendarEventSearch } from '@/hooks/calendar/useCalendarEvents';
import { CalendarEventCard } from './CalendarEventCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { RelaySelector } from '@/components/RelaySelector';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * Component for searching calendar events
 */
export function CalendarEventSearch() {
  const [inputValue, setInputValue] = useState('');
  const debouncedSearch = useDebounce(inputValue, 500);
  
  const { data: events, isLoading, isError } = useCalendarEventSearch(debouncedSearch);
  
  const handleClear = () => {
    setInputValue('');
  };
  
  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search events by title, description, location..."
          className="pl-10 pr-10"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-7 -translate-y-1/2 text-muted-foreground"
            onClick={handleClear}
          >
            <span className="sr-only">Clear</span>
            ✕
          </Button>
        )}
      </div>
      
      <div>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              An error occurred while searching. Please try again.
            </AlertDescription>
          </Alert>
        ) : events && events.length > 0 ? (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Found {events.length} event{events.length !== 1 ? 's' : ''}
            </p>
            {events.map(event => (
              <CalendarEventCard
                key={event.id}
                event={event}
                showRSVP={false}
              />
            ))}
          </div>
        ) : debouncedSearch ? (
          <Card className="border-dashed">
            <div className="py-12 px-8 text-center">
              <div className="max-w-sm mx-auto space-y-6">
                <p className="text-muted-foreground">
                  No events found matching "{debouncedSearch}". Try another relay?
                </p>
                <RelaySelector className="w-full" />
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}