/**
 * The Alembic migration history, grounded in alembic/versions/*.py.
 * Notice how 0002 fixes a design change: customer_id was NOT NULL at first,
 * which would have prevented "provider opens a slot, then a customer books it".
 */
export interface Migration {
  id: string;
  file: string;
  title: string;
  changes: string[];
  downgrade: string[];
}

export const migrations: Migration[] = [
  {
    id: "20260911_0001",
    file: "20260911_0001_create_initial_schema.py",
    title: "Initial schema: users, bookings, reviews",
    changes: [
      "users table: email unique + indexed, password_hash, role enum",
      "bookings table: provider_id FK RESTRICT, customer_id FK RESTRICT (NOT NULL at this point), status enum, CHECK ends_at > starts_at",
      "reviews table: booking_id unique FK, rating CHECK 1–5",
      "PostgreSQL enum types: user_role, booking_status",
      "Indexes on email, provider_id, customer_id, status, booking_id",
    ],
    downgrade: ["drops reviews, bookings, users, then the two enum types"],
  },
  {
    id: "20260911_0002",
    file: "20260911_0002_nullable_customer_add_review_summary.py",
    title: "Customer becomes nullable; reviews gain summary",
    changes: [
      "bookings.customer_id → nullable (a pending slot has no customer yet)",
      "reviews.summary: nullable TEXT, reserved for the summarisation worker",
    ],
    downgrade: ["drops summary; customer_id back to NOT NULL"],
  },
  {
    id: "20260911_0003",
    file: "20260911_0003_add_users_token.py",
    title: "Add the bearer token column",
    changes: [
      "users.token: nullable varchar(255) with a UNIQUE constraint",
      "Population happens at login (app logic), not in the migration",
    ],
    downgrade: ["drops the unique constraint, then the token column"],
  },
];