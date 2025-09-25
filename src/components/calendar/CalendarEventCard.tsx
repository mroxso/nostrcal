import { format } from 'date-fns';
import { CalendarIcon, Clock, MapPin, Tag, Link, Calendar, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  type CalendarEvent, 
  type DateBasedCalendarEvent, 
  type TimeBasedCalendarEvent, 
  isDateBasedEvent
} from '@/lib/calendar/types';
import { useAuthor } from '@/hooks/useAuthor';
import { NoteContent } from '@/components/NoteContent';
import { useCalendarEventRSVP } from '@/hooks/calendar/useCalendarPublish';

interface CalendarEventCardProps {
  event: CalendarEvent;
  showRSVP?: boolean;
  className?: string;
}

export function CalendarEventCard({ event, showRSVP = true, className = '' }: CalendarEventCardProps) {
  const author = useAuthor(event.pubkey);
  const { mutate: sendRSVP, isPending } = useCalendarEventRSVP();

  // Format date or time based on event type
  const formatEventDateTime = (event: CalendarEvent) => {
    if (isDateBasedEvent(event)) {
      // Date-based event
      const startDate = new Date(event.start);
      let dateDisplay = format(startDate, 'PPP');

      if (event.end) {
        const endDate = new Date(event.end);
        dateDisplay = `${dateDisplay} - ${format(endDate, 'PPP')}`;
      }

      return dateDisplay;
    } else {
      // Time-based event
      const startTime = new Date(event.start * 1000);
      let dateTimeDisplay = format(startTime, 'PPp');

      if (event.end) {
        const endTime = new Date(event.end * 1000);
        dateTimeDisplay = `${dateTimeDisplay} - ${format(endTime, 'pp')}`;
      }

      if (event.start_tzid) {
        dateTimeDisplay = `${dateTimeDisplay} (${event.start_tzid})`;
      }

      return dateTimeDisplay;
    }
  };

  // RSVP handlers
  const handleRSVP = (status: 'accepted' | 'declined' | 'tentative') => {
    // Create the event coordinates string as specified by NIP-52
    const eventCoordinates = `${event.kind}:${event.pubkey}:${event.d}`;
    
    sendRSVP({
      eventId: event.id,
      eventCoordinates,
      status,
      freebusy: status !== 'declined' ? 'busy' : undefined,
      authorPubkey: event.pubkey,
      note: '',
    });
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      {event.image && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={event.image} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isDateBasedEvent(event) ? (
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {formatEventDateTime(event)}
            </span>
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold leading-none tracking-tight">{event.title}</h2>
        
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={author.data?.metadata?.picture} alt={author.data?.metadata?.name || ''} />
            <AvatarFallback>
              {(author.data?.metadata?.name?.[0] || event.pubkey.slice(0, 2)).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-sm font-medium">
            {author.data?.metadata?.name || event.pubkey.slice(0, 8)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {event.summary && (
          <p className="text-muted-foreground">{event.summary}</p>
        )}
        
        {event.content && (
          <div className="prose dark:prose-invert prose-sm max-w-none">
            <NoteContent event={event as any} />
          </div>
        )}
        
        {event.locations.length > 0 && (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Location</span>
            </div>
            {event.locations.map((location, i) => (
              <p key={i} className="text-sm pl-6">{location}</p>
            ))}
          </div>
        )}
        
        {event.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center space-x-2 w-full">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tags</span>
            </div>
            <div className="pl-6 flex flex-wrap gap-2">
              {event.hashtags.map((tag, i) => (
                <Badge key={i} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>
        )}
        
        {event.references.length > 0 && (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <Link className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Links</span>
            </div>
            {event.references.map((link, i) => (
              <a 
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm pl-6 text-blue-600 dark:text-blue-400 hover:underline break-all"
              >
                {link}
              </a>
            ))}
          </div>
        )}
        
        {event.calendarRefs.length > 0 && (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Calendars</span>
            </div>
            <div className="pl-6 flex flex-wrap gap-2">
              {event.calendarRefs.map((ref, i) => (
                <Badge key={i} variant="outline">{ref.split(':')[0]}</Badge>
              ))}
            </div>
          </div>
        )}
        
        {event.participants.length > 0 && (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Participants</span>
            </div>
            <div className="pl-6 flex -space-x-2">
              {event.participants.map((participant, i) => (
                <Avatar key={i} className="h-8 w-8 border-2 border-background">
                  <AvatarFallback>
                    {participant.pubkey.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            {event.participants.map((participant, i) => (
              <div key={i} className="pl-6 flex items-center text-sm">
                <span className="truncate">{participant.pubkey.slice(0, 8)}</span>
                {participant.role && (
                  <Badge variant="outline" className="ml-2">{participant.role}</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {showRSVP && (
        <>
          <Separator />
          <CardFooter className="pt-4 flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRSVP('tentative')}
              disabled={isPending}
            >
              Maybe
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleRSVP('declined')}
              className="text-destructive hover:bg-destructive/10"
              disabled={isPending}
            >
              Decline
            </Button>
            <Button
              size="sm"
              onClick={() => handleRSVP('accepted')}
              disabled={isPending}
            >
              Accept
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}