# AGENTS.md

## Purpose

This file is the persistent source of truth for AI agents working on this repository.

Every AI coding agent must read this file before making changes.

The file must be updated after every meaningful implementation step, architectural decision,
bug fix, failed attempt, discovered constraint, or important learning.

The goal is that a new AI agent with no conversation history can read this file and understand:
- what the project is
- what the assessment requires
- what has already been implemented
- how the implementation works
- what decisions have been made and why
- what went wrong previously
- how previous mistakes were fixed
- what must not be repeated
- what remains to be done
- how the project should be verified

Do not treat this file as disposable documentation. It is the project's persistent AI context.

---

# 1. Project

**Project:** Book a Slot  
**Purpose:** Bodhrik Full Stack Development Take-Home Assessment

**Deadline:** 11 September 2026, 4:00 PM IST

The implementation must follow the actual assessment brief. Do not invent requirements.

---

# 2. Current Environment

- OS: macOS
- Python: 3.14.7
- FastAPI: 0.141.1
- SQLAlchemy: 2.0.52
- Alembic: 1.19.2
- psycopg: 3.3.5
- Virtual environment: `.venv`
- Package manager: pip
- Development IDE: PyCharm Professional
- Git repository: public repository required for submission

---

# 3. Developer Background / Working Style

The developer is comfortable with:

- JavaScript
- TypeScript
- React
- Next.js
- Node.js
- REST APIs
- Git
- GitHub
- frontend development

The developer has previously used full-stack technologies but has limited recent
hands-on experience with Python backend development.

The developer is therefore expected to understand the implementation rather than
blindly copy generated code.

AI assistance is allowed and will be used, but:

1. Never blindly generate an entire feature without explanation.
2. Explain important implementation decisions.
3. Explain unfamiliar Python/FastAPI concepts when they appear.
4. The developer must be able to explain and modify the implementation.
5. Prefer simple, understandable implementations over unnecessary abstractions.

---

# 4. Required Technology

The assessment requires the following technologies:

- FastAPI or Django
- PostgreSQL
- Redis
- Docker / Docker Compose
- GitHub Actions
- Automated testing

The project is using:

- FastAPI
- PostgreSQL
- Redis
- Docker Compose
- pytest
- Ruff
- SQLAlchemy
- Alembic

PostgreSQL is the real target database.

Do not introduce SQLite as a substitute for PostgreSQL unless explicitly required
for an isolated test and documented.

---

# 5. Architecture

Current planned structure:

    book-a-slot/
    ├── app/
    │   ├── main.py
    │   ├── models/
    │   ├── schemas/
    │   ├── routes/
    │   ├── services/
    │   └── database.py
    │
    ├── tests/
    ├── .env
    ├── Dockerfile
    ├── docker-compose.yml
    ├── pyproject.toml
    └── README.md

This structure may change if there is a concrete technical reason.

Do not restructure the project merely for stylistic reasons.

---

# 6. Development Rules

## Before making changes

1. Read this file.
2. Inspect the existing implementation.
3. Check the current task and progress.
4. Understand existing architectural decisions.
5. Do not duplicate functionality that already exists.
6. Do not modify unrelated files.

## While making changes

1. Keep changes focused on the current milestone.
2. Prefer simple and explicit code.
3. Follow existing project conventions.
4. Do not add dependencies without a reason.
5. Do not introduce abstractions that are not currently useful.
6. Preserve working functionality.
7. Do not silently change previously established behavior.

## After making changes

1. Run relevant tests.
2. Run linting where applicable.
3. Verify the application actually starts when relevant.
4. Verify database/Redis integration when relevant.
5. Report failures honestly.
6. Update this file with:
   - what changed
   - why it changed
   - important implementation details
   - tests/checks performed
   - failures encountered
   - fixes applied
   - lessons learned
   - remaining work

Never claim something works without verifying it.

---

# 7. AI Agent Rules

Every AI agent working on this repository must:

- Read `AGENTS.md` before doing anything.
- Respect the current architecture.
- Update `AGENTS.md` after meaningful work.
- Record important mistakes and their solutions.
- Record decisions that future agents should not revisit unnecessarily.
- Check this file before attempting to solve a previously documented problem.
- Avoid repeating documented failed approaches.
- Keep the project explainable to the developer.
- Ask for clarification rather than inventing requirements when the assessment brief
  does not provide enough information.

If a previous approach failed, document:

**Problem:**
What happened.

**Cause:**
Why it happened, if known.

**Fix:**
What resolved it.

**Prevention:**
What future agents should do differently.

---

# 8. Assessment Progress

## Milestone 1 — Project Scaffolding

Status: COMPLETE

Planned:
- pyproject.toml
- FastAPI application
- dependency configuration
- Ruff configuration
- pytest configuration
- basic application import
- basic health/root endpoint
- baseline automated test

Verification:
- Ruff passes
- application imports
- FastAPI application starts
- baseline test passes

Completed implementation:
- `pyproject.toml` defines the FastAPI/Uvicorn runtime dependencies, pytest and
  Ruff development dependencies, pytest discovery, and Ruff rules.
- `app/__init__.py` marks `app` as the application package.
- `app/main.py` creates the FastAPI application and minimal `GET /` endpoint.
- `tests/test_main.py` verifies the endpoint status code and JSON response.

Milestone 1 deliberately does not include database, Redis, authentication, RBAC,
routers, SQLAlchemy, Alembic, Docker, or later-milestone functionality.

---

## Milestone 2 — Database + Models + Alembic

Status: COMPLETE

Planned:
- PostgreSQL connection
- SQLAlchemy setup
- database models
- Alembic
- initial migration
- verification against real PostgreSQL

Completed implementation:
- `app/database.py` creates a PostgreSQL SQLAlchemy engine, shared declarative
  base, session factory, and request-scoped `get_db()` generator dependency.
