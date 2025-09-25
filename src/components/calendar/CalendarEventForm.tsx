import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addHours, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock, X } from 'lucide-react';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDateBasedCalendarEvent, useTimeBasedCalendarEvent } from '@/hooks/calendar/useCalendarPublish';

// Schema for date-based events (kind 31922)
const dateBasedSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  start: z.date({ required_error: 'Start date is required' }),
  end: z.date().optional(),
  content: z.string().default(''),
  summary: z.string().optional(),
  image: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  location: z.string().optional(),
  hashtags: z.string().optional(),
});

// Schema for time-based events (kind 31923)
const timeBasedSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  date: z.date({ required_error: 'Date is required' }),
  startTime: z.string().min(1, { message: 'Start time is required' }),
  endTime: z.string().optional(),
  timezone: z.string().optional(),
  content: z.string().default(''),
  summary: z.string().optional(),
  image: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  location: z.string().optional(),
  hashtags: z.string().optional(),
});

type DateBasedFormValues = z.infer<typeof dateBasedSchema>;
type TimeBasedFormValues = z.infer<typeof timeBasedSchema>;

/**
 * Form for creating new calendar events (both date-based and time-based)
 */
export function CalendarEventForm() {
  const [eventType, setEventType] = useState<'date' | 'time'>('date');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mutations for creating events
  const { mutateAsync: createDateEvent } = useDateBasedCalendarEvent();
  const { mutateAsync: createTimeEvent } = useTimeBasedCalendarEvent();
  
  // Form for date-based events
  const dateForm = useForm<DateBasedFormValues>({
    resolver: zodResolver(dateBasedSchema),
    defaultValues: {
      title: '',
      start: new Date(),
      content: '',
      summary: '',
      image: '',
      location: '',
      hashtags: '',
    },
  });
  
  // Form for time-based events
  const timeForm = useForm<TimeBasedFormValues>({
    resolver: zodResolver(timeBasedSchema),
    defaultValues: {
      title: '',
      date: new Date(),
      startTime: format(new Date(), 'HH:mm'),
      endTime: format(addHours(new Date(), 1), 'HH:mm'),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      content: '',
      summary: '',
      image: '',
      location: '',
      hashtags: '',
    },
  });
  
  // Split hashtags string into an array
  const processHashtags = (hashtagsStr: string | undefined): string[] => {
    if (!hashtagsStr) return [];
    
    return hashtagsStr
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  };
  
  // Handle form submission for date-based events
  const onDateBasedSubmit = async (values: DateBasedFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Format dates as ISO strings (YYYY-MM-DD)
      const startDate = format(values.start, 'yyyy-MM-dd');
      const endDate = values.end ? format(values.end, 'yyyy-MM-dd') : undefined;
      
      // Create event
      await createDateEvent({
        title: values.title,
        start: startDate,
        end: endDate,
        content: values.content,
        summary: values.summary || undefined,
        image: values.image || undefined,
        locations: values.location ? [values.location] : [],
        hashtags: processHashtags(values.hashtags),
      });
      
      // Reset form
      dateForm.reset();
      alert('Event created successfully!');
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle form submission for time-based events
  const onTimeBasedSubmit = async (values: TimeBasedFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Combine date and time to create timestamps
      const startDateTime = new Date(values.date);
      const [startHours, startMinutes] = values.startTime.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes, 0, 0);
      
      let endDateTime: Date | undefined;
      
      if (values.endTime) {
        endDateTime = new Date(values.date);
        const [endHours, endMinutes] = values.endTime.split(':').map(Number);
        endDateTime.setHours(endHours, endMinutes, 0, 0);
      }
      
      // Create event
      await createTimeEvent({
        title: values.title,
        start: Math.floor(startDateTime.getTime() / 1000),
        end: endDateTime ? Math.floor(endDateTime.getTime() / 1000) : undefined,
        content: values.content,
        summary: values.summary || undefined,
        image: values.image || undefined,
        start_tzid: values.timezone,
        end_tzid: values.timezone,
        locations: values.location ? [values.location] : [],
        hashtags: processHashtags(values.hashtags),
      });
      
      // Reset form
      timeForm.reset();
      alert('Event created successfully!');
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs
        defaultValue="date"
        value={eventType}
        onValueChange={(value) => setEventType(value as 'date' | 'time')}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="date">Date Event</TabsTrigger>
          <TabsTrigger value="time">Time Event</TabsTrigger>
        </TabsList>
        
        <TabsContent value="date" className="space-y-4 pt-4">
          <Form {...dateForm}>
            <form onSubmit={dateForm.handleSubmit(onDateBasedSubmit)} className="space-y-6">
              <FormField
                control={dateForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={dateForm.control}
                  name="start"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < startOfDay(new Date())
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={dateForm.control}
                  name="end"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < dateForm.getValues("start")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={dateForm.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief summary of the event" {...field} />
                    </FormControl>
                    <FormDescription>
                      A short description that appears in event previews
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={dateForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a detailed description of your event" 
                        className="min-h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={dateForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Event location" {...field} />
                    </FormControl>
                    <FormDescription>
                      Address, venue name, or online meeting link
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={dateForm.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>
                      URL for an image to represent your event
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={dateForm.control}
                name="hashtags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="music, conference, workshop" {...field} />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of tags
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Event...' : 'Create Date Event'}
              </Button>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="time" className="space-y-4 pt-4">
          <Form {...timeForm}>
            <form onSubmit={timeForm.handleSubmit(onTimeBasedSubmit)} className="space-y-6">
              <FormField
                control={timeForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={timeForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < startOfDay(new Date())
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={timeForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Input type="time" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={timeForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time (Optional)</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={timeForm.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      IANA timezone identifier (e.g., "America/New_York")
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={timeForm.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief summary of the event" {...field} />
                    </FormControl>
                    <FormDescription>
                      A short description that appears in event previews
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={timeForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a detailed description of your event" 
                        className="min-h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={timeForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Event location" {...field} />
                    </FormControl>
                    <FormDescription>
                      Address, venue name, or online meeting link
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={timeForm.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>
                      URL for an image to represent your event
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={timeForm.control}
                name="hashtags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="music, conference, workshop" {...field} />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of tags
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Event...' : 'Create Time Event'}
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}