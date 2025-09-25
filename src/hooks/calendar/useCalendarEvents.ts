import { useNostr } from '@nostrify/react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { parseCalendarEvent, type CalendarEvent } from '@/lib/calendar/types';
import { validateCalendarEvent } from '@/lib/calendar/validation';

/**
 * Hook to fetch recent calendar events
 */
export function useRecentCalendarEvents(limit: number = 20) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['calendar-events', 'recent', limit],
    queryFn: async ({ signal }) => {
      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(5000)]);
      
      // Query both date-based and time-based events
      const events = await nostr.query([{ 
        kinds: [31922, 31923],
        limit,
      }], { signal: abortSignal });

      // Filter and transform events
      return events
        .filter(validateCalendarEvent)
        .map(event => parseCalendarEvent(event))
        .filter((event): event is CalendarEvent => event !== null)
        .sort((a, b) => {
          // Sort by start date/time
          if ('start' in a && 'start' in b) {
            // Compare dates for date-based events
            if (typeof a.start === 'string' && typeof b.start === 'string') {
              return a.start.localeCompare(b.start);
            }
            // Compare timestamps for time-based events
            if (typeof a.start === 'number' && typeof b.start === 'number') {
              return a.start - b.start;
            }
          }
          // Fallback to creation time
          return a.created_at - b.created_at;
        });
    },
  });
}

/**
 * Hook to fetch upcoming calendar events with pagination
 */
export function useUpcomingCalendarEvents(limit: number = 20) {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['calendar-events', 'upcoming', limit],
    queryFn: async ({ pageParam, signal }) => {
      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(5000)]);
      
      const now = Math.floor(Date.now() / 1000);
      const filter: Record<string, any> = {
        kinds: [31923],
        limit,
      };

      // Filter for time-based events with start time after now
      // We need special handling for '#start' since it's a string in the tag
      // But we want to compare with numeric unix timestamp
      
      // For pagination, use the created_at timestamp
      if (pageParam) {
        filter.until = pageParam;
      }
      
      const timeBasedEvents = await nostr.query([filter], { signal: abortSignal });
      
      // For date-based events, we need a different approach since dates are stored as YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0]; // Get current date as YYYY-MM-DD
      
      const dateBasedFilter: Record<string, any> = {
        kinds: [31922],
        limit,
      };
      
      if (pageParam) {
        dateBasedFilter.until = pageParam;
      }
      
      const dateBasedEvents = await nostr.query([dateBasedFilter], { signal: abortSignal });
      
      // Combine, validate and parse all events
      const allEvents = [...timeBasedEvents, ...dateBasedEvents];
      
      const parsedEvents = allEvents
        .filter(validateCalendarEvent)
        .map(event => parseCalendarEvent(event))
        .filter((event): event is CalendarEvent => {
          if (!event) return false;
          
          // Filter for upcoming events
          if (event.kind === 31923) {
            // Time-based: keep if start time is after now
            return event.start > now;
          } else if (event.kind === 31922) {
            // Date-based: keep if start date is today or later
            return event.start >= today;
          }
          
          return false;
        })
        .sort((a, b) => {
          // Sort time-based events by start time
          if (a.kind === 31923 && b.kind === 31923) {
            return a.start - b.start;
          }
          
          // Sort date-based events by start date
          if (a.kind === 31922 && b.kind === 31922) {
            return a.start.localeCompare(b.start);
          }
          
          // Sort mixed events (this is a simplified approach)
          if (a.kind === 31922 && b.kind === 31923) {
            const aDate = new Date(a.start).getTime() / 1000;
            return aDate - b.start;
          }
          
          if (a.kind === 31923 && b.kind === 31922) {
            const bDate = new Date(b.start).getTime() / 1000;
            return a.start - bDate;
          }
          
          return 0;
        });

      return parsedEvents;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].created_at - 1;
    },
    initialPageParam: undefined as number | undefined,
  });
}

/**
 * Hook to fetch calendar events for a specific date range
 */