- `app/models/` contains only `User`, `Booking`, and `Review` models plus shared
  role/status enums. There is intentionally no Slot or ProviderSlot table.
- `alembic.ini`, `alembic/env.py`, and `alembic/script.py.mako` configure
  environment-based PostgreSQL migrations and model metadata discovery.
- The initial migration creates the users, bookings, and reviews tables, their
  relationships, constraints, indexes, and PostgreSQL enum types.
- `tests/test_database.py` checks PostgreSQL targeting, registered tables, and
  session construction.

Approved schema decisions:
- A booking stores the selected provider time interval through `starts_at` and
  `ends_at`; the assessment does not explicitly require an independent slot or
  availability table.
- `customer_id` is nullable on `bookings`. The brief says "providers offer time
  slots, customers book them." A provider creates an available slot with no
  customer yet (customer_id NULL, status pending). A customer later books it by
  setting customer_id and changing status to confirmed. NOT NULL customer_id
  would prevent this two-step flow.
- There is no separate Slot or ProviderSlot table. The booking row itself
  represents a slot when customer_id is NULL. The assessment names only Users,
  Bookings, and Reviews.
- Users have `admin`, `provider`, and `customer` roles.
- Email is unique, reviews are one per booking, ratings are 1 through 5, and
  booking intervals must end after they start.
- `Review.summary` is a nullable TEXT column. It exists so the review
  summarisation endpoint (Milestone 5) has a place to persist its result without
  requiring a later schema change. The column is not populated yet.
- Review completion eligibility remains application logic for a later milestone;
  it is not incorrectly enforced as a cross-table database check.

---

## Milestone 3 — Authentication + RBAC

Status: COMPLETE

Planned:
- signup
- login
- password hashing
- bearer authentication
- customer/provider/admin authorization
- appropriate access restrictions
- tests for role isolation

Completed implementation:
- `passlib` (runtime dependency) hashes passwords with the pure-Python
  `pbkdf2_sha256` scheme. `passlib[bcrypt]` was rejected: passlib 1.7.4 is
  unmaintained and incompatible with bcrypt 5.0 on Python 3.14.
- `users.token` holds the DB-stored bearer token; it is null until login,
  populated at login, unique when set.
- `app/security.py` exposes exactly `get_password_hash`, `verify_password`,
  `get_current_user`, `require_admin`, `require_provider`, `require_customer`.
  `get_current_user` parses `Authorization: Bearer <token>`, looks up the token in
  `users.token`, and returns the User (401 otherwise). Role dependencies return
  the user or raise 403.
- `app/routers/auth.py` exposes only `POST /auth/signup`, `POST /auth/login`,
  `GET /auth/me`. Signup always creates a customer (no role in the payload, so an
  anonymous caller cannot elevate). Login verifies the password and issues a
  `secrets.token_urlsafe(32)` token.
- No booking or review endpoints, no ownership helpers, no JWT, no logout, no
  Redis. M4 will consume `get_current_user` plus its own booking ownership
  dependencies.
- Tests: `tests/test_auth.py` covers signup, duplicate email, login success and
  failure, and `/auth/me` with missing/invalid/valid tokens.
  `tests/test_security.py` exercises the role dependencies directly with in-memory
  User objects only.
- Post-review hardening: signup commit is wrapped in `try/except IntegrityError`
  (rollback + 400) so concurrent duplicate emails cannot surface as a 500;
  a test proves a `role: "admin"` signup payload still creates a customer; the
  `/auth/me` response keys are asserted to be exactly `{id, email, role}`.

Approved M3 decisions:
- DB-stored bearer token instead of JWT: simpler, revocable (set token to NULL),
  explainable, and consistent with a PostgreSQL-centric service. JWT signing key,
  expiration, and refresh flows are not required by the brief.
- Tests use an in-memory SQLite database via FastAPI dependency override of
  `get_db` (documented isolated-test allowance in AGENTS.md). PostgreSQL remains
  the only real database.

Do not implement a complex middleware/policy system unless the actual requirements
justify it.

---

## Milestone 4 — Booking CRUD

Status: COMPLETE

Planned:
- booking creation
- booking retrieval
- booking updates
- booking deletion
- role-based filtering
- object-level ownership checks

Completed implementation:
- `app/routers/bookings.py` exposes the seven booking routes:
  `POST /bookings`, `GET /bookings`, `GET /bookings/{id}`,
  `PUT /bookings/{id}`, `DELETE /bookings/{id}`, `POST /bookings/{id}/book`,
  `POST /bookings/{id}/complete`.
- `GET /bookings` is role-filtered: admin sees all, provider sees own slots,
  customer sees own bookings by default. Customer support `?status=pending`,
  which returns only genuinely available slots (customer_id NULL, status
  pending) so customers can discover slots to book without seeing any other
  customer's booking.
- `app/security.py` gained three pure helpers:
  `get_booking_or_404`, `require_owner_or_admin`, `require_can_view_booking`.
  There is intentionally no `require_booking_customer` — M4 has no
  customer-mutation endpoint, so it would be dead code.
- Slot creation is provider-only (`require_provider`); a slot starts
  `pending` with `customer_id NULL`.
- Booking happens through an atomic conditional UPDATE
  (`WHERE status = 'pending' AND customer_id IS NULL`), so two customers
  cannot claim the same slot through a check-then-update race. Completing
  uses the same conditional-UPDATE pattern
  (`WHERE status = 'confirmed' AND customer_id IS NOT NULL`).
- PUT/DELETE only operate on available (pending, unbooked) slots, 409
  otherwise. Complete only transitions confirmed → completed, 409 otherwise.
- Tests: `tests/test_bookings.py` (18 tests) proves creation, role isolation,
  availability, bookings, completions, forbidden access, invalid IDs, time
  ordering, and state guards.

