import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { LoginArea } from "@/components/auth/LoginArea";

export function CalendarNavigation() {
  const { user } = useCurrentUser();

  return (
    <div className="w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 py-2">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/">
            <h1 className="text-xl font-bold text-primary">NostCal</h1>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link to="/calendar">
              <Button variant="ghost">Calendar</Button>
            </Link>
            <Link to="/calendar/new">
              <Button variant="ghost">New Event</Button>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <LoginArea className="max-w-60" />
          {user && (
            <Link to="/calendar/new" className="md:hidden">
              <Button size="sm" variant="outline">+ Event</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}