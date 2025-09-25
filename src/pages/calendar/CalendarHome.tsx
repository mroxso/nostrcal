import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarMonthView } from '@/components/calendar/CalendarMonthView';
import { UpcomingEventsList } from '@/components/calendar/UpcomingEventsList';
import { CalendarEventSearch } from '@/components/calendar/CalendarEventSearch';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { RelaySelector } from '@/components/RelaySelector';
import { CalendarLayout } from '@/components/calendar/CalendarLayout';
import { useSeoMeta } from '@unhead/react';

export function CalendarHome() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("month");
  
  useSeoMeta({
    title: 'NostCal - Calendar',
    description: 'View and manage your Nostr calendar events',
  });
  
  // Get the tab from URL if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['month', 'upcoming', 'search'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('tab', value);
    
    // Update URL without triggering navigation
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?${urlParams.toString()}`
    );
  };
  
  return (
    <CalendarLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Calendar
            <span className="text-sm ml-2 text-muted-foreground">
              Events on Nostr
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse, search, and create calendar events
          </p>
        </div>
        
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Button 
            onClick={() => navigate('/calendar/new')} 
            className="flex items-center gap-2 w-full md:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>New Event</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/calendar/new')}
            className="whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <RelaySelector />
      </div>
      
      <Tabs 
        defaultValue="month" 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="month">Calendar</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="month" className="space-y-4">
          <CalendarMonthView />
        </TabsContent>
        
        <TabsContent value="upcoming" className="space-y-4">
          <UpcomingEventsList />
        </TabsContent>
        
        <TabsContent value="search" className="space-y-4">
          <CalendarEventSearch />
        </TabsContent>
      </Tabs>
    </CalendarLayout>
  );
}