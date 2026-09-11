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

Status: NOT STARTED

Planned:
- signup
- login
- password hashing
- bearer authentication
- customer/provider/admin authorization
- appropriate access restrictions
- tests for role isolation

Do not implement a complex middleware/policy system unless the actual requirements
justify it.

---

## Milestone 4 — Booking CRUD

Status: NOT STARTED

Planned:
- booking creation
- booking retrieval
- booking updates
- booking deletion
- role-based filtering
- object-level ownership checks

---

## Milestone 5 — Reviews + Redis

Status: NOT STARTED

Planned:
- review functionality
- review summarization endpoint
- Redis queue
- required queue payload
- tests for Redis interaction

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

**Current milestone:** Milestone 2

**Current state:** Milestones 1 and 2 are implemented. The PostgreSQL schema and
SQLAlchemy/Alembic infrastructure are present, but direct PostgreSQL migration
verification is pending because no local PostgreSQL server is running.

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
- Commit: Not created; the developer will review and commit the work.

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
- Commit: Not created; the developer will review and commit the work.

---

# 15. Current Next Steps

This section must always reflect the immediate next actions.

1. Review the Milestone 2 changes and run them against a real PostgreSQL instance.
2. Verify migration upgrade, schema, relationships, downgrade, and upgrade again.
3. Create the developer-owned Milestone 2 commit.
4. Begin Milestone 3 only after Milestone 2 review and commit are complete.

Agents must update this section whenever the project state changes.