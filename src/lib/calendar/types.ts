import type { NostrEvent } from "@nostrify/nostrify";

/**
 * Common properties for both types of calendar events
 */
export interface BaseCalendarEvent {
  id: string; // The event ID
  pubkey: string; // The author's public key
  created_at: number; // Unix timestamp in seconds
  content: string; // Description of the calendar event
  tags: string[][]; // All tags associated with the event
  d: string; // A short unique string identifier
  title: string; // Title of the calendar event
  summary?: string; // Brief description of the calendar event
  image?: string; // URL of an image to use for the event
  locations: string[]; // Locations of the calendar event (can be multiple)
  geohash?: string; // Geohash to associate event with a physical location
  participants: ParticipantInfo[]; // List of participants
  hashtags: string[]; // Hashtags to categorize the event
  references: string[]; // References/links to web pages, documents, etc.
  calendarRefs: string[]; // References to calendars this event is part of
}

/**
 * Participant info extracted from 'p' tags
 */
export interface ParticipantInfo {
  pubkey: string; // 32-bytes hex pubkey of a participant
  relayUrl?: string; // Optional recommended relay URL
  role?: string; // Optional participant's role in the meeting
}

/**
 * Date-based calendar event (kind 31922)
 * For all-day or multi-day events where time and timezone are not significant
 */
export interface DateBasedCalendarEvent extends BaseCalendarEvent {
  kind: 31922;
  start: string; // Inclusive start date in ISO 8601 format (YYYY-MM-DD)
  end?: string; // Optional exclusive end date in ISO 8601 format (YYYY-MM-DD)
}

/**
 * Time-based calendar event (kind 31923)
 * For events that occur at specific times
 */
export interface TimeBasedCalendarEvent extends BaseCalendarEvent {
  kind: 31923;
  start: number; // Inclusive start Unix timestamp in seconds
  end?: number; // Optional exclusive end Unix timestamp in seconds
  start_tzid?: string; // Time zone of the start timestamp (IANA Time Zone Database)
  end_tzid?: string; // Time zone of the end timestamp
}

/**
 * Calendar (kind 31924)
 * A collection of calendar events
 */
export interface Calendar {
  id: string; // The event ID
  pubkey: string; // The author's public key
  created_at: number; // Unix timestamp in seconds
  kind: 31924;
  content: string; // Description of the calendar
  d: string; // A short unique string identifier
  title: string; // Calendar title
  eventRefs: CalendarEventRef[]; // References to events in this calendar
}

/**
 * Reference to a calendar event from a calendar
 */
export interface CalendarEventRef {
  kind: 31922 | 31923; // Either date-based or time-based event
  pubkey: string; // Author's pubkey
  identifier: string; // d-identifier of the calendar event
  relayUrl?: string; // Optional relay URL
}

/**
 * Calendar event RSVP (kind 31925)
 * Response to a calendar event to indicate attendance intention
 */
export interface CalendarEventRSVP {
  id: string; // The event ID
  pubkey: string; // The author's public key (person who is RSVPing)
  created_at: number; // Unix timestamp in seconds
  kind: 31925;
  content: string; // Optional note that adds context to this response
  eventCoordinates: string; // Coordinates to the calendar event (a tag)
  eventId?: string; // Optional specific event ID being responded to
  d: string; // Unique identifier for this RSVP
  status: 'accepted' | 'declined' | 'tentative'; // Attendance status
  freebusy?: 'free' | 'busy'; // Whether the user is free or busy during event
  authorPubkey?: string; // Pubkey of the original calendar event author
}

/**
 * Union type for both kinds of calendar events
 */
export type CalendarEvent = DateBasedCalendarEvent | TimeBasedCalendarEvent;

/**
 * Helper function to determine if a calendar event is date-based
 */
export function isDateBasedEvent(event: CalendarEvent): event is DateBasedCalendarEvent {
  return event.kind === 31922;
}

/**
 * Helper function to determine if a calendar event is time-based
 */
export function isTimeBasedEvent(event: CalendarEvent): event is TimeBasedCalendarEvent {
  return event.kind === 31923;
}

/**
 * Helper function to extract a specific tag value from a Nostr event
 */
export function getTagValue(event: NostrEvent, tagName: string): string | undefined {
  return event.tags.find(tag => tag[0] === tagName)?.[1];
}

/**
 * Helper function to extract all values for a specific tag from a Nostr event
 */
export function getTagValues(event: NostrEvent, tagName: string): string[] {
  return event.tags
    .filter(tag => tag[0] === tagName)
    .map(tag => tag[1]);
}

/**
 * Generate a unique identifier for calendar events
 * @returns A random identifier string
 */
export function generateCalendarId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Helper function to convert a NostrEvent to a structured CalendarEvent
 */
