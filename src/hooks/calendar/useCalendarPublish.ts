import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { 
  type CalendarEvent, 
  type DateBasedCalendarEvent, 
  type TimeBasedCalendarEvent,
  serializeCalendarEvent, 
  generateCalendarId 
} from '@/lib/calendar/types';
import { isValidTimeZone } from '@/lib/calendar/validation';

/**
 * Props for creating a date-based calendar event
 */
export interface CreateDateEventProps {
  title: string;
  start: string; // YYYY-MM-DD
  end?: string; // YYYY-MM-DD
  content: string;
  summary?: string;
  image?: string;
  locations?: string[];
  hashtags?: string[];
  references?: string[];
  calendarRefs?: string[];
}

/**
 * Props for creating a time-based calendar event
 */
export interface CreateTimeEventProps {
  title: string;
  start: number; // Unix timestamp
  end?: number; // Unix timestamp
  content: string;
  summary?: string;
  image?: string;
  start_tzid?: string;
  end_tzid?: string;
  locations?: string[];
  hashtags?: string[];
  references?: string[];
  calendarRefs?: string[];
}

/**
 * Hook to publish a new date-based calendar event
 */
export function useDateBasedCalendarEvent() {
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();
  
  return useMutation({
    mutationFn: async (props: CreateDateEventProps) => {
      if (!user) {
        throw new Error('You must be logged in to create a calendar event');
      }
      
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(props.start)) {
        throw new Error('Invalid start date format. Use YYYY-MM-DD');
      }
      
      if (props.end && !dateRegex.test(props.end)) {
        throw new Error('Invalid end date format. Use YYYY-MM-DD');
      }
      
      if (props.end && props.end <= props.start) {
        throw new Error('End date must be after start date');
      }
      
      const event: DateBasedCalendarEvent = {
        kind: 31922,
        id: '', // Will be set by Nostr
        pubkey: user.pubkey,
        created_at: Math.floor(Date.now() / 1000),
        content: props.content,
        tags: [],
        d: generateCalendarId(),
        title: props.title,
        start: props.start,
        end: props.end,
        summary: props.summary,
        image: props.image,
        locations: props.locations || [],
        hashtags: props.hashtags || [],
        references: props.references || [],
        calendarRefs: props.calendarRefs || [],
        participants: []
      };
      
      const serializedEvent = serializeCalendarEvent(event);
      const publishedEvent = await publishEvent(serializedEvent);
      
      return publishedEvent;
    }
  });
}

/**
 * Hook to publish a new time-based calendar event
 */
export function useTimeBasedCalendarEvent() {
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();
  
  return useMutation({
    mutationFn: async (props: CreateTimeEventProps) => {
      if (!user) {
        throw new Error('You must be logged in to create a calendar event');
      }
      
      if (isNaN(props.start) || props.start <= 0) {
        throw new Error('Invalid start timestamp');
      }
      
      if (props.end !== undefined && (isNaN(props.end) || props.end <= props.start)) {
        throw new Error('End time must be after start time');
      }
      
      if (props.start_tzid && !isValidTimeZone(props.start_tzid)) {
        throw new Error('Invalid start timezone');
      }
      
      if (props.end_tzid && !isValidTimeZone(props.end_tzid)) {
        throw new Error('Invalid end timezone');
      }
      
      const event: TimeBasedCalendarEvent = {
        kind: 31923,
        id: '', // Will be set by Nostr
        pubkey: user.pubkey,
        created_at: Math.floor(Date.now() / 1000),
        content: props.content,
        tags: [],
        d: generateCalendarId(),
        title: props.title,
        start: props.start,
        end: props.end,
        start_tzid: props.start_tzid,
        end_tzid: props.end_tzid,
        summary: props.summary,
        image: props.image,
        locations: props.locations || [],
        hashtags: props.hashtags || [],
        references: props.references || [],
        calendarRefs: props.calendarRefs || [],
        participants: []
      };
      
      const serializedEvent = serializeCalendarEvent(event);
      const publishedEvent = await publishEvent(serializedEvent);
      
      return publishedEvent;
    }
  });
}

/**
 * Hook to handle RSVP to calendar events
 */
export function useCalendarEventRSVP() {
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();
  
  return useMutation({
    mutationFn: async ({ 
      eventId,
      eventCoordinates,
      status,
      freebusy,
      note,
      authorPubkey
    }: { 
      eventId?: string;
      eventCoordinates: string;
      status: 'accepted' | 'declined' | 'tentative';
      freebusy?: 'free' | 'busy';
      note?: string;
      authorPubkey?: string;
    }) => {
      if (!user) {
        throw new Error('You must be logged in to RSVP to an event');
      }
      
      // When status is declined, freebusy should not be set
      if (status === 'declined' && freebusy) {
        throw new Error('Free/busy status cannot be set when declining an event');
      }
      
      const tags = [
        ['a', eventCoordinates],
        ['d', generateCalendarId()],
        ['status', status]
      ];
      
      if (eventId) tags.push(['e', eventId]);
      if (freebusy && status !== 'declined') tags.push(['fb', freebusy]);
      if (authorPubkey) tags.push(['p', authorPubkey]);
      
      const rsvp = {
        kind: 31925,
        content: note || '',
        tags
      };
      
      return await publishEvent(rsvp);
    }
  });
}