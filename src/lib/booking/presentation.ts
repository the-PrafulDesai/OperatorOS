import { format } from "date-fns";
import type { BookingView } from "@/types/database";
export function bookingSchedule(booking: Pick<BookingView, "product_type" | "booking_date" | "start_time" | "end_time" | "start_date" | "end_date">) {
  if (booking.booking_date) return `${format(new Date(`${booking.booking_date}T00:00:00`), "d MMM yyyy")}${booking.start_time ? ` · ${booking.start_time.slice(0,5)}–${booking.end_time?.slice(0,5)}` : ""}`;
  if (booking.start_date && booking.end_date) return `${format(new Date(`${booking.start_date}T00:00:00`), "d MMM yyyy")} – ${format(new Date(`${booking.end_date}T00:00:00`), "d MMM yyyy")}`;
  return "Schedule unavailable";
}
