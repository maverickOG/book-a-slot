/**
 * The final database schema, grounded in app/models/*.py.
 * Guards: ondelete="RESTRICT" keeps referenced users/bookings from being
 * deleted while rows still point at them.
 */
export interface Field {
  name: string;
  type: string;
  notes?: string;
}

export interface Model {
  table: string;
  label: string;
  fields: Field[];
  constraints?: string[];
  source: string;
}

export const models: Model[] = [
  {
    table: "users",
    label: "One row per account (admin, provider, or customer)",
    fields: [
      { name: "id", type: "integer · PK" },
      { name: "email", type: "varchar(255)", notes: "unique + indexed" },
      { name: "password_hash", type: "varchar(255)", notes: "never plaintext" },
      { name: "token", type: "varchar(255) · nullable", notes: "unique; set at login" },
      { name: "role", type: "user_role enum", notes: "admin | provider | customer" },
      { name: "created_at", type: "timestamptz", notes: "server default now()" },
    ],
    constraints: ["UQ(email)", "UQ(token) when set"],
    source: "app/models/user.py",
  },
  {
    table: "bookings",
    label: "One row per time slot or customer booking",
    fields: [
      { name: "id", type: "integer · PK" },
      { name: "provider_id", type: "integer · FK → users.id", notes: "NOT NULL, RESTRICT, indexed" },
      { name: "customer_id", type: "integer · FK → users.id", notes: "nullable, RESTRICT, indexed" },
      { name: "starts_at", type: "timestamptz", notes: "NOT NULL" },
      { name: "ends_at", type: "timestamptz", notes: "NOT NULL" },
      { name: "status", type: "booking_status enum", notes: "pending | confirmed | completed | cancelled" },
      { name: "created_at", type: "timestamptz", notes: "server default now()" },
    ],
    constraints: ["CHECK (ends_at > starts_at)", "IX(provider_id)", "IX(customer_id)", "IX(status)"],
    source: "app/models/booking.py",
  },
  {
    table: "reviews",
    label: "One review per completed booking",
    fields: [
      { name: "id", type: "integer · PK" },
      { name: "booking_id", type: "integer · FK → bookings.id", notes: "unique + indexed" },
      { name: "rating", type: "integer", notes: "1–5 via CHECK" },
      { name: "comment", type: "text", notes: "NOT NULL" },
      { name: "summary", type: "text · nullable", notes: "reserved for a summarisation worker" },
      { name: "created_at", type: "timestamptz", notes: "server default now()" },
    ],
    constraints: ["CHECK (rating BETWEEN 1 AND 5)", "UQ(booking_id) → one review per booking"],
    source: "app/models/review.py",
  },
];