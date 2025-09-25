import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

const Index = () => {
  useSeoMeta({
    title: 'NostCal - Nostr Calendar App',
    description: 'A calendar application built on the Nostr protocol for viewing and creating calendar events.',
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Welcome to NostCal
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Your decentralized calendar powered by Nostr
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="text-left">
            <CardHeader>
              <CardTitle>Calendar Events</CardTitle>
              <CardDescription>View and manage your Nostr calendar events</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar 
                mode="single" 
                className="rounded-md border"
              />
            </CardContent>
            <CardFooter>
              <Link to="/calendar" className="w-full">
                <Button className="w-full">Go to Calendar</Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card className="text-left">
            <CardHeader>
              <CardTitle>Create New Event</CardTitle>
              <CardDescription>Add a new calendar event to the Nostr network</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Share events with the Nostr community. Create date-based or time-based 
                events and let others RSVP to participate.
              </p>
            </CardContent>
            <CardFooter>
              <Link to="/calendar/new" className="w-full">
                <Button variant="outline" className="w-full">Create Event</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-600 mt-8">
          Vibed with MKStack • <a href="https://soapbox.pub/mkstack" className="underline hover:text-primary">Learn More</a>
        </p>
      </div>
    </div>
  );
};

export default Index;
