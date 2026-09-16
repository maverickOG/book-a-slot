/**
 * Every HTTP route the Book a Slot API actually exposes.
 * Grounded in app/routers/*.py (see src/code-snapshots).
 */
export interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  title: string;
  auth: string;
  body?: string;
  responses: string[];
  source: string;
}

export const endpoints: Endpoint[] = [
  {
    method: "POST",
    path: "/auth/signup",
    title: "Create a customer account",
    auth: "Public",
    body: `{ "email": "string", "password": "string" }`,
    responses: ["201 { id, email, role }", "400 duplicate email"],
    source: "app/routers/auth.py",
  },
  {
    method: "POST",
    path: "/auth/login",
    title: "Log in and receive a bearer token",
    auth: "Public",
    body: `{ "email": "string", "password": "string" }`,
    responses: ["200 { access_token, token_type: 'bearer' }", "401 wrong credentials"],
    source: "app/routers/auth.py",
  },
  {
    method: "GET",
    path: "/auth/me",
    title: "Who am I?",
    auth: "Bearer",
    body: undefined,
    responses: ["200 { id, email, role }", "401 missing/invalid token"],
    source: "app/routers/auth.py",
  },
  {
    method: "POST",
    path: "/bookings",
    title: "Create an available slot (provider)",
    auth: "Bearer · provider",
    body: `{ "starts_at": "ISO datetime", "ends_at": "ISO datetime" }`,
    responses: ["201 { booking }", "401", "403 not a provider", "422 bad time range"],
    source: "app/routers/bookings.py",
  },
  {
    method: "GET",
    path: "/bookings",
    title: "List bookings (role-filtered)",
    auth: "Bearer",
    body: undefined,
    responses: [
      "200 list — admin: all · provider: own slots · customer: own bookings",
      "200 ?status=pending — customer sees available slots only",
      "401",
    ],
    source: "app/routers/bookings.py",
  },
  {
    method: "GET",
    path: "/bookings/{id}",
    title: "Read one booking",
    auth: "Bearer",
    body: undefined,
    responses: ["200 { booking }", "403 not owner/admin", "404 not found", "401"],
    source: "app/routers/bookings.py",
  },
  {
    method: "PUT",
    path: "/bookings/{id}",
    title: "Reschedule an available slot",
    auth: "Bearer · provider or admin",
    body: `{ "starts_at": "ISO datetime", "ends_at": "ISO datetime" }`,
    responses: ["200 { booking }", "409 slot already booked/not pending", "403", "404"],
    source: "app/routers/bookings.py",
  },
  {
    method: "DELETE",
    path: "/bookings/{id}",
    title: "Remove an available slot",
    auth: "Bearer · provider or admin",
    body: undefined,
    responses: ["204 no content", "409 slot already booked/not pending", "403", "404"],
    source: "app/routers/bookings.py",
  },
  {
    method: "POST",
    path: "/bookings/{id}/book",
    title: "Book an available slot (customer)",
    auth: "Bearer · customer",
    body: undefined,
    responses: ["200 { booking, customer_id set }", "409 slot already taken", "403", "404"],
    source: "app/routers/bookings.py",
  },
  {
    method: "POST",
    path: "/bookings/{id}/complete",
    title: "Complete a confirmed booking",
    auth: "Bearer · provider or admin",
    body: undefined,
    responses: ["200 { booking }", "409 not in confirmed state", "403", "404"],
    source: "app/routers/bookings.py",
  },
  {
    method: "POST",
    path: "/reviews",
    title: "Review a completed booking (customer)",
    auth: "Bearer · customer",
    body: `{ "booking_id": int, "rating": 1-5, "comment": "string" }`,
    responses: [
      "201 { id, booking_id, rating, comment }",
      "409 booking not completed",
      "403 not the booking's customer",
      "409 duplicate review",
    ],
    source: "app/routers/reviews.py",
  },
  {
    method: "POST",
    path: "/reviews/{review_id}/summarize",
    title: "Enqueue a review-summarisation job",
    auth: "Bearer · author (the customer who wrote it)",
    body: undefined,
    responses: [
      "202 { status: 'queued', review_id }",
      "404 review not found",
      "403 not the author",
    ],
    source: "app/routers/reviews.py",
  },
];