export function useCalendarEventsByDateRange(startDate: Date, endDate: Date) {
  const { nostr } = useNostr();
  
  const startIsoDate = startDate.toISOString().split('T')[0];
  const endIsoDate = endDate.toISOString().split('T')[0];
  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  const endTimestamp = Math.floor(endDate.getTime() / 1000);

  return useQuery({
    queryKey: ['calendar-events', 'range', startIsoDate, endIsoDate],
    queryFn: async ({ signal }) => {
      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(5000)]);
      
      // Query for time-based events in the range
      const timeBasedEvents = await nostr.query([{
        kinds: [31923],
        limit: 100,
      }], { signal: abortSignal });
      
      // Query for date-based events
      const dateBasedEvents = await nostr.query([{
        kinds: [31922],
        limit: 100,
      }], { signal: abortSignal });
      
      const allEvents = [...timeBasedEvents, ...dateBasedEvents];
      
      return allEvents
        .filter(validateCalendarEvent)
        .map(event => parseCalendarEvent(event))
        .filter((event): event is CalendarEvent => {
          if (!event) return false;
          
          // Filter by date range
          if (event.kind === 31923) {
            // For time-based events, check if they fall within the timestamp range
            // Need to consider the end time if available
            if (event.end) {
              return (event.start <= endTimestamp && event.end >= startTimestamp);
            }
            // If no end time, just check if start time is within range
            return (event.start >= startTimestamp && event.start <= endTimestamp);
          } else if (event.kind === 31922) {
            // For date-based events, check if they overlap with the date range
            if (event.end) {
              return (event.start <= endIsoDate && event.end >= startIsoDate);
            }
            // If single-day event, check if it's within range
            return (event.start >= startIsoDate && event.start <= endIsoDate);
          }
          
          return false;
        });
    },
  });
}

/**
 * Hook to search for calendar events by text query
 */
export function useCalendarEventSearch(query: string, limit: number = 50) {
  const { nostr } = useNostr();
  
  const normalizedQuery = query.trim().toLowerCase();
  
  return useQuery({
    queryKey: ['calendar-events', 'search', normalizedQuery, limit],
    queryFn: async ({ signal }) => {
      if (!normalizedQuery) return [];
      
      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(5000)]);
      
      // First try to search by hashtag if the query looks like one
      let hashtagEvents: CalendarEvent[] = [];
      if (normalizedQuery.startsWith('#')) {
        const hashtag = normalizedQuery.slice(1);
        const events = await nostr.query([{
          kinds: [31922, 31923],
          '#t': [hashtag],
          limit,
        }], { signal: abortSignal });
        
        hashtagEvents = events
          .filter(validateCalendarEvent)
          .map(event => parseCalendarEvent(event))
          .filter((event): event is CalendarEvent => event !== null);
      }
      
      // Then get a larger set of events and filter client-side
      const allEvents = await nostr.query([{
        kinds: [31922, 31923],
        limit: Math.max(limit * 2, 100), // Get more events than we need for filtering
      }], { signal: abortSignal });
      
      const parsedEvents = allEvents
        .filter(validateCalendarEvent)
        .map(event => parseCalendarEvent(event))
        .filter((event): event is CalendarEvent => {
          if (!event) return false;
          
          // Search in title
          if (event.title.toLowerCase().includes(normalizedQuery)) return true;
          
          // Search in content
          if (event.content.toLowerCase().includes(normalizedQuery)) return true;
          
          // Search in summary
          if (event.summary?.toLowerCase().includes(normalizedQuery)) return true;
          
          // Search in locations
          if (event.locations.some(loc => loc.toLowerCase().includes(normalizedQuery))) return true;
          
          return false;
        });
      
      // Combine both result sets, remove duplicates
      const combinedEvents = [...hashtagEvents, ...parsedEvents];
      const uniqueEvents = Array.from(
        new Map(combinedEvents.map(event => [event.id, event])).values()
      );
      
      return uniqueEvents;
    },
    enabled: normalizedQuery.length > 0,
  });
}

/**
 * Hook to get a specific calendar event by its ID
 */
export function useCalendarEvent(id: string) {
  const { nostr } = useNostr();
  
  return useQuery({
    queryKey: ['calendar-event', id],
    queryFn: async ({ signal }) => {
      if (!id) return null;
      
      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(5000)]);
      
      const events = await nostr.query([{
        ids: [id],
        kinds: [31922, 31923],
      }], { signal: abortSignal });
      
      if (events.length === 0) return null;
      
      const event = events[0];
      if (!validateCalendarEvent(event)) return null;
      
      return parseCalendarEvent(event);
    },
    enabled: !!id,
  });
}