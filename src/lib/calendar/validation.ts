import type { NostrEvent } from "@nostrify/nostrify";
import { getTagValue } from "./types";

/**
 * Validate that a Nostr event is a proper calendar event according to NIP-52
 * @param event The Nostr event to validate
 * @returns True if the event is a valid calendar event, false otherwise
 */
export function validateCalendarEvent(event: NostrEvent): boolean {
  // Check if it's a calendar event kind
  if (![31922, 31923].includes(event.kind)) return false;

  // Check for required tags according to NIP-52
  const d = getTagValue(event, 'd');
  const title = getTagValue(event, 'title');
  const start = getTagValue(event, 'start');

  // All calendar events require 'd', 'title', and 'start' tags
  if (!d || !title || !start) return false;

  // Additional validation for date-based events (kind 31922)
  if (event.kind === 31922) {
    // start tag should be in YYYY-MM-DD format for date-based events
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start)) return false;

    // If end date exists, check format and ensure it's after start date
    const end = getTagValue(event, 'end');
    if (end) {
      if (!dateRegex.test(end)) return false;
      // Check that end date is after start date
      if (end <= start) return false;
    }
  }

  // Additional validation for time-based events (kind 31923)
  if (event.kind === 31923) {
    // start tag should be a unix timestamp for time-based events
    const timestamp = parseInt(start);
    if (isNaN(timestamp) || timestamp <= 0) return false;

    // If end time exists, validate it
    const endStr = getTagValue(event, 'end');
    if (endStr) {
      const endTime = parseInt(endStr);
      if (isNaN(endTime) || endTime <= 0) return false;
      // Check that end time is after start time
      if (endTime <= timestamp) return false;
    }

    // Check time zone validity if provided
    const start_tzid = getTagValue(event, 'start_tzid');
    if (start_tzid && !isValidTimeZone(start_tzid)) return false;

    const end_tzid = getTagValue(event, 'end_tzid');
    if (end_tzid && !isValidTimeZone(end_tzid)) return false;
  }

  return true;
}

/**
 * Validate a calendar (kind 31924)
 * @param event The Nostr event to validate
 * @returns True if the event is a valid calendar, false otherwise
 */
export function validateCalendar(event: NostrEvent): boolean {
  // Check if it's a calendar kind
  if (event.kind !== 31924) return false;

  // Check for required tags
  const d = getTagValue(event, 'd');
  const title = getTagValue(event, 'title');

  // Calendars require 'd' and 'title' tags
  return !!(d && title);
}

/**
 * Validate a calendar event RSVP (kind 31925)
 * @param event The Nostr event to validate
 * @returns True if the event is a valid calendar event RSVP, false otherwise
 */
export function validateCalendarEventRSVP(event: NostrEvent): boolean {
  // Check if it's a calendar event RSVP kind
  if (event.kind !== 31925) return false;

  // Check for required tags
  const d = getTagValue(event, 'd');
  const status = getTagValue(event, 'status');
  
  // Check if a tag exists
  const aTag = event.tags.find(tag => tag[0] === 'a');
  
  // RSVPs require 'd', 'status', and 'a' tags
  if (!d || !status || !aTag) return false;
  
  // Status must be one of 'accepted', 'declined', or 'tentative'
  if (!['accepted', 'declined', 'tentative'].includes(status)) return false;
  
  // If status is 'declined', fb tag shouldn't be present
  if (status === 'declined') {
    const fbTag = event.tags.find(tag => tag[0] === 'fb');
    if (fbTag) return false;
  }
  
  // If fb tag exists, it must be 'free' or 'busy'
  const fbValue = getTagValue(event, 'fb');
  if (fbValue && !['free', 'busy'].includes(fbValue)) return false;
  
  // Validate a tag format (should be <kind>:<pubkey>:<identifier>)
  const aValue = aTag[1];
  const aParts = aValue.split(':');
  if (aParts.length < 3) return false;
  
  const kind = parseInt(aParts[0]);
  if (isNaN(kind) || ![31922, 31923].includes(kind)) return false;
  
  return true;
}

/**
 * Utility function to check if a string is a valid IANA time zone identifier
 * @param tz The time zone identifier to check
 * @returns True if the string is a valid time zone, false otherwise
 */
export function isValidTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, {timeZone: tz});
    return true;
  } catch (e) {
    return false;
  }
}

// generateCalendarId function moved to types.ts