Approved M4 decisions:
- Booking is matched to availability atomically with a conditional UPDATE
  (`status = 'pending' AND customer_id IS NULL` → confirmed); no SELECT FOR
  UPDATE is needed. The same conditional-UPDATE pattern covers completion.
  This is the smallest correct concurrency fix and behaves correctly on both
  PostgreSQL (row lock + WHERE re-evaluation under READ COMMITTED) and SQLite
  (serialized single-writer).
- Customers discover available slots through `GET /bookings?status=pending`
  (returns only pending slots with customer_id NULL). This satisfies the
  assessment's "customer can read only their own" rule while still letting
  customers find slots to book, without a separate discovery endpoint.
- `cancelled` booking status is intentionally not set by any M4 endpoint.
  DELETE physically removes open (pending, unbooked) slots only; confirmed and
  completed bookings cannot be deleted (409).
- PUT accepts only `starts_at` and `ends_at`; status/provider/customer are
  never user-settable. PUT/DELETE are restricted to pending, unbooked slots.
- There is no migration for M4: the Milestone 2 schema already contains every
  column, constraint, index, and enum value the booking flow needs.

Do not implement a complex middleware/policy system unless the actual requirements
justify it.

---

## Milestone 5 — Reviews + Redis

Status: COMPLETE

Planned:
- review functionality
- review summarization endpoint
- Redis queue
- required queue payload
- tests for Redis interaction

Completed implementation:
- `app/redis_client.py` reads `REDIS_URL` (default `redis://localhost:6379/0`),
  builds one module-level `redis.Redis` client, and exposes `get_redis_client()`
  as a FastAPI dependency so tests can override it (mirrors the `get_db`
  pattern).
- `redis>=5,<6` added to the runtime dependencies in `pyproject.toml`.
- `app/security.py` gained `require_booking_customer(booking, current_user)`
  (403 unless `booking.customer_id == current_user.id`). This is the helper M4
  deliberately avoided as dead code; review authorization makes it genuinely
  required.
- `app/routers/reviews.py` exposes exactly two routes:
  - `POST /reviews` — customer-only (`require_customer`); body
    `{booking_id, rating, comment}`. Rejections, in order: booking not found
    (404), booking not completed (409), caller not the booking's customer
    (403), duplicate review (409). Creates the review and returns 201 with
    `{id, booking_id, rating, comment}`.
  - `POST /reviews/{id}/summarize` — customer-only and author-only. Loads the
    review (404 when missing), enqueues
    `json.dumps({"review_id": N})` onto the Redis list `review_summary_jobs`
    via `rpush`, and returns 202 `{"status": "queued", "review_id": N}`.
- `app/main.py` registers the reviews router.
- `tests/test_reviews.py` (13 tests) proves valid creation, rejection in each
  booking state (pending/confirmed/cancelled/nonexistent), another-customer and
  provider 403s, duplicate rejection, rating 422, and exact queue key/payload
  captures through a FakeRedis.
- `tests/conftest.py` gained a hand-rolled `FakeRedis` class and a `fake_redis`
  fixture that overrides `get_redis_client` via `app.dependency_overrides`.
  `tests/__init__.py` was added so tests can import `tests.conftest`.
- No Alembic migration: the M2 reviews table already contains every needed
  column and constraint (unique booking_id enforces one review per booking,
  rating check 1–5, comment NOT NULL, summary TEXT nullable for later use).

Approved M5 decisions:
- Reviews are created via `POST /reviews` with `booking_id` in the body, not a
  nested `/bookings/{id}/review` route.
- A non-completed booking returns 409, matching the M4 state-conflict
  convention, and the state check runs before the author check — a pending or
  cancelled booking is non-reviewable by anyone, so 409 is returned to any
  caller without leaking authorship details.
- Summarization is a synchronous stub: it pushes the exact payload
  `{"review_id": N}` to the `review_summary_jobs` list and returns 202. There
  is no worker, no AI, and no retry/visibility logic. `reviews.summary` stays
  NULL (populated by a future summarisation worker if one is added).
- Summarization is author-only (the customer who wrote the review), mirroring
  the rule that controls who may create the review.

Do not implement a background worker or real AI summarisation in this milestone.

---

## Milestone 6 — Docker + Seed Data

Status: NOT STARTED

Planned:
- Dockerfile
- Docker Compose
- API service
- PostgreSQL service
- Redis service
- health checks
- seed data

---

## Milestone 7 — GitHub Actions

Status: NOT STARTED

Planned:
- CI workflow
- lint
- automated tests
- verify workflow through an actual push

---

## Milestone 8 — Documentation + Technical Note

Status: NOT STARTED

Planned:
- README
- setup instructions
- endpoint documentation
- architecture explanation
- 300–500 word technical note
- production-readiness considerations

---

# 9. Current Task

**Current milestone:** Milestone 5

**Current state:** Milestones 1–4 are committed. Milestone 5 (reviews + Redis
summarisation queue) is implemented per the approved plan and verified with 53
passing tests (40 prior + 13 review/Redis). The summarisation endpoint is a
synchronous stub that pushes the exact payload onto `review_summary_jobs`;
tests use a DI-overridden FakeRedis because no live Redis server is available.
Live PostgreSQL migration execution, true concurrent-transaction verification,
and a live Redis `rpush` all remain pending until the Docker/PostgreSQL/Redis
stack arrives (M6). Milestone 6 (Docker + seed data) is next.

FastAPI learning has been completed through:
- application creation
- routes
- GET/POST/PUT/PATCH/DELETE
- path parameters
- query parameters
- Pydantic request models
- response models
- status codes
- HTTP exceptions
- FastAPI dependencies / Depends
- basic project structure
- basic pytest/TestClient testing
- SQLAlchemy declarative models and sessions
- Alembic migrations and metadata discovery
- password hashing and verification (passlib pbkdf2_sha256)
- bearer-token authentication and FastAPI dependency injection
- role-gated dependencies (admin/provider/customer)
- object-level ownership checks (owner-or-admin, can-view, booking-customer)
- atomic conditional UPDATE for concurrency-safe state transitions
- dependency-overriding an external service (Redis) with a test double

