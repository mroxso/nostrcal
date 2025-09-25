import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";

import Index from "./pages/Index";
import { NIP19Page } from "./pages/NIP19Page";
import NotFound from "./pages/NotFound";
import { CalendarHome } from "./pages/calendar/CalendarHome";
import { CalendarEventPage } from "./pages/calendar/CalendarEventPage";
import { NewCalendarEventPage } from "./pages/calendar/NewCalendarEventPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        {/* Calendar routes */}
        <Route path="/calendar" element={<CalendarHome />} />
        <Route path="/calendar/event/:id" element={<CalendarEventPage />} />
        <Route path="/calendar/new" element={<NewCalendarEventPage />} />
        {/* NIP-19 identifier route */}
        <Route path="/:nip19" element={<NIP19Page />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}