export function parseCalendarEvent(event: NostrEvent): CalendarEvent | null {
  if (event.kind !== 31922 && event.kind !== 31923) {
    return null;
  }

  // Extract common fields
  const d = getTagValue(event, 'd');
  const title = getTagValue(event, 'title');
  const start = getTagValue(event, 'start');
  
  // Check required fields according to NIP-52
  if (!d || !title || !start) {
    return null;
  }

  const summary = getTagValue(event, 'summary');
  const image = getTagValue(event, 'image');
  const geohash = getTagValue(event, 'g');
  
  // Extract array values
  const locations = getTagValues(event, 'location');
  const hashtags = getTagValues(event, 't');
  const references = getTagValues(event, 'r');
  const calendarRefs = getTagValues(event, 'a');
  
  // Extract participants
  const participants: ParticipantInfo[] = event.tags
    .filter(tag => tag[0] === 'p')
    .map(tag => ({
      pubkey: tag[1],
      relayUrl: tag[2],
      role: tag[3]
    }));
  
  // Base event structure
  const baseEvent: BaseCalendarEvent = {
    id: event.id,
    pubkey: event.pubkey,
    created_at: event.created_at,
    content: event.content,
    tags: event.tags,
    d,
    title,
    summary,
    image,
    locations,
    geohash,
    participants,
    hashtags,
    references,
    calendarRefs
  };
  
  // Create specific event type based on the kind
  if (event.kind === 31922) {
    // Date-based event
    return {
      ...baseEvent,
      kind: 31922,
      start,
      end: getTagValue(event, 'end')
    };
  } else {
    // Time-based event
    const startTime = parseInt(start);
    
    // Validate start time
    if (isNaN(startTime)) {
      return null;
    }
    
    const endStr = getTagValue(event, 'end');
    const end = endStr ? parseInt(endStr) : undefined;
    
    return {
      ...baseEvent,
      kind: 31923,
      start: startTime,
      end: end && !isNaN(end) ? end : undefined,
      start_tzid: getTagValue(event, 'start_tzid'),
      end_tzid: getTagValue(event, 'end_tzid')
    };
  }
}

/**
 * Serialize a Calendar Event to a Nostr Event
 * @param event The calendar event to serialize
 * @returns A Nostr event ready to be published
 */
export function serializeCalendarEvent(event: CalendarEvent): Partial<NostrEvent> {
  // Build common tags
  const tags: string[][] = [
    ['d', event.d],
    ['title', event.title]
  ];
  
  // Add optional tags
  if (event.summary) tags.push(['summary', event.summary]);
  if (event.image) tags.push(['image', event.image]);
  
  // Add array-based tags
  event.locations.forEach(location => tags.push(['location', location]));
  if (event.geohash) tags.push(['g', event.geohash]);
  
  // Add participants
  event.participants.forEach(participant => {
    const tag = ['p', participant.pubkey];
    if (participant.relayUrl) tag.push(participant.relayUrl);
    if (participant.role) tag.push(participant.role);
    tags.push(tag);
  });
  
  // Add hashtags, references, and calendar references
  event.hashtags.forEach(hashtag => tags.push(['t', hashtag]));
  event.references.forEach(reference => tags.push(['r', reference]));
  event.calendarRefs.forEach(calRef => tags.push(['a', calRef]));
  
  // Create event-specific tags
  if (isDateBasedEvent(event)) {
    // Date-based event (kind 31922)
    tags.push(['start', event.start]);
    if (event.end) tags.push(['end', event.end]);
    
    return {
      kind: 31922,
      content: event.content,
      tags
    };
  } else {
    // Time-based event (kind 31923)
    tags.push(['start', event.start.toString()]);
    if (event.end !== undefined) tags.push(['end', event.end.toString()]);
    if (event.start_tzid) tags.push(['start_tzid', event.start_tzid]);
    if (event.end_tzid) tags.push(['end_tzid', event.end_tzid]);
    
    return {
      kind: 31923,
      content: event.content,
      tags
    };
  }
}

/**
 * Serialize a Calendar Event RSVP to a Nostr Event
 * @param rsvp The calendar event RSVP to serialize
 * @returns A Nostr event ready to be published
 */
export function serializeCalendarRSVP(rsvp: CalendarEventRSVP): Partial<NostrEvent> {
  const tags: string[][] = [
    ['a', rsvp.eventCoordinates],
    ['d', rsvp.d],
    ['status', rsvp.status]
  ];
  
  if (rsvp.eventId) tags.push(['e', rsvp.eventId]);
  if (rsvp.freebusy && rsvp.status !== 'declined') tags.push(['fb', rsvp.freebusy]);
  if (rsvp.authorPubkey) tags.push(['p', rsvp.authorPubkey]);
  
  return {
    kind: 31925,
    content: rsvp.content,
    tags
  };
}