---

# 10. Decisions Log

Record important architectural or implementation decisions here.

Format:

### [DATE] Decision

**Decision:**
What was decided.

**Reason:**
Why.

**Alternative considered:**
What else was considered.

**Why rejected:**
Why the alternative was not selected.

### 2026-09-11 Milestone 1 dependency configuration

**Decision:**
Keep runtime dependencies limited to FastAPI and Uvicorn, and put pytest, Ruff,
and HTTPX in the `dev` optional dependency group.

**Reason:**
This is enough to run the API and its baseline test without introducing any
Milestone 2 or later technology.

**Alternative considered:**
Adding database, Redis, authentication, Docker, or migration dependencies during
initial scaffolding.

**Why rejected:**
Those dependencies belong to later assessment milestones and would make the
initial project harder to understand and verify.

### 2026-09-11 Milestone 2 schema

**Decision:**
Use only `users`, `bookings`, and `reviews` tables. Represent a selected time
slot as the booking interval and do not add a Slot or ProviderSlot table.

**Reason:**
The assessment explicitly names Users, Bookings, and Reviews in the PostgreSQL
schema, but does not explicitly require independent availability management or a
slot table.

**Alternative considered:**
Adding a separate provider availability table for unbooked slots.

**Why rejected:**
That would infer an API and data model not stated in the brief. It can be added
later only if a concrete requirement requires independently managed availability.

### 2026-09-11 Milestone 2 customer_id nullable and Review.summary

**Decision:**
Make `customer_id` nullable on `bookings` and add a nullable `summary` TEXT column
to `reviews`.

**Reason:**
The brief says "providers offer time slots, customers book them." A provider
creates an available slot with no customer yet — customer_id must be NULL at that
point. NOT NULL would force a provider to specify a customer when creating a
slot, which breaks the domain flow. Review.summary exists so the M5
summarisation endpoint has a place to persist its result without a later schema
change.

**Alternative considered:**
Keeping customer_id NOT NULL and having providers create slots with a dummy
customer value.

**Why rejected:**
This would make the schema dishonest — a slot with no customer should not have
a customer_id set. It would also require additional application logic to replace
the dummy value later.

### 2026-09-11 Milestone 2 PostgreSQL configuration

**Decision:**
Read `DATABASE_URL` from the environment, with a localhost PostgreSQL default for
application imports, and require `DATABASE_URL` explicitly when running Alembic.

**Reason:**
The application remains importable without a running database, while migrations
cannot accidentally run against an unspecified database.

**Alternative considered:**
SQLite fallback or hard-coded credentials.

**Why rejected:**
The assessment requires PostgreSQL as the real target, and hard-coded credentials
are unsafe.

### 2026-09-11 Milestone 3 password hashing

**Decision:**
Add `passlib` as a runtime dependency and hash with the pure-Python
`pbkdf2_sha256` scheme instead of `passlib[bcrypt]`.

**Reason:**
Verification on Python 3.14.7 showed `passlib[bcrypt]` fails: passlib 1.7.4 is
unmaintained and reads `bcrypt.__about__.__version__`, which bcrypt 5.0 removed.
Its self-check also triggers bcrypt's 72-byte password error. `pbkdf2_sha256` is
implemented on top of stdlib `hashlib.pbkdf2_hmac`, needs no C backend, and was
verified to hash and verify correctly.

**Alternative considered:**
Pinning `bcrypt<4.1`, or calling `hashlib.pbkdf2_hmac` directly.

**Why rejected:**
Old bcrypt wheels are unavailable for Python 3.14 (source build risk). Writing
salted PBKDF2 manually duplicates what passlib already does correctly.

### 2026-09-11 Milestone 3 DB-stored bearer token

**Decision:**
Authenticate with a random token stored in `users.token` (given out at login),
not JWT.

**Reason:**
The brief only requires "bearer authentication". A stored token needs no signing
key, no expiration/refresh flow, and is revocable simply by setting
`users.token` to NULL. It is easy to explain and fits a PostgreSQL-centric
service.

**Alternative considered:**
JWT with `python-jose` or PyJWT.

**Why rejected:**
JWT adds signing-key management, expirations, and refresh logic that the brief
does not ask for. It is not "simpler" for this scope, and choosing it merely for
convention would violate the minimal design rule.

### 2026-09-11 Milestone 3 signup role

**Decision:**
`POST /auth/signup` always creates a `customer`.

**Reason:**
Signup is anonymous. Accepting a role in the signup payload would let anyone
register as admin or provider. Admin/provider users will come from seed data
(Milestone 6) or direct DB insert.

**Alternative considered:**
Accepting a role field on signup.

**Why rejected:**
That is an obvious privilege-escalation hole and is not required by the brief.

### 2026-09-11 Milestone 3 test database

**Decision:**
Tests use an in-memory SQLite database through a FastAPI dependency override of
`get_db` (in `tests/conftest.py`); PostgreSQL remains the only real database.

**Reason:**
Auth endpoint tests must persist signups and tokens. No PostgreSQL server is
available locally and Docker is not installed yet. AGENTS.md explicitly allows
SQLite for an isolated, documented test setup.

**Alternative considered:**
Running a real PostgreSQL container for tests.

**Why rejected:**
Docker is not installed on this machine; CI (Milestone 7) can use the compose
stack. The application code never references SQLite.

### 2026-09-11 Milestone 4 ownership helpers

**Decision:**
Add exactly three pure helpers to `app/security.py`:
`get_booking_or_404`, `require_owner_or_admin`, `require_can_view_booking`.
They are called explicitly in the endpoint body after a `Depends`-provided
`get_current_user` or `require_customer`; none of them is itself a `Depends`.

