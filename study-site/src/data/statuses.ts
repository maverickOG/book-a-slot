/**
 * Booking status machine, grounded in app/models/enums.py and
 * app/routers/bookings.py. Note: `cancelled` exists in the enum but is not
 * reached by any current endpoint — DELETE physically removes open slots.
 */
export interface StatusState {
  value: string;
  meaning: string;
  reachedBy: string;
  source?: string;
}

export const statusStates: StatusState[] = [
  {
    value: "pending",
    meaning: "Provider opened an available slot. customer_id is NULL.",
    reachedBy: "Created via POST /bookings (provider)",
  },
  {
    value: "confirmed",
    meaning: "A customer claimed the slot; the interval is now a booking.",
    reachedBy: "POST /bookings/{id}/book sets customer_id + status (atomic UPDATE)",
  },
  {
    value: "completed",
    meaning: "The provider finished the booking; only this state is reviewable.",
    reachedBy: "POST /bookings/{id}/complete (provider/admin)",
  },
  {
    value: "cancelled",
    meaning: "Declared in the enum but not produced by any endpoint.",
    reachedBy: "— (no route sets it; DELETE removes open slots physically)",
  },
];

/** Allowed status transitions as (from, via, to). */
export const statusTransitions = [
  { from: "pending", via: "POST /bookings/{id}/book", to: "confirmed" },
  { from: "confirmed", via: "POST /bookings/{id}/complete", to: "completed" },
  { from: "pending", via: "DELETE /bookings/{id}", to: "(row deleted)" },
  { from: "pending", via: "PUT /bookings/{id}", to: "pending (rescheduled)" },
] as const;