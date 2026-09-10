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

Status: NOT STARTED

Planned:
- PostgreSQL connection
- SQLAlchemy setup
- database models
- Alembic
- initial migration
- verification against real PostgreSQL

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

**Current milestone:** Milestone 1

**Current state:** No assessment implementation has been created yet.

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

---

# 15. Current Next Steps

This section must always reflect the immediate next actions.

1. Review the Milestone 1 changes and create the developer-owned commit.
2. Begin Milestone 2 only after the Milestone 1 commit is complete.
3. For Milestone 2, add PostgreSQL, SQLAlchemy, models, and Alembic according to
  the assessment requirements.

Agents must update this section whenever the project state changes.