**Reason:**
The endpoints need object-level authorization after the 404 (does the object
exist?) check. Calling plain functions with `(booking, current_user)` is the
smallest readable structure and avoids path-param-derived dependency plumbing.
Keeping them in `security.py` groups all authorization in one place.

**Alternative considered:**
`require_booking_customer` (a helper enforcing `booking.customer_id == user`)
and slot availability as a FastAPI dependency.

**Why rejected:**
M4 has no customer-mutation endpoint, so `require_booking_customer` would be
dead code. Expressing "is this slot still bookable?" as a dependency is another
layer that duplicates the atomic UPDATE's own `WHERE` guard.

### 2026-09-11 Milestone 4 slot discovery

**Decision:**
Customers find bookable slots through `GET /bookings?status=pending`, which for
customers returns only slots with `status = 'pending' AND customer_id IS NULL`.
The default `GET /bookings` still returns only the customer's own bookings.

**Reason:**
The assessment requires "a customer can only read their own bookings", but a
customer must still be able to find slots to book. Because an available slot has
`customer_id IS NULL`, a pending-only filter can never expose another customer's
booking, so it does not violate the read rule.

**Alternative considered:**
A separate discovery endpoint or an `available=true` query flag.

**Why rejected:**
The assessment lists only CRUD plus book/complete. A query filter is the
smallest change that satisfies both requirements without new routes.

### 2026-09-11 Milestone 4 cancel/delete semantics

**Decision:**
No M4 endpoint sets `status = 'cancelled'`. DELETE physically removes a slot
only while it is pending and unbooked; confirmed and completed bookings cannot
be deleted (409).

**Reason:**
The status enum includes `cancelled`, but the assessment specifies CRUD plus
book/complete, not cancellation. Hard-deleting open slots is the simplest
interpretation of DELETE and avoids inventing a cancellation flow (e.g. whether
a customer or provider authorizes it, or what happens to a confirmed booking).

**Alternative considered:**
DELETE as a soft cancel (status → cancelled).

**Why rejected:**
Soft-cancelling requires rules for who may cancel confirmed bookings and what
happens to associated data; that is speculative for M4.

### 2026-09-11 Milestone 5 Redis queue dependency

**Decision:**
Summarization is a synchronous stub: `POST /reviews/{id}/summarize` pushes
`json.dumps({"review_id": N})` onto the Redis list `review_summary_jobs` via
`rpush` and returns 202 `{"status": "queued", "review_id": N}`.

**Reason:**
The brief requires an "endpoint that triggers a review summarisation job" over
a Redis queue with the required payload; it does not require a worker or real
summarisation. The stub satisfies the letter of the requirement with the
smallest correct implementation.

**Alternative considered:**
A real background worker consuming the queue and populating `reviews.summary`.

**Why rejected:**
A worker, AI provider, retry/visibility logic, and result persistence are all
outside the M5 scope. Building them now would add unverifiable complexity
without a live Redis server to test against.

### 2026-09-11 Milestone 5 Redis test double

**Decision:**
Tests override the `get_redis_client()` dependency with a hand-rolled
`FakeRedis` class (records `rpush` calls) via `app.dependency_overrides`. No
`fakeredis` package and no live Redis are used.

**Reason:**
This mirrors the existing `get_db` DI-override pattern in `tests/conftest.py`
and makes exact queue key/payload assertions trivial. `fakeredis` would add a
dependency with no benefit at this scope, and a live Redis is unavailable.

**Alternative considered:**
Installing `fakeredis` or running a real Redis for tests.

**Why rejected:**
Only `rpush` is exercised; a full Redis semantic stand-in or real server is
overkill and unverifiable locally.

### 2026-09-11 Milestone 5 `require_booking_customer` added

**Decision:**
Add `require_booking_customer(booking, current_user)` to `app/security.py`
(403 unless `booking.customer_id == current_user.id`). Used by both review
routes.

**Reason:**
M4 deliberately omitted it as dead code. M5 makes it genuinely required:
reviews may only be created by, and summarized by, the customer who booked the
slot.

**Alternative considered:**
Inlining the check in the reviews router body.

**Why rejected:**
Keeping all authorization in `security.py` preserves the M3/M4 grouping
convention and makes the ownership rule reusable and testable in isolation.

### 2026-09-11 Milestone 5 review rejection ordering

**Decision:**
In `POST /reviews`, rejections run in this order: unknown booking (404),
booking not completed (409), caller not the booking's customer (403),
duplicate review (409).

**Reason:**
A pending, confirmed, or cancelled booking is non-reviewable by anyone,
independent of authorship. Returning 409 before checking the author means no
unowned booking can ever leak authorization information, and the state guard
is provably reachable in tests (a pending slot has no customer against whom an
author check could even run).

**Alternative considered:**
Author check before the state check.

**Why rejected:**
Pending slots have `customer_id IS NULL`, so the author check would 403
-first and the completed-state rule could never be exercised for them. The
state check must precede the author check by design.

### 2026-09-11 Milestone 5 tests import from conftest

**Decision:**
`tests/__init__.py` makes `tests` a Python package so `tests/test_reviews.py`
can `from tests.conftest import FakeRedis`.

**Reason:**
Each test module needs the `FakeRedis` class; pytest auto-loads `conftest.py`
but plain Python imports require an importable package.

**Alternative considered:**
Duplicating `FakeRedis` inside `tests/test_reviews.py`.

**Why rejected:**
The fake and its `fake_redis` fixture belong beside the other test utilities
in `conftest.py`; duplicating them would let them drift apart.

---

# 11. Lessons Learned

Record reusable technical lessons here.

Format:

### [DATE] Lesson

**What happened:**

**What we learned:**

**What future agents should do:**

### 2026-09-11 Milestone 1 verification

**What happened:**
The repository's existing `.venv` contained Python 3.14.7 but none of the project
dependencies or verification tools.

**What we learned:**
Installing the declared editable project with its development extras prepares the
existing environment reproducibly from `pyproject.toml`.

**What future agents should do:**
Check the existing virtual environment before running checks, and install only the
dependencies declared for the current milestone when tools are missing.

### 2026-09-11 Milestone 2 implementation

**What happened:**
Adding the Alembic directory caused setuptools automatic package discovery to see
both `app` and `alembic` as top-level packages.

**What we learned:**
Application package discovery must be explicit when repository tooling directories
are present at the project root.

**What future agents should do:**
Keep setuptools discovery limited to `app*` and do not package Alembic scripts as
Python application packages.

### 2026-09-11 Milestone 3 passlib and bcrypt

**What happened:**
Installing `passlib[bcrypt]` on Python 3.14.7 installed passlib 1.7.4 and bcrypt
5.0.0, but the first hash attempt raised `AttributeError: module 'bcrypt' has no
attribute '__about__'`, followed by a `ValueError` about passwords longer than 72
bytes during passlib's backend self-check.

**What we learned:**
passlib 1.7.4 is unmaintained and only compatible with bcrypt < 4.1. bcrypt 5.0
removed the `__about__` module; the self-check also runs a 72-byte test that
bcrypt 5.0 rejects. passlib's own `pbkdf2_sha256` scheme is pure Python (stdlib
`hashlib`) and works correctly on Python 3.14.

**What future agents should do:**
Verify hashing libraries actually hash/verify on the current Python before adding
them to `pyproject.toml`. Prefer `passlib`'s `pbkdf2_sha256` on Python 3.14; do
not reach for `passlib[bcrypt]`.

### 2026-09-11 Milestone 4 FastAPI validation order

**What happened:**
A test that asserted a customer's unauthorized `PUT /bookings/{id}` with an empty
body returns 403 instead received 422.

**What we learned:**
FastAPI validates and builds the request body params *before* the endpoint
function body runs. When an authorization gate is a plain function call inside
the endpoint (not a `Depends`), a malformed body produces 422 before the 403 can
be raised. In contrast, `require_provider`/`require_customer` are `Depends`
dependencies, so their 403 fires before body validation.

**What future agents should do:**
When testing authorization for an endpoint with a request body, send a VALID
payload so the auth check is actually reached, or move the gate into a `Depends`
if 403 must precede body validation.

### 2026-09-11 Milestone 5 importing test helpers from conftest

**What happened:**
`POST /reviews/{id}/summarize` needed the `rpush` result asserted against a
recording fake. The `FakeRedis` class lived in `conftest.py`; importing it with
`from tests.conftest import FakeRedis` failed with
`ModuleNotFoundError: No module named 'tests'`.

**What we learned:**
pytest auto-loads `conftest.py` as a fixture source, but `tests/` was not an
importable Python package, so a plain `import tests.conftest` failed. Adding
`tests/__init__.py` makes test modules importable and lets tests share helper
classes defined in conftest without duplication.

**What future agents should do:**
When tests import helper classes from `conftest.py`, ensure `tests` is a
package (`tests/__init__.py`). Otherwise define the helper inside the test file
itself.

---

# 12. Known Problems / Failed Approaches

Record failed approaches here so future agents do not repeat them.

Format:

### [DATE] Problem

**Problem:**

**Cause:**

**Fix:**

**Prevention:**

### 2026-09-11 Missing initial verification tools

**Problem:**
The first verification command could not start because `.venv/bin/ruff` did not
exist.

**Cause:**
The pre-existing virtual environment was empty apart from pip.

**Fix:**
Installed the project with its `dev` extras, which added FastAPI, Uvicorn, HTTPX,
pytest, and Ruff.

**Prevention:**
Inspect the environment and install the declared project dependencies before
running milestone checks.

### 2026-09-11 Duplicate enum migration SQL

**Problem:**
The first migration draft emitted each PostgreSQL enum type twice in offline SQL.

**Cause:**
The migration explicitly created the enum and the table column definition also
requested enum creation.

**Fix:**
Removed the explicit enum creation and let the table definitions create each type
once; downgrade still drops the types after the tables.

**Prevention:**
Inspect generated PostgreSQL migration SQL before running it against a database.

### 2026-09-11 passlib[bcrypt] failure on Python 3.14

**Problem:**
Planning to hash with `passlib[bcrypt]`, but the first hash call raised
`AttributeError` (bcrypt has no `__about__`) and then `ValueError` (72-byte check).

**Cause:**
passlib 1.7.4 is unmaintained; bcrypt 5.0 removed `bcrypt.__about__.__version__`
that passlib reads, and bcrypt 5.0 also rejects the >= 72-byte password passlib
uses in its self-check.

**Fix:**
Switched to passlib's pure-Python `pbkdf2_sha256` scheme (stdlib `hashlib`), added
plain `passlib` as a runtime dependency, and verified hashing/verification on
Python 3.14.

**Prevention:**
Verify hashing/verification on the actual Python before locking a dependency.

---

# 13. Verification Log

Record meaningful verification results.

Format:

### [DATE] Verification

**Command/check:**

**Result:**

**Notes:**

### 2026-09-11 Milestone 1 verification

**Command/check:**
Ruff check, pytest, direct FastAPI import, and an in-process `GET /` request using
the repository's `.venv`.

**Result:**
All checks passed. Ruff reported no issues; pytest collected one test and reported
`1 passed`; the application imported successfully; and `GET /` returned `200` with
`{"message": "Book a Slot API is running"}`.

**Notes:**
Pytest reported two third-party deprecation warnings from the installed Starlette/
AnyIO stack. They do not affect the passing test or application behavior.

### 2026-09-11 Milestone 2 verification

**Command/check:**
Ruff, pytest, FastAPI import, SQLAlchemy engine/session setup, mapper configuration,
and Alembic offline SQL generation targeting PostgreSQL.

**Result:**
Ruff passed; pytest collected four tests and reported `4 passed`; the application
imported successfully; the engine dialect was PostgreSQL; all three model
relationships configured successfully; and offline Alembic SQL contained the
three domain tables and two enum types exactly once.

**Not verified:**
No PostgreSQL server was available on localhost:5432, so live Alembic upgrade,
schema inspection, relationship inserts, downgrade, and upgrade-again checks
could not be run. Docker was also unavailable.

### 2026-09-11 Milestone 2 schema fix verification

**Command/check:**
Ruff, pytest, offline Alembic upgrade/downgrade SQL for migration `20260911_0002`.

**Result:**
Ruff passed; pytest collected four tests and reported `4 passed`; offline upgrade
SQL showed `ALTER COLUMN customer_id DROP NOT NULL` and `ADD COLUMN summary TEXT`;
downgrade SQL showed `DROP COLUMN summary` and `ALTER COLUMN customer_id SET NOT
NULL`.

**Not verified:**
Live PostgreSQL execution of the migration. The migration is simple DDL but needs
a running server to confirm execution and rollback.

### 2026-09-11 Milestone 3 verification

**Command/check:**
Ruff, pytest, FastAPI import + OpenAPI route listing, and Alembic offline
upgrade/downgrade SQL for migration `20260911_0003`.

**Result:**
Ruff passed; pytest collected 21 tests and reported `21 passed` (8 auth, 3
pre-existing database, 1 root endpoint, 9 role-dependency); the OpenAPI schema
listed `/auth/signup`, `/auth/login`, `/auth/me`; offline upgrade SQL showed
`ADD COLUMN token VARCHAR(255)` and `ADD CONSTRAINT uq_users_token UNIQUE (token)`;
downgrade SQL dropped the constraint then the column.

**Not verified:**
Live PostgreSQL execution of migration `20260911_0003`; live token lookup via
`users.token` against a real server. These need a running PostgreSQL/Docker stack.

### 2026-09-11 Milestone 3 review fixes verification

**Command/check:**
Ruff and pytest after applying the three review fixes, plus runtime probes of
`HTTPBearer` (no header, `Basic`, empty `Bearer`, lowercase `bearer`) and
pydantic extra-field handling for the signup payload.

**Result:**
Ruff passed; pytest collected 22 tests and reported `22 passed` (9 auth, 3
pre-existing database, 1 root endpoint, 9 role-dependency). HTTPBearer returns
None (→ 401) for missing/`Basic`/empty-token headers and tolerates lowercase
`bearer`; pydantic silently drops an extra `role` field from the signup payload,
so signup cannot self-assign a role. The exact `/auth/me` key set `{id, email,
role}` is now asserted, confirming `password_hash` and `token` are not exposed.

### 2026-09-11 Milestone 4 verification

**Command/check:**
Ruff, pytest, FastAPI import + OpenAPI route listing, Alembic offline
`upgrade head --sql`, and application-level booking flows through the SQLite
test override.

**Result:**
Ruff passed; pytest collected 40 tests and reported `40 passed`
(18 bookings, 9 auth, 3 database, 1 root, 9 role-dependency);
OpenAPI listed `/bookings`, `/bookings/{booking_id}`,
`/bookings/{booking_id}/book`, `/bookings/{booking_id}/complete` plus the
existing auth routes; offline Alembic SQL ran migrations `0001 → 0002 → 0003`
with no new migration, confirming the chain is intact. Application-level tests
proved provider slot creation, customer booking, double-booking rejection (409),
provider/customer/admin isolation, 403/404/422 behaviors, PUT/DELETE guards, and
confirmed → completed transitions.

**Not verified:**
Live PostgreSQL migration execution; true concurrent-transaction booking (two
simultaneous requests racing for one slot) — the atomic conditional UPDATE is
implemented and behaviorally exercised on SQLite, but simultaneous
multi-transaction interleaving requires a running PostgreSQL server (M6/Docker).

### 2026-09-11 Milestone 5 verification

**Command/check:**
Ruff, pytest, FastAPI import + OpenAPI route listing, Alembic offline
`upgrade head --sql`, and application-level review/Redis flows through the
SQLite + FakeRedis test overrides.

**Result:**
Ruff passed; pytest collected 53 tests and reported `53 passed`
(13 reviews, 18 bookings, 9 auth, 3 database, 1 root, 9 role-dependency);
OpenAPI listed `/reviews` and `/reviews/{review_id}/summarize` alongside the
existing routes; offline Alembic SQL still ran migrations `0001 → 0002 → 0003`
with no new migration, confirming the chain is intact. Application-level tests
proved review creation on completed bookings only, rejection for
pending/confirmed/cancelled/nonexistent bookings, author and provider 403s,
duplicate rejection (409), rating validation (422), and exact capture of the
`rpush("review_summary_jobs", '{"review_id": N}')` call through FakeRedis.

**Not verified:**
Live Redis `rpush` against a real server, live review persistence on
PostgreSQL, and concurrent duplicate-review handling across transactions — all
require the M6 Docker/PostgreSQL/Redis stack. The queue stub, integration
contract, and payload format are defined and exercised with test doubles.

---

# 14. Change Log

Keep a concise chronological record of meaningful project changes.

Format:

### [DATE] Milestone / Change

- Changed:
- Reason:
- Verification:
- Commit:

### 2026-09-11 Milestone 1 completed

- Changed: Added the minimal FastAPI application, root endpoint, baseline pytest,
  and Ruff/pytest project configuration.
- Reason: Completed the requested project scaffolding milestone without adding
  later-milestone functionality.
- Verification: Ruff passed, pytest passed (`1 passed`), import passed, and the
  root endpoint returned HTTP 200 with the expected response.
- Commit: Not created; the developer will commit the work.

### 2026-09-11 Milestone 2 completed

- Changed: Added PostgreSQL SQLAlchemy setup, User/Booking/Review models, Alembic
  configuration, the initial migration, and database-focused tests.
- Reason: Implemented the approved Milestone 2 schema without adding a slot table
  or any later-milestone API/authentication/Redis/Docker functionality.
- Verification: Ruff passed, pytest passed (`4 passed`), imports and mapper setup
  passed, and PostgreSQL-targeted offline migration SQL was inspected. Live
  PostgreSQL migration verification remains pending because no local server was
  available.
- Commit: Created by the developer in the public repository history; see the git log.

### 2026-09-11 Milestone 2 schema fix — customer_id nullable + Review.summary

- Changed: Made `bookings.customer_id` nullable, added `reviews.summary` (nullable
  TEXT), created Alembic migration `20260911_0002`.
- Reason: PostgreSQL review found that NOT NULL customer_id prevented the core
  domain flow (provider creates slot → customer books it). Review.summary exists
  so the M5 summarisation endpoint can persist results without a later schema
  change.
- Verification: Ruff passed, pytest passed (`4 passed`), offline Alembic upgrade
  SQL verified (ALTER COLUMN DROP NOT NULL + ADD COLUMN), downgrade SQL verified
  (DROP COLUMN + ALTER COLUMN SET NOT NULL).
- Commit: Created by the developer in the public repository history; see the git log.

### 2026-09-11 Milestone 3 completed

- Changed: Added passlib (`pbkdf2_sha256`) hashing as a runtime dependency,
  `users.token` bearer-token column (migration `20260911_0003`), `app/security.py`
  (hashing, `get_current_user`, admin/provider/customer role dependencies), and
  `app/routers/auth.py` (`POST /auth/signup`, `POST /auth/login`, `GET /auth/me`).
- Reason: Implemented the assessment's authentication and role-based access
  control requirements without booking/review endpoints, ownership helpers, JWT,
  logout, or Redis.
- Verification: Ruff passed; pytest passed (`21 passed`); OpenAPI listed the three
  auth routes; offline Alembic upgrade/downgrade SQL for `20260911_0003` verified.
  Live PostgreSQL migration execution remains pending.
- Commit: Created by the developer in the public repository history; see the git log.

### 2026-09-11 Milestone 3 review fixes

- Changed: Wrapped the signup commit in `try/except IntegrityError` (rollback +
  400) in `app/routers/auth.py`; added a signup role-escalation test
  (`role: "admin"` still creates a customer) and an exact-response-keys assertion
  for `/auth/me` (`{id, email, role}`) in `tests/test_auth.py`.
- Reason: Strict code review found the duplicate-email pre-check had a
  check-then-insert race (concurrent signups could raise an unhandled 500), and
  the role-escalation guard and /auth/me non-leak guarantee were genuine M3
  security requirements that were untested.
- Verification: Ruff passed; pytest passed (`22 passed`).
- Commit: Created by the developer in the public repository history; see the git log.

### 2026-09-11 Milestone 4 completed

- Changed: Added `app/routers/bookings.py` with the seven booking routes,
  three ownership helpers in `app/security.py` (`get_booking_or_404`,
  `require_owner_or_admin`, `require_can_view_booking`), `app/main.py` router
  registration, and `tests/test_bookings.py`.
- Reason: Implemented the assessment's booking CRUD, role-based filtering,
  object-level ownership checks, and concurrency-safe booking/complete with no
  schema change (the M2 bookings table already supported the full flow).
- Verification: Ruff passed; pytest passed (`40 passed`); OpenAPI listed the
  seven booking routes plus auth routes; offline Alembic SQL confirmed the
  `0001 → 0002 → 0003` chain. Live PostgreSQL run and true concurrent-transaction
  booking remain unverified (no local server; M6/Docker).
- Commit: Created by the developer in the public repository history; see the git log.

### 2026-09-11 Milestone 5 completed

- Changed: Added `app/redis_client.py` (env-driven Redis client +
  `get_redis_client()` DI dependency), `redis>=5,<6` dependency, the
  `require_booking_customer` helper in `app/security.py`, `app/routers/reviews.py`
  (`POST /reviews`, `POST /reviews/{id}/summarize`), reviews router registration
  in `app/main.py`, and `tests/test_reviews.py` with a FakeRedis test double in
  `tests/conftest.py`.
- Reason: Implemented the assessment's review-only-completed-bookings rule and
  the summarisation trigger over a Redis queue, with the exact payload pushed to
  `review_summary_jobs` and no worker/AI (stub only).
- Verification: Ruff passed; pytest passed (`53 passed`); OpenAPI listed
  `/reviews` and `/reviews/{review_id}/summarize`; offline Alembic SQL confirmed
  the unchanged `0001 → 0002 → 0003` chain (no schema change needed). Live Redis
  `rpush` and live PostgreSQL persistence remain unverified (M6/Docker).
- Commit: Not created; the developer will review and commit the work.

---

# 15. Current Next Steps

This section must always reflect the immediate next actions.

1. Create the developer-owned Milestone 5 commit. The M5 implementation is
   complete and verified (53 passing tests). The developer must review and
   approve before creation; do not commit without explicit instruction.
2. Begin Milestone 6 (Docker + Seed Data) after the M5 commit: Dockerfile,
   Docker Compose (API + PostgreSQL + Redis services with health checks), and
   seed data (admin/provider users, sample provider slots). This milestone is
   the first place a live PostgreSQL/Redis stack exists; once it does,
   live-verify M2 migrations, M4 concurrent booking, and M5 Redis `rpush`.
3. Milestones 1–5 are implemented. Docker must be installed locally before M6
   can run (it is currently unavailable on this machine).

Agents must update this section whenever the project state changes.