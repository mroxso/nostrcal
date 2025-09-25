import { useState, useEffect } from 'react';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { CalendarIcon, ChevronLeft, ChevronRight, List, Grid, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCalendarEventsByDateRange } from '@/hooks/calendar/useCalendarEvents';
import { CalendarEventCard } from './CalendarEventCard';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { isDateBasedEvent, isTimeBasedEvent, type CalendarEvent } from '@/lib/calendar/types';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useIsMobile } from '@/hooks/useIsMobile';

/**
 * Monthly calendar view component that displays events in a calendar grid
 */
export function CalendarMonthView() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<'grid' | 'list'>('grid');
  
  // Get events for the current month's date range
  const startDate = startOfMonth(date);
  const endDate = endOfMonth(date);
  
  const { data: events, isLoading } = useCalendarEventsByDateRange(startDate, endDate);
  const isMobile = useIsMobile();
  
  // Reset selected date when changing months
  useEffect(() => {
    setSelectedDate(new Date());
  }, [date]);
  
  // Group events by date for calendar display
  const eventsByDate = events?.reduce((acc, event) => {
    let eventDate: Date | null = null;
    
    if (isDateBasedEvent(event)) {
      // For date-based events, use the start date
      eventDate = new Date(event.start);
    } else if (isTimeBasedEvent(event)) {
      // For time-based events, convert timestamp to date
      eventDate = new Date(event.start * 1000);
    }
    
    if (eventDate) {
      // Format date as YYYY-MM-DD for mapping
      const dateKey = format(eventDate, 'yyyy-MM-dd');
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      
      acc[dateKey].push(event);
    }
    
    return acc;
  }, {} as Record<string, CalendarEvent[]>);
  
  // Get events for the currently selected date
  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const selectedDateEvents = eventsByDate?.[selectedDateKey] || [];
  
  const handlePreviousMonth = () => {
    setDate(subMonths(date, 1));
  };
  
  const handleNextMonth = () => {
    setDate(addMonths(date, 1));
  };
  
  const handleViewChange = (value: string) => {
    if (value === 'grid' || value === 'list') {
      setView(value);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5" />
          <h2 className="text-2xl font-bold">{format(date, 'MMMM yyyy')}</h2>
        </div>
        
        <div className="flex items-center justify-between md:justify-end space-x-2">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous month</span>
            </Button>
            
            <Button variant="outline" size="icon" onClick={() => setDate(new Date())}>
              <span className="sr-only">Today</span>
              <span className="text-xs font-medium">Today</span>
            </Button>
            
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next month</span>
            </Button>
          </div>
          
          <ToggleGroup type="single" value={view} onValueChange={handleViewChange}>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <Grid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-7 md:gap-4" 
           style={{ gridTemplateRows: view === 'grid' ? 'auto 1fr' : 'auto' }}>
        {view === 'grid' && (
          <>
            <div className="col-span-7">
              <CalendarUI
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={date}
                className="rounded-md border shadow"
                modifiers={{
                  hasEvents: (day) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    return !!eventsByDate?.[dateKey]?.length;
                  }
                }}
                modifiersClassNames={{
                  hasEvents: 'bg-primary/10 font-bold relative'
                }}
                components={{
                  DayContent: (props) => {
                    const day = props.date;
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const count = eventsByDate?.[dateKey]?.length || 0;
                    
                    return (
                      <>
                        {day.getDate()}
                        {count > 0 && (
                          <span className="absolute bottom-1 right-1 flex h-1.5 w-1.5 rounded-full bg-primary"></span>
                        )}
                      </>
                    );
                  }
                }}
              />
            </div>
            
            <div className="col-span-7 mt-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : selectedDateEvents.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Events on {format(selectedDate!, 'PPPP')}</span>
                      <Badge>{selectedDateEvents.length} events</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[calc(100vh-22rem)] md:h-[calc(100vh-26rem)] pr-4">
                      <div className="space-y-4">
                        {selectedDateEvents.map((event) => (
                          <CalendarEventCard 
                            key={event.id} 
                            event={event} 
                            showRSVP={false}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      No events on {format(selectedDate!, 'PPPP')}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
        
        {view === 'list' && (
          <div className="col-span-full">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : events && events.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(eventsByDate || {})
                  .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                  .map(([dateStr, dayEvents]) => {
                    const day = new Date(dateStr);
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <div key={dateStr}>
                        <h3 className={`text-lg font-semibold mb-3 sticky top-0 bg-background z-10 py-2 ${
                          isToday ? 'text-primary' : ''
                        }`}>
                          {format(day, 'EEEE, MMMM d')}
                          {isToday && <Badge className="ml-2">Today</Badge>}
                        </h3>
                        <div className="space-y-4 pl-4 border-l border-border">
                          {dayEvents.map((event) => (
                            <CalendarEventCard
                              key={event.id}
                              event={event}
                              showRSVP={false}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No events this month</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}