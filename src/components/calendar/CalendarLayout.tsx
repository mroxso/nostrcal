import { ReactNode } from "react";
import { CalendarNavigation } from "./CalendarNavigation";

interface CalendarLayoutProps {
  children: ReactNode;
}

export function CalendarLayout({ children }: CalendarLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <CalendarNavigation />
      <main className="flex-1 container py-6">{children}</main>
      <footer className="border-t border-gray-200 dark:border-gray-800 py-4">
        <div className="container text-center text-sm text-gray-500 dark:text-gray-400">
          Vibed with MKStack • <a href="https://soapbox.pub/mkstack" className="underline hover:text-primary">Learn More</a>
        </div>
      </footer>
    </div>
  );
}