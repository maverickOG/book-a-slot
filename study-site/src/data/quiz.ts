/**
 * Chapter self-check questions. Every answer is grounded in the real repo;
 * `sourceReference` points at the frozen snapshot file(s) that justify it.
 *
 * Data model:
 *   Quiz:   { id, topic, module, chapter, chapterNumber, chapterTitle,
 *             difficulty, questions[] }
 *   Question: { q, options, answerIndex, explanation, sourceReference,
 *               misconception? }
 *
 * `misconception` is optional and shown only when the learner answers
 * incorrectly — it names the faulty mental model behind a common wrong pick.
 */
export type Difficulty = "foundation" | "applied" | "challenge";

export interface Question {
  q: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  sourceReference: string;
  /** Optional: shown only when the learner picks the wrong answer. */
  misconception?: string;
}

export interface Quiz {
  id: string;
  title: string;
  /** One-line topic used on the quiz hub. */
  topic: string;
  /** Module key from src/data/modules.ts (used by the hub to group quizzes). */
  module: string;
  /** Canonical chapter id the quiz is attached to. */
  chapter: string;
  chapterNumber: number;
  chapterTitle: string;
  difficulty: Difficulty;
  questions: Question[];
}

export const quizzes: Quiz[] = [
  {
    id: "overview",
    title: "Overview",
    topic: "The project at a glance",
    module: "big-picture",
    chapter: "01-overview",
    chapterNumber: 1,
    chapterTitle: "What this project is",
    difficulty: "foundation",
    questions: [
      {
        q: "The project has three database tables. Which one represents an open time slot?",
        options: ["A dedicated 'slots' table", "A bookings row with status 'pending' and customer_id NULL", "A bookings row with status 'confirmed'", "The reviews table"],
        answerIndex: 1,
        explanation:
          "There is deliberately no slot table. A provider opens a slot as a bookings row in status 'pending' with customer_id NULL; a customer turning it into a booking sets customer_id.",
        sourceReference: "app/models/booking.py · app/models/enums.py",
        misconception: "'Slots' feels like a natural extra table, but the design intentionally reuses bookings — an available slot IS a pending, unowned booking row.",
      },
      {
        q: "What is the single source of truth for the final schema?",
        options: ["The README", "The Alembic migrations", "The SQLAlchemy models in app/models", "docker-compose.yml"],
        answerIndex: 1,
        explanation:
          "The chain 0001 → 0002 → 0003 (applied by 'alembic upgrade head') is the authoritative schema — it is what runs against real PostgreSQL. The models must match it.",
        sourceReference: "alembic/versions/20260911_0001_create_initial_schema.py",
        misconception: "The models 'look' authoritative, but the migrations are what actually execute against the database — the models must agree with them, not the other way around.",
      },
      {
        q: "Which of these is genuinely NOT part of the shipped system?",
        options: [
          "An atomic conditional UPDATE that prevents double-booking",
          "A Redis queue for review summarisation jobs",
          "A background worker that writes AI summaries into reviews.summary",
          "Users.create a booking with status 'pending'",
        ],
        answerIndex: 2,
        explanation:
          "The summarize endpoint only pushes {\"review_id\": N} onto the Redis list and returns 202. There is no worker, no AI, and reviews.summary stays NULL.",
        sourceReference: "app/routers/reviews.py · chapter 01",
        misconception: "A 'summary' endpoint feels like it must produce words. Here it deliberately only enqueues a job; the words never get written.",
      },
      {
        q: "Which statuses does the shared BookingStatus enum actually define?",
        options: [
          "pending and confirmed only",
          "pending, confirmed, completed, cancelled",
          "booked and free",
          "open and closed",
        ],
        answerIndex: 1,
        explanation:
          "app/models/enums.py defines pending, confirmed, completed and cancelled. cancelled exists in the enum but no endpoint in the shipped code ever sets it.",
        sourceReference: "app/models/enums.py · AGENTS.md M4",
        misconception: "Because no API reaches 'cancelled', it is easy to assume the enum only has the three active states — the fourth value is there, just unused.",
      },
      {
        q: "What happens if you try to delete a user that a booking still references?",
        options: [
          "The booking is deleted too",
          "The delete is blocked by ondelete='RESTRICT'",
          "The user is silently renamed",
          "The booking becomes the user's",
        ],
        answerIndex: 1,
        explanation:
          "Foreign keys use ondelete='RESTRICT' in the models, so PostgreSQL refuses to delete a referenced user or booking while rows still point at it.",
        sourceReference: "app/models/user.py · app/models/booking.py",
      },
      {
        q: "How does the running API document itself?",
        options: [
          "It serves static HTML pages hand-written per route",
          "FastAPI emits OpenAPI and serves interactive docs at /docs",
          "You must read the README",
          "It has no documentation",
        ],
        answerIndex: 1,
        explanation:
          "FastAPI auto-generates the OpenAPI schema (also returned by /openapi.json) and serves the interactive Swagger UI at /docs, as the README's 'API documentation' section points out.",
        sourceReference: "app/main.py · README (API documentation)",
      },
    ],
  },
  {
    id: "architecture",
    title: "Architecture",
    topic: "How the moving parts fit",
    module: "big-picture",
    chapter: "02-architecture",
    chapterNumber: 2,
    chapterTitle: "Architecture: a tour of the moving parts",
    difficulty: "foundation",
    questions: [
      {
        q: "What database does the running application actually use in production/CI?",
        options: ["SQLite", "PostgreSQL 16", "MySQL", "MongoDB"],
        answerIndex: 1,
        explanation: "SQLite is only an in-memory stand-in for unit tests. PostgreSQL 16 (postgres:16-alpine) is the real target.",
        sourceReference: "docker-compose.yml (db service) · tests/conftest.py",
        misconception: "SQLite passing the unit tests makes it look like the datastore, but it is a documented test-only override — the compose stack and CI use real PostgreSQL.",
      },
      {
        q: "How does a request-scoped database session get into an endpoint?",
        options: [
          "A global session object shared by all threads",
          "A get_db() FastAPI dependency that yields a session and closes it afterwards",
          "Each endpoint calls psycopg directly",
          "SQLAlchemy auto-magically injects one",
        ],
        answerIndex: 1,
        explanation:
          "app/database.py defines get_db() as a generator dependency yielding a Session and closing it when the request ends. Endpoints declare it via Depends(get_db).",
        sourceReference: "app/database.py (get_db) · app/routers/auth.py",
        misconception: "A single shared 'global session' would leak connections across users. The dependency creates and closes a session per request.",
      },
      {
        q: "Which pieces make up the docker-compose stack?",
        options: [
          "api, db, redis",
          "api, db, redis, worker",
          "api, postgres, queue",
          "frontend, api, db",
        ],
        answerIndex: 0,
        explanation:
          "docker-compose.yml runs three services — api (the FastAPI app), db (PostgreSQL 16), and redis (Redis 7). There is deliberately no worker service because no worker exists.",
        sourceReference: "docker-compose.yml",
        misconception: "A queue in the diagram tempts you to add a 'worker' service. This project has a queue STUB only — no consumer runs.",
      },
      {
        q: "Where do DATABASE_URL and REDIS_URL get read from at startup?",
        options: [
          "A hard-coded config file",
          "The environment, with localhost defaults in app/database.py and app/redis_client.py",
          "The database itself",
          "An interactive prompt",
        ],
        answerIndex: 1,
        explanation:
          "Both modules read their URL from the environment (with localhost defaults) so the app imports without a running database; compose and CI override them per service.",
        sourceReference: "app/database.py · app/redis_client.py",
      },
      {
        q: "How is the Redis client given to endpoints, mirroring get_db?",
        options: [
          "A global import used directly",
          "get_redis_client() as a FastAPI dependency, overridable in tests",
          "Via thread-local storage",
          "Injected at import time by Redis itself",
        ],
        answerIndex: 1,
        explanation:
          "app/redis_client.py exposes get_redis_client() the same way database.py exposes get_db(), so tests override it with a FakeRedis instead of needing a live server.",
        sourceReference: "app/redis_client.py · tests/conftest.py",
      },
    ],
  },
  {
    id: "fastapi",
    title: "Python & FastAPI basics",
    topic: "Framework fundamentals",
    module: "language",
    chapter: "03-python-fastapi-basics",
    chapterNumber: 3,
    chapterTitle: "Python & FastAPI basics, from zero",
    difficulty: "foundation",
    questions: [
      {
        q: "When does FastAPI run the body (Pydantic) validation?",
        options: ["Inside the endpoint function", "Before the endpoint function runs", "After the response is built", "It doesn't validate request bodies"],
        answerIndex: 1,
        explanation:
          "FastAPI builds and validates parameters before calling the endpoint. That is why a malformed body gives 422 even if an auth check sits inside the function body.",
        sourceReference: "app/routers/bookings.py · tests/test_bookings.py (422 vs 403)",
        misconception: "An auth guard inside the endpoint doesn't run first — validation happens up front, so a bad payload 422s before your 403 can fire.",
      },
      {
        q: "How does a route declare the things it needs (session, current user)?",
        options: ["Global variables", "Depends(...) parameters", "Constructor injection", "Thread-local storage"],
        answerIndex: 1,
        explanation: "Each dependency is a parameter with Depends(...). FastAPI resolves them in order before the endpoint body runs.",
        sourceReference: "app/routers/auth.py (Depends(get_db, get_current_user))",
      },
      {
        q: "What status code does FastAPI return for a Pydantic validation failure?",
        options: ["400 Bad Request", "422 Unprocessable Entity", "500 Internal Server Error", "204 No Content"],
        answerIndex: 1,
        explanation:
          "FastAPI's default for request validation errors is 422. Tests rely on this — e.g. a rating outside 1–5 produces 422.",
        sourceReference: "tests/test_reviews.py (rating 422)",
        misconception: "400 feels like the 'generic bad input' code, but FastAPI's documented default for body/model validation is 422.",
      },
      {
        q: "How does a route declare the shape of its request body?",
        options: [
          "With a Pydantic BaseModel from app/schemas used as a parameter type",
          "With a raw JSON string parsed by hand",
          "With a Python dataclass",
          "Bodies are never validated",
        ],
        answerIndex: 0,
        explanation:
          "Each request body is a Pydantic model (e.g. BookingCreate) sitting in app/schemas. FastAPI parses, validates and coerces it against that model before the endpoint runs.",
        sourceReference: "app/schemas (auth, booking, review models) · app/routers",
      },
      {
        q: "What does a successful POST /reviews return by default?",
        options: ["200 OK", "201 Created", "202 Accepted", "204 No Content"],
        answerIndex: 1,
        explanation:
          "create_review declares status_code=201 (it creates a row) while /reviews/{id}/summarize returns 202 because it only enqueues a job — the distinction is explicit in the router.",
        sourceReference: "app/routers/reviews.py (status_code)",
      },
    ],
  },
  {
    id: "database",
    title: "Database & normalisation",
    topic: "Schema & normalisation",
    module: "data",
    chapter: "04-database-models",
    chapterNumber: 4,
    chapterTitle: "The data layer: models, constraints, normalisation",
    difficulty: "applied",
    questions: [
      {
        q: "Why is bookings.customer_id nullable?",
        options: ["It is an accident", "A pending slot has no customer yet; the customer is attached when they book", "Customers can opt out", "It is always NULL"],
        answerIndex: 1,
        explanation: "'Providers offer time slots, customers book them.' A provider-created slot has no customer, so NOT NULL would break the domain flow (migration 0002 fixes exactly this).",
        sourceReference: "app/models/booking.py · alembic/versions/20260911_0002_...",
        misconception: "A NOT NULL customer_id seems 'cleaner', but it would force a provider to invent a customer when opening a slot — breaking the core domain flow.",
      },
      {
        q: "Which constraint guarantees one review per booking?",
        options: ["CHECK (rating BETWEEN 1 AND 5)", "UNIQUE(booking_id) on reviews + a guarded INSERT", "ondelete='RESTRICT'", "A unique index on reviews.id"],
        answerIndex: 1,
        explanation: "The UniqueConstraint on booking_id is the backstop; the code also checks for an existing review and catches IntegrityError to return 409.",
        sourceReference: "app/models/review.py · app/routers/reviews.py (409)",
        misconception: "The rating CHECK only keeps ratings in 1–5 — it does nothing to stop two reviews on one booking. The unique key does that.",
      },
      {
        q: "What is the reviews.summary column for?",
        options: [
          "It stores the reviewer's email",
          "It is a nullable TEXT placeholder so a future summarisation worker can persist results without a schema change",
          "It always mirrors the comment",
          "It stores the booking id",
        ],
        answerIndex: 1,
        explanation:
          "summary was added as nullable TEXT in migration 0002 so the (still future) summarisation worker has a place to write. Today it stays NULL.",
        sourceReference: "app/models/review.py · alembic/versions/20260911_0002",
        misconception: "An empty summary column looks unfinished — it's intentional headroom added up front precisely so no later migration is needed.",
      },
      {
        q: "Why is there no separate 'slots' or availability table?",
        options: [
          "The assessment brief names only Users, Bookings and Reviews — an open slot is represented as a pending, unowned bookings row",
          "Tables are expensive",
          "SQLAlchemy can't model two tables",
          "Slots are not required by the domain",
        ],
        answerIndex: 0,
        explanation:
          "A dedicated availability table would invent schema the brief never asks for. The approved design reuses the bookings table: customer_id NULL + status pending = an open slot.",
        sourceReference: "app/models/booking.py · AGENTS.md M2 decisions",
        misconception: "'Slots' sounds like an obvious entity. The design decision was to stay exactly within the three tables the brief names.",
      },
      {
        q: "Which uniqueness constraints protect identity or 1:1 relationships?",
        options: [
          "email unique, users.token unique-when-set, reviews.booking_id unique",
          "Only email",
          "None — constraints are skipped",
          "customer_id unique per booking",
        ],
        answerIndex: 0,
        explanation:
          "users.email is unique (login identity), users.token is unique when set (fresh 32-byte tokens), and one review per booking is enforced by UNIQUE(booking_id) on reviews.",
        sourceReference: "app/models (user, review) · alembic migrations 0001/0003",
      },
      {
        q: "Which columns get explicit indexes?",
        options: [
          "None",
          "bookings.provider_id and bookings.customer_id (plus the unique constraints)",
          "Every column",
          "Only reviews.summary",
        ],
        answerIndex: 1,
        explanation:
          "The schema indexes the two booking ownership columns because the list/ownership queries filter on them; unique constraints back email, token and booking_id.",
        sourceReference: "alembic/versions/20260911_0001_create_initial_schema.py",
      },
    ],
  },
  {
    id: "alembic",
    title: "Alembic migrations",
    topic: "The migration chain",
    module: "data",
    chapter: "05-alembic-migrations",
    chapterNumber: 5,
    chapterTitle: "Alembic migrations: the schema's history book",
    difficulty: "foundation",
    questions: [
      {
        q: "Why does migration 0002 exist?",
        options: ["To add email column", "To make customer_id nullable and add reviews.summary", "To add users.token", "To drop a table"],
        answerIndex: 1,
        explanation: "The initial 0001 created customer_id NOT NULL; 0002 relaxes it (nullable) and adds the nullable summary column for the future summarisation worker.",
        sourceReference: "alembic/versions/20260911_0002_nullable_customer_add_review_summary.py",
      },
      {
        q: "What does migration 0003 add?",
        options: [
          "The bookings table",
          "users.token — the DB-stored bearer token column, unique when set",
          "The reviews summary column",
          "A slots table",
        ],
        answerIndex: 1,
        explanation:
          "0003 adds the token column used by login and get_current_user. 0001 created the tables, 0002 relaxed customer_id + added summary, 0003 adds token.",
        sourceReference: "alembic/versions/20260911_0003_add_user_token.py",
        misconception: "Token support felt like part of 'auth' not 'schema' — but because the token lives in a column, it needs a migration just like any other column.",
      },
      {
        q: "How does Alembic know which models exist when generating/offline-rendering SQL?",
        options: [
          "It parses the project README",
          "alembic/env.py imports app.models and uses app.database Base.metadata as target_metadata",
          "It guesses from table names",
          "It cannot — you must write raw SQL by hand",
        ],
        answerIndex: 1,
        explanation:
          "env.py sets target_metadata to Base.metadata after importing the models, so autogenerate (and offline --sql rendering) sees every table in the app.",
        sourceReference: "alembic/env.py",
        misconception: "This is a hidden gotcha — migrations only 'see' models that are imported in env.py. This project imports app.models explicitly.",
      },
      {
        q: "How are the three migrations chained together?",
        options: [
          "They are independent and unordered",
          "Each migration's down_revision points at its predecessor, so 'alembic upgrade head' applies 0001 → 0002 → 0003 in order",
          "A shell script runs them alphabetically",
          "Only the latest migration matters",
        ],
        answerIndex: 1,
        explanation:
          "0001 has no down_revision, 0002 points at 0001, 0003 at 0002 — the chain is what makes 'upgrade head' deterministic and is inspected in the offline --sql verification.",
        sourceReference: "alembic/versions/20260911_0001 / 0002 / 0003",
      },
      {
        q: "Why is Alembic's offline SQL rendering useful to this project?",
        options: [
          "It lets you review generated SQL against PostgreSQL without a live connection",
          "It replaces pytest",
          "It runs the API",
          "It is only useful for MySQL",
        ],
        answerIndex: 0,
        explanation:
          "Milestone verification used 'alembic upgrade head --sql' to inspect the exact DDL (enum types, indexes, constraints) offline; env.py's target_metadata makes this render the app's real schema.",
        sourceReference: "alembic/env.py (target_metadata) · AGENTS.md verification log",
      },
    ],
  },
  {
    id: "auth",
    title: "Authentication",
    topic: "Hashing, tokens, sessions",
    module: "identity",
    chapter: "06-authentication",
    chapterNumber: 6,
    chapterTitle: "Authentication: hashing, tokens, sessions",
    difficulty: "applied",
    questions: [
      {
        q: "Where is the bearer token stored?",
        options: ["In a signed JWT", "In Redis with a TTL", "In the users.token column, set at login", "In a cookie"],
        answerIndex: 2,
        explanation:
          "Login creates secrets.token_urlsafe(32), stores it in users.token, and returns it. get_current_user looks the token up in the database on every request.",
        sourceReference: "app/routers/auth.py (login) · app/security.py",
        misconception: "JWT is the de-facto convention, but this design chose a DB-stored token because it's revocable (set token to NULL) and needs no signing key.",
      },
      {
        q: "Which hashing scheme is used and why not bcrypt?",
        options: [
          "bcrypt — it's the current standard",
          "PBKDF2-SHA256 — passlib's bcrypt path is unmaintained and fails on Python 3.14",
          "MD5 — it's fast",
          "SHA-256 unsalted — it's simple",
        ],
        answerIndex: 1,
        explanation:
          "passlib 1.7.4 reads bcrypt.__about__ which bcrypt 5.0 removed. passlib's pbkdf2_sha256 is pure-python (stdlib hashlib) and verified on Python 3.14.",
        sourceReference: "app/security.py (pbkdf2_sha256) · pyproject.toml",
        misconception: "bcrypt is 'the standard' in most guides, but on Python 3.14 the unmaintained passlib+bcrypt pairing crashes — PBKDF2-SHA256 was the verified, working choice.",
      },
      {
        q: "How does get_current_user resolve the caller?",
        options: [
          "It decodes the payload of a JWT",
          "It parses 'Bearer <token>' from the Authorization header and looks the token up in users.token",
          "It trusts a cookie",
          "It reads the request IP",
        ],
        answerIndex: 1,
        explanation:
          "HTTPBearer extracts the token from Authorization: Bearer <token>; get_current_user queries users.token for it and returns the User, or raises 401.",
        sourceReference: "app/security.py (get_current_user)",
        misconception: "No JWT signing key exists here — the token IS a random lookup key into the users table, so it can be revoked by clearing the column.",
      },
      {
        q: "What happens on login with the wrong password?",
        options: [
          "200 with an empty token",
          "401 from verify_password failing, and users.token is not set",
          "The account is locked",
          "A new token is still issued",
        ],
        answerIndex: 1,
        explanation:
          "login hashes the presented password and compares it; on mismatch it raises the 401 path. A token is only created and stored after a correct password check.",
        sourceReference: "app/routers/auth.py (login) · tests/test_auth.py",
      },
      {
        q: "How would you revoke an issued token?",
        options: [
          "There is no way",
          "Set users.token back to NULL (or delete the row) — the documented revocation mechanism",
          "Wait for its 30-minute expiry",
          "Restart the database",
        ],
        answerIndex: 1,
        explanation:
          "Because the token lives in a column, revocation is simply clearing it; get_current_user then has nothing to match and returns 401. The README flags there is no automated logout/expiry endpoint.",
        sourceReference: "app/security.py (get_current_user) · README (production gaps)",
      },
      {
        q: "Exactly which fields does GET /auth/me expose?",
        options: [
          "id, email, role, password_hash and token",
          "id, email and role only",
          "Everything in the users table",
          "email and token",
        ],
        answerIndex: 1,
        explanation:
          "The response schema projects id, email and role. A regression test asserts the exact key set so password_hash and token can never leak through this endpoint.",
        sourceReference: "tests/test_auth.py (exact /auth/me keys) · app/schemas",
      },
    ],
  },
  {
    id: "rbac",
    title: "RBAC",
    topic: "Roles & ownership",
    module: "identity",
    chapter: "07-rbac",
    chapterNumber: 7,
    chapterTitle: "Role-based access control and ownership",
    difficulty: "applied",
    questions: [
      {
        q: "What happens if an anonymous user sends { role: 'admin' } to POST /auth/signup?",
        options: ["They become an admin", "422 validation error", "They are still created as a customer; the extra field is dropped", "401"],
        answerIndex: 2,
        explanation:
          "Signup ignores the role field entirely and always creates UserRole.CUSTOMER. Role upgrades can only happen via seed data or direct DB inserts.",
        sourceReference: "app/routers/auth.py (signup) · tests/test_auth.py",
        misconception: "Because the field is silently dropped (not 422), a test-verified role-escalation attempt still ends up a customer — an easy thing to misread as 'they upgraded'.",
      },
      {
        q: "Which role may complete a booking?",
        options: ["The customer", "Only the booking's provider (or an admin)", "Anyone authenticated", "Only the customer who booked it"],
        answerIndex: 1,
        explanation: "complete_booking calls require_owner_or_admin — the provider who opened the slot (or an admin). Tests prove both work and a random customer gets 403.",
        sourceReference: "app/security.py (require_owner_or_admin) · tests/test_bookings.py",
        misconception: "Completing feels like a 'customer' action, but it's the provider who runs the completed→completed transition — ownership of the slot, not of the booking.",
      },
      {
        q: "How does a customer find bookable slots without reading other customers' bookings?",
        options: [
          "GET /bookings returns everything for everyone",
          "GET /bookings?status=pending returns only pending slots with customer_id NULL",
          "A provider whispers them the id",
          "They can't — discovery is impossible",
        ],
        answerIndex: 1,
        explanation:
          "The role-filtered list for customers shows only their own bookings — except ?status=pending, which surfaces genuinely available slots (pending AND customer_id NULL).",
        sourceReference: "app/routers/bookings.py (list_bookings) · AGENTS.md M4",
        misconception: "'Customers can only read their own bookings' and 'discovery' sound contradictory — the ?status=pending filter resolves both because an available slot has no owner.",
      },
      {
        q: "Which failure mode maps to 401 versus 403?",
        options: [
          "Both mean 'logged out'",
          "401 = missing/invalid token; 403 = authenticated but the role or ownership is wrong",
          "403 = missing token; 401 = wrong role",
          "They are interchangeable",
        ],
        answerIndex: 1,
        explanation:
          "get_current_user raises 401 when there is no usable token; role and ownership dependencies raise 403 once the caller is identified. Tests assert both paths.",
        sourceReference: "app/security.py (get_current_user, require_*) · tests",
      },
      {
        q: "Which roles exist in the shared UserRole enum?",
        options: [
          "admin, moderator, member",
          "admin, provider, customer",
          "owner, employee, guest",
          "user only",
        ],
        answerIndex: 1,
        explanation:
          "app/models/enums.py defines exactly UserRole.ADMIN, .PROVIDER and .CUSTOMER. Signup can only ever produce a customer.",
        sourceReference: "app/models/enums.py · app/routers/auth.py",
      },
      {
        q: "What does require_owner_or_admin protect on the booking routes?",
        options: [
          "Only GET /bookings",
          "The provider-owned mutations (PUT, DELETE, complete) — owner of the slot or an admin",
          "Only POST /bookings",
          "Nothing — ownership is never checked",
        ],
        answerIndex: 1,
        explanation:
          "Slot mutations go through require_owner_or_admin with the loaded booking, so a second provider or any customer gets 403 unless they are the slot's owner or an admin.",
        sourceReference: "app/security.py (require_owner_or_admin) · tests/test_bookings.py",
      },
    ],
  },
  {
    id: "booking-flow",
    title: "The booking flow",
    topic: "The slot lifecycle",
    module: "domain",
    chapter: "08-booking-lifecycle",
    chapterNumber: 8,
    chapterTitle: "The booking lifecycle: slot → book → complete",
    difficulty: "applied",
    questions: [
      {
        q: "Which response code means 'slot is no longer available'?",
        options: ["404", "401", "409 Conflict", "204"],
        answerIndex: 2,
        explanation: "When the atomic conditional UPDATE affects 0 rows (someone else claimed it first), the endpoint raises 409 'Slot is no longer available'.",
        sourceReference: "app/routers/bookings.py (book_slot)",
        misconception: "404 feels right ('it's gone'), but the resource still exists — it's just no longer in the available state, which is exactly what 409 expresses.",
      },
      {
        q: "What can DELETE /bookings/{id} remove?",
        options: ["Any booking", "Only confirmed bookings", "Only pending, unbooked slots", "Cancelled bookings"],
        answerIndex: 2,
        explanation: "DELETE requires status='pending' AND customer_id IS NULL; otherwise 409. Confirmed and completed bookings cannot be deleted.",
        sourceReference: "app/routers/bookings.py (delete_booking)",
        misconception: "DELETE as 'cancel' is a common instinct, but here DELETE only removes still-open slots — it never touches a confirmed booking.",
      },
      {
        q: "Which fields can PUT /bookings/{id} change?",
        options: [
          "starts_at and ends_at only",
          "status, provider_id and customer_id",
          "Anything in the row",
          "rating",
        ],
        answerIndex: 0,
        explanation:
          "PUT is scoped to rescheduling a pending, unbooked slot — only starts_at and ends_at are accepted. status/provider/customer are never user-settable.",
        sourceReference: "app/routers/bookings.py (update_booking · put_models in bookings.py)",
        misconception: "A general 'update' endpoint might accept status, but none of the state fields are user-settable — the state machine only moves via book / complete.",
      },
      {
        q: "What exactly does POST /bookings create?",
        options: [
          "A confirmed booking for a random customer",
          "A pending slot: provider_id set, customer_id NULL, status 'pending', with starts_at/ends_at",
          "A completed row",
          "A review",
        ],
        answerIndex: 1,
        explanation:
          "slot creation is provider-only and inserts a row with status pending and customer_id NULL — the row IS the available slot until a customer books it.",
        sourceReference: "app/routers/bookings.py (create_slot · provider-only)",
      },
      {
        q: "Can a booking's status ever go backwards, e.g. confirmed → pending?",
        options: [
          "Yes, via PUT",
          "No — only forward moves exist (pending→confirmed→completed), and nothing sets cancelled",
          "Yes, via DELETE",
          "Only admins can downgrade",
        ],
        answerIndex: 1,
        explanation:
          "The state machine only moves forward through book/complete; DELETE removes still-open slots. No shipped endpoint ever transitions to pending or to cancelled.",
        sourceReference: "app/routers/bookings.py · AGENTS.md M4",
      },
      {
        q: "Who may view one specific booking via GET /bookings/{id}?",
        options: [
          "Anyone authenticated",
          "Only admins",
          "The slot's provider, the booking's customer, or an admin — via require_can_view_booking",
          "Only the customer",
        ],
        answerIndex: 2,
        explanation:
          "get_booking_or_404 loads the row, then require_can_view_booking allows the provider who owns it, the customer who booked it, or an admin; anyone else gets 403.",
        sourceReference: "app/security.py (require_can_view_booking) · tests/test_bookings.py",
      },
    ],
  },
  {
    id: "concurrency",
    title: "The concurrency-safe claim",
    topic: "The race-free booking",
    module: "domain",
    chapter: "09-concurrency-claim",
    chapterNumber: 9,
    chapterTitle: "The concurrency-safe slot claim",
    difficulty: "challenge",
    questions: [
      {
        q: "How does book_slot prevent two customers claiming the same slot?",
        options: [
          "SELECT ... FOR UPDATE then a check",
          "An atomic UPDATE ... WHERE status='pending' AND customer_id IS NULL and checking rowcount",
          "A distributed lock in Redis",
          "It doesn't — that's a known bug",
        ],
        answerIndex: 1,
        explanation:
          "The conditional UPDATE re-evaluates its WHERE under PostgreSQL's row lock, and rowcount == 0 means we lost the race → 409. No separate SELECT needed.",
        sourceReference: "app/routers/bookings.py (book_slot atomic UPDATE)",
        misconception: "SELECT ... FOR UPDATE looks like the textbook answer, but the conditional UPDATE's own WHERE is the lock — checking rowcount tells you if you won.",
      },
      {
        q: "Was true concurrent-transaction booking stress-tested?",
        options: ["Yes, with 100 parallel requests", "It is proven by design and by tests, but no simultaneous-transaction stress test was run", "Only against Redis", "Only manually via curl"],
        answerIndex: 1,
        explanation:
          "The atomic UPDATE is the standard correct pattern and CI re-proves the flow end-to-end, but no multi-transaction stress test exists — the site does not invent one.",
        sourceReference: "tests/test_bookings.py · .github/workflows/ci.yml (live-smoke)",
        misconception: "CI proves a full live flow, but it does not run simultaneous transactions at scale — 'verified behaviourally' is genuinely different from 'stress-tested'.",
      },
      {
        q: "Why does the same conditional-UPDATE trick cover completion?",
        options: [
          "It doesn't — complete uses a different mechanism",
          "completion runs UPDATE ... WHERE status='confirmed' AND customer_id IS NOT NULL and checks rowcount (409 on 0 rows)",
          "Completion is done by a cron job",
          "Only the customer can mark complete",
        ],
        answerIndex: 1,
        explanation:
          "complete_booking mirrors book_slot: a conditional UPDATE with its own WHERE guard, so a concurrent 'complete and complete again' can't double-fire.",
        sourceReference: "app/routers/bookings.py (complete_booking)",
        misconception: "Only booking needs care — but the complete transition is just as racy, and it gets the identical atomic pattern.",
      },
      {
        q: "Why does the pattern behave correctly on both PostgreSQL and the SQLite test override?",
        options: [
          "It doesn't — SQLite has different semantics",
          "PostgreSQL re-evaluates the UPDATE's WHERE under READ COMMITTED row locks, and SQLite serializes writes to a single writer",
          "The tests never touch concurrency",
          "It relies on SELECT FOR UPDATE",
        ],
        answerIndex: 1,
        explanation:
          "On PostgreSQL the row lock plus WHERE re-evaluation makes the claim atomic; on the in-memory SQLite override a single writer serializes. Both are the smallest correct implementations.",
        sourceReference: "tests/conftest.py · AGENTS.md M4 decision",
      },
      {
        q: "How were simultaneous signups kept from turning into a 500?",
        options: [
          "A distributed mutex",
          "The signup commit is wrapped in try/except IntegrityError → rollback + 400",
          "Signups are rate-limited",
          "It still 500s",
        ],
        answerIndex: 1,
        explanation:
          "The strict email check is a pre-check, but the true guard is the commit's IntegrityError handler which rolls back and returns 400, so concurrent duplicate emails are a clean 400.",
        sourceReference: "app/routers/auth.py (signup) · tests/test_auth.py",
      },
      {
        q: "Why is no Redis lock needed to book slots atomically?",
        options: [
          "It is — Redis is the lock store",
          "The conditional UPDATE's WHERE is the lock; Redis only holds the review-summary queue stub",
          "Booking always succeeds, so no lock is needed",
          "Redis is not running in this project",
        ],
        answerIndex: 1,
        explanation:
          "The database's own atomic UPDATE already serializes a slot claim, and this project's Redis usage is only the rpush queue stub — introducing a Redis lock would be redundant machinery.",
        sourceReference: "app/routers/bookings.py (book_slot) · app/redis_client.py",
      },
    ],
  },
  {
    id: "reviews",
    title: "Reviews & Redis",
    topic: "Reviews & the queue",
    module: "domain",
    chapter: "10-reviews-redis",
    chapterNumber: 10,
    chapterTitle: "Reviews and the Redis queue",
    difficulty: "challenge",
    questions: [
      {
        q: "In which booking state can a review be created?",
        options: ["pending", "confirmed", "completed", "any"],
        answerIndex: 2,
        explanation: "create_review rejects anything that is not COMPLETED with 409 — checked before the author check, so no unowned booking leaks author info.",
        sourceReference: "app/routers/reviews.py (create_review)",
      },
      {
        q: "What does POST /reviews/{id}/summarize do?",
        options: [
          "Calls an AI model and writes words into reviews.summary",
          "Starts a background worker",
          "RPUSHes {\"review_id\": N} onto the Redis list 'review_summary_jobs' and returns 202",
          "Returns the review as-is",
        ],
        answerIndex: 2,
        explanation:
          "It is deliberately a stub: it only enqueues the exact payload. This project has no worker and no LLM — reviews.summary stays NULL.",
        sourceReference: "app/routers/reviews.py (summarize_review) · app/redis_client.py",
        misconception: "HTTP 202 plus the word 'summarize' implies background processing. Here there's no processor at all — the queue write IS the endpoint's whole job.",
      },
      {
        q: "Which Redis data structure and key does the summarize stub use?",
        options: [
          "A string key 'summary'",
          "A list 'review_summary_jobs' via RPUSH",
          "A set of review ids",
          "A hash of reviews",
        ],
        answerIndex: 1,
        explanation:
          "app/routers/reviews.py calls rpush('review_summary_jobs', '{\"review_id\": N}'), and the live test asserts it with LRANGE.",
        sourceReference: "app/routers/reviews.py · tests/test_live.py (LRANGE)",
        misconception: "A 'queue' might make you picture a dedicated broker, but a plain Redis LIST with RPUSH/LRANGE is the queue here.",
      },
      {
        q: "Why does the author check run AFTER the completed-state check?",
        options: [
          "It's faster that way",
          "A pending slot has customer_id NULL, so the author check couldn't run — the state rule must come first, and it also avoids leaking author info",
          "It's just a convention",
          "To let providers review",
        ],
        answerIndex: 1,
        explanation:
          "A pending slot has no customer (customer_id NULL), so an author-style 403 would never be reachable; the 409 state guard runs first for everyone.",
        sourceReference: "app/routers/reviews.py · AGENTS.md M5",
        misconception: "Auth-before-state feels natural, but for a pending slot there IS no author — the ordering exists precisely so the state rule is always reached.",
      },
      {
        q: "What happens if a second POST /reviews targets the same booking?",
        options: [
          "A second review is appended",
          "An existing-review pre-check plus a unique-constraint IntegrityError catch returns 409",
          "The first review is overwritten",
          "500",
        ],
        answerIndex: 1,
        explanation:
          "create_review checks for an existing review before insert and also catches the UNIQUE(booking_id) IntegrityError, returning 409 either way — both layers are tested.",
        sourceReference: "app/routers/reviews.py (409 duplicate) · tests/test_reviews.py",
      },
      {
        q: "How does the live smoke test verify the Redis payload for real?",
        options: [
          "It checks the network packet count",
          "It reads LRANGE review_summary_jobs and asserts json.loads(value) == {\"review_id\": N} on a real Redis 7",
          "It trusts the stub's return value",
          "It doesn't touch Redis",
        ],
        answerIndex: 1,
        explanation:
          "tests/test_live.py runs the summarize endpoint against the real stack, then LRANGEs the list and parses each value, proving the exact queued payload end-to-end.",
        sourceReference: "tests/test_live.py (LRANGE) · .github/workflows/ci.yml",
      },
    ],
  },
  {
    id: "docker",
    title: "Docker basics",
    topic: "Containers & Compose",
    module: "running",
    chapter: "11-docker-basics",
    chapterNumber: 11,
    chapterTitle: "Docker and Docker Compose, from zero",
    difficulty: "applied",
    questions: [
      {
        q: "How does the API container make sure migrations ran before serving traffic?",
        options: ["An entrypoint script with sleep", "compose waits (depends_on: condition: service_healthy) and the api command runs 'alembic upgrade head && uvicorn ...'", "Migrations only run manually", "Alchemy auto-create"],
        answerIndex: 1,
        explanation: "Compose orders startup on db/redis healthchecks, and the api command itself runs migrations before uvicorn starts.",
        sourceReference: "docker-compose.yml (depends_on + api command) · Dockerfile",
        misconception: "A 'sleep 10' entrypoint is the common hack, but compose healthchecks give a real readiness signal and the api command chains migrations before boot.",
      },
      {
        q: "Which healthchecks does compose use for db and redis?",
        options: [
          "pg_isready for Postgres and redis-cli ping for Redis",
          "curl /health on both",
          "plain sleep",
          "No healthchecks at all",
        ],
        answerIndex: 0,
        explanation:
          "The db service healthchecks with pg_isready and redis with redis-cli ping; depends_on: condition: service_healthy blocks api boot until both pass.",
        sourceReference: "docker-compose.yml (healthcheck sections)",
        misconception: "A generic /health probe only makes sense for your own HTTP service — Postgres and Redis advertise readiness via their own CLIs.",
      },
      {
        q: "Why doesn't the compose file include a 'worker' service?",
        options: [
          "Workers are deprecated",
          "This project has no worker — the Redis queue is a stub with no consumer",
          "Workers run on the host machine",
          "Redundancy is unsafe",
        ],
        answerIndex: 1,
        explanation:
          "docker-compose lists api, db, redis only. Because nothing consumes review_summary_jobs, there is nothing to containerise as a worker.",
        sourceReference: "docker-compose.yml · AGENTS.md M6",
        misconception: "A Redis queue practically begs for a worker container — but a consumer that doesn't exist can't be run, and the brief never required one.",
      },
      {
        q: "Which volume persists PostgreSQL data across 'docker compose down'?",
        options: [
          "A bind-mount on the host",
          "The named 'pgdata' volume mounted at /var/lib/postgresql/data; Redis has no volume",
          "No volume — data is lost every restart",
          "A tmpfs volume",
        ],
        answerIndex: 1,
        explanation:
          "compose declares the named volume pgdata for the db service so the database survives down/up and rebuilds; Redis is ephemeral here by design.",
        sourceReference: "docker-compose.yml (volumes · pgdata)",
      },
      {
        q: "What is the API image built from?",
        options: [
          "node:20-slim",
          "python:3.14-slim, then a non-editable 'pip install .' before uvicorn is set as the default command",
          "postgres:16-alpine",
          "An empty scratch image",
        ],
        answerIndex: 1,
        explanation:
          "The Dockerfile starts from python:3.14-slim, copies the app, installs the package non-editable (pip install .), and defaults to 'uvicorn app.main:app --host 0.0.0.0 --port 8000'.",
        sourceReference: "Dockerfile",
      },
      {
        q: "Which environment variables does the api service get from compose?",
        options: [
          "Only DATABASE_URL",
          "DATABASE_URL and REDIS_URL pointing at the db and redis services",
          "API keys for an LLM",
          "None — it uses defaults only",
        ],
        answerIndex: 1,
        explanation:
          "The api service sets DATABASE_URL and REDIS_URL to the internal service addresses; the app already reads both from the environment, so no application code change was needed for Docker.",
        sourceReference: "docker-compose.yml (api environment) · app/database.py",
      },
    ],
  },
  {
    id: "env",
    title: "Env & PostgreSQL",
    topic: "Env & Postgres wiring",
    module: "running",
    chapter: "12-env-postgres",
    chapterNumber: 12,
    chapterTitle: "Environment variables and PostgreSQL wiring",
    difficulty: "foundation",
    questions: [
      {
        q: "Where does the database role book_a_slot come from?",
        options: [
          "A user created on your host machine",
          "The Postgres container bootstraps it from POSTGRES_USER / _PASSWORD / _DB",
          "The FastAPI app creates it at startup",
          "It is hard-coded in the migration",
        ],
        answerIndex: 1,
        explanation: "postgres:16-alpine uses those env vars to create the role and database on first boot. There is no separate host account.",
        sourceReference: "docker-compose.yml (db service POSTGRES_*)",
        misconception: "You might expect to 'createuser book_a_slot' manually — instead the official image self-bootstraps from the env vars you give it.",
      },
      {
        q: "What does app/database.py do if DATABASE_URL is not set?",
        options: [
          "It crashes immediately",
          "It falls back to a localhost PostgreSQL default so the app can import without a running DB",
          "It switches to SQLite",
          "It asks for input",
        ],
        answerIndex: 1,
        explanation:
          "The app defaults DATABASE_URL to a localhost Postgres URL so imports and unit tests work anywhere; Alembic, however, requires DATABASE_URL explicitly.",
        sourceReference: "app/database.py · alembic/env.py",
        misconception: "A fallback feels sloppy, but it's deliberate: the app stays importable without a database, while migrations refuse to run against an unspecified target.",
      },
      {
        q: "What does REDIS_URL default to in the app?",
        options: [
          "There is no default",
          "redis://localhost:6379/0",
          "redis://redis:6379/1",
          "A browser extension",
        ],
        answerIndex: 1,
        explanation:
          "app/redis_client.py reads REDIS_URL with a redis://localhost:6379/0 default, so the app and its unit tests import without a running Redis.",
        sourceReference: "app/redis_client.py · .env.example",
      },
      {
        q: "Why does Alembic require DATABASE_URL explicitly while the app does not?",
        options: [
          "It's an accident",
          "Migrations must not run against an unspecified target; the app only needs to import and serve",
          "Alembic can't read env vars",
          "The app ignores DATABASE_URL",
        ],
        answerIndex: 1,
        explanation:
          "app/database.py defaults the URL so imports/tests run anywhere, whereas env.py fails fast without DATABASE_URL so a migration can never target an unintended database.",
        sourceReference: "app/database.py · alembic/env.py",
      },
      {
        q: "Where does DATABASE_URL come from in local non-Docker development?",
        options: [
          "A .env file documented by .env.example",
          "A baked-in constant",
          "The Docker socket",
          "An HTTP call",
        ],
        answerIndex: 0,
        explanation:
          ".env.example documents the local DATABASE_URL and REDIS_URL; the Python environment (or a .env loaded by your tools) supplies them, while the Docker stack sets its own values.",
        sourceReference: ".env.example · README (configuration)",
      },
    ],
  },
  {
    id: "testing",
    title: "Testing",
    topic: "The test suite",
    module: "confidence",
    chapter: "13-testing",
    chapterNumber: 13,
    chapterTitle: "Testing: 53 reasons to trust it",
    difficulty: "foundation",
    questions: [
      {
        q: "Why does the unit test suite use SQLite instead of PostgreSQL?",
        options: [
          "SQLite is the production database",
          "It is a documented, isolated stand-in so tests can run anywhere; PostgreSQL remains the only real target",
          "SQLite is faster than SQL for everything",
          "PostgreSQL can't run tests",
        ],
        answerIndex: 1,
        explanation: "The suite overrides get_db with an in-memory SQLite database (StaticPool). The live test, gated by RUN_LIVE=1, proves the same flows against real PostgreSQL + Redis in CI.",
        sourceReference: "tests/conftest.py · tests/test_live.py (RUN_LIVE)",
        misconception: "AGENTS.md explicitly permits SQLite ONLY for an isolated, documented test setup — the chapter-text rule 'no SQLite in production' still holds.",
      },
      {
        q: "How many tests pass in the default run?",
        options: ["53 passed, 1 skipped", "54 passed", "100 passed", "50 passed, 4 skipped"],
        answerIndex: 0,
        explanation: "53 unit tests pass and the live test is skipped unless RUN_LIVE=1 (test_live.py gated by pytest.mark.skipif).",
        sourceReference: "pyproject.toml · tests/test_live.py (skipif)",
      },
      {
        q: "How are tests isolated from a real Redis?",
        options: [
          "They install a fake Redis server",
          "tests/conftest.py overrides get_redis_client with a hand-rolled FakeRedis that records rpush calls",
          "Redis code is skipped wholesale",
          "They point at a scratch database",
        ],
        answerIndex: 1,
        explanation:
          "The same DI pattern as get_db: app.dependency_overrides swaps in FakeRedis, so tests assert the exact rpush key and payload without a live server.",
        sourceReference: "tests/conftest.py (FakeRedis) · tests/test_reviews.py",
        misconception: "A full in-memory Redis clone (fakeredis) sounds necessary, but only rpush is exercised — a small recording fake is the precise, dependency-free choice.",
      },
      {
        q: "Which tools does the 'dev' extra install?",
        options: [
          "pytest, ruff and HTTPX",
          "Docker and Redis",
          "A JWT library",
          "Nothing extra",
        ],
        answerIndex: 0,
        explanation:
          "pyproject.toml declares the dev optional dependency group with pytest, Ruff and HTTPX (TestClient's transport), installed via 'pip install -e \".[dev]\"'.",
        sourceReference: "pyproject.toml (optional-dependencies) · .github/workflows/ci.yml",
      },
      {
        q: "How does a test prove a 403 fires before body validation, given FastAPI validates first?",
        options: [
          "It sends an empty body and expects 403 anyway",
          "It sends a VALID body so the endpoint's auth check is reached (malformed bodies give 422 before the 403)",
          "It mocks validation",
          "It calls the function directly",
        ],
        answerIndex: 1,
        explanation:
          "Because FastAPI validates request bodies before the endpoint body runs, tests that assert ownership 403s send a valid payload — the 422-on-garbage lesson from the M4 tests.",
        sourceReference: "tests/test_bookings.py · AGENTS.md M4 lesson",
      },
      {
        q: "Why does test_live.py generate a unique email per run?",
        options: [
          "To hide real credentials",
          "So repeat executions can coexist in one database (email is unique)",
          "To speed the suite up",
          "It doesn't — it reuses the same email",
        ],
        answerIndex: 1,
        explanation:
          "Every live run signs up a fresh email (e.g. a timestamp/uuid suffix), so the same job can run many times against one PostgreSQL container without duplicate-email failures.",
        sourceReference: "tests/test_live.py",
      },
    ],
  },
  {
    id: "ci",
    title: "CI / GitHub Actions",
    topic: "The CI pipeline",
    module: "confidence",
    chapter: "14-ci",
    chapterNumber: 14,
    chapterTitle: "CI: GitHub Actions pipeline",
    difficulty: "foundation",
    questions: [
      {
        q: "How many jobs does the CI workflow have?",
        options: ["1 — just tests", "2 — lint and deploy", "3 — lint-and-test, docker-build, live-smoke", "5 — one per milestone"],
        answerIndex: 2,
        explanation: ".github/workflows/ci.yml runs lint-and-test, docker-build, and live-smoke (real Postgres + Redis services). All three passed in run 34573662242.",
        sourceReference: ".github/workflows/ci.yml",
      },
      {
        q: "What does the live-smoke job actually exercise?",
        options: [
          "Only ruff",
          "The full booking flow against real PostgreSQL 16 + Redis 7, with alembic upgrade head first",
          "A docker build",
          "Nothing — it's skipped",
        ],
        answerIndex: 1,
        explanation:
          "live-smoke provisions Postgres + Redis job services, runs alembic upgrade head, then executes tests/test_live.py end-to-end (slot → book → 409 → complete → review → 409 → summarize → LRANGE).",
        sourceReference: ".github/workflows/ci.yml · tests/test_live.py",
        misconception: "Unit tests on SQLite might feel 'good enough' — but the live job is the only place the app talks to the real databases it ships with.",
      },
      {
        q: "Which job runs Ruff and the unit tests, and on what runtime?",
        options: [
          "docker-build on macOS",
          "lint-and-test on Python 3.14 with 'ruff check app tests alembic' and 'pytest tests -q'",
          "live-smoke on Python 3.10",
          "A shared self-hosted runner",
        ],
        answerIndex: 1,
        explanation:
          "The workflow's lint-and-test job sets up Python 3.14, installs '.[dev]', runs ruff over app/tests/alembic, then the unit suite (53 passed, 1 skipped).",
        sourceReference: ".github/workflows/ci.yml (lint-and-test)",
      },
      {
        q: "When does the workflow run?",
        options: [
          "Every minute on a cron",
          "Only on tags",
          "On pushes to main and on pull requests",
          "Only manually",
        ],
        answerIndex: 2,
        explanation:
          "ci.yml triggers on push to main and on pull requests — the documented events in the workflow file.",
        sourceReference: ".github/workflows/ci.yml (on)",
      },
      {
        q: "Why do the docs say CI is the only proof the Docker stack works?",
        options: [
          "Docker is not installed locally, so the docker-build and live-smoke jobs are the verified evidence",
          "CI is the only machine with Docker",
          "Local proof is forbidden",
          "The docs never mention CI",
        ],
        answerIndex: 0,
        explanation:
          "The development machine has no Docker, so the image build and the real PostgreSQL/Redis smoke were proven entirely by the CI jobs — the AGENTS.md verification log records run 34573662242.",
        sourceReference: "AGENTS.md (Milestone 6/7 verification) · docker-compose.yml",
      },
    ],
  },
  {
    id: "api",
    title: "API reference",
    topic: "Routes & public surface",
    module: "reference",
    chapter: "15-api-reference",
    chapterNumber: 15,
    chapterTitle: "API reference and the docs FastAPI gives you",
    difficulty: "foundation",
    questions: [
      {
        q: "Which endpoints can be called without any token?",
        options: ["POST /auth/signup and POST /auth/login only", "Everything", "POST /auth/me", "All /bookings routes"],
        answerIndex: 0,
        explanation: "Only signup and login are public; every other route goes through get_current_user or a stricter role dependency.",
        sourceReference: "app/routers/auth.py · app/security.py",
      },
      {
        q: "What does GET /bookings return for a provider by default?",
        options: [
          "Every booking in the system",
          "Only the provider's own slots",
          "Only completed bookings",
          "Only available slots",
        ],
        answerIndex: 1,
        explanation:
          "List is role-filtered: admin sees all, a provider sees their own slots, a customer sees their own bookings (unless ?status=pending).",
        sourceReference: "app/routers/bookings.py (list_bookings)",
      },
      {
        q: "Which public endpoints exist for auth?",
        options: [
          "POST /auth/signup, POST /auth/login, GET /auth/me",
          "Only POST /auth/login",
          "GET /auth/refresh and POST /auth/logout",
          "PUT /auth/password",
        ],
        answerIndex: 0,
        explanation:
          "The auth router exposes exactly three routes: signup, login and me. There is deliberately no logout or refresh endpoint — the README lists those as gaps.",
        sourceReference: "app/routers/auth.py · README (endpoint table)",
      },
      {
        q: "How many booking routes are registered in total?",
        options: ["4 — full CRUD", "5 — CRUD plus book", "7 — CRUD plus book and complete", "9 — including reviews"],
        answerIndex: 2,
        explanation:
          "bookings.py exposes GET/POST /bookings, GET/PUT/DELETE /bookings/{id}, plus POST /bookings/{id}/book and POST /bookings/{id}/complete — seven routes.",
        sourceReference: "app/routers/bookings.py · AGENTS.md M4",
      },
      {
        q: "Which routes does the reviews router add?",
        options: [
          "POST /reviews and POST /reviews/{id}/summarize only",
          "GET /reviews and DELETE /reviews/{id}",
          "PUT /reviews/{id}",
          "A /summaries collection",
        ],
        answerIndex: 0,
        explanation:
          "reviews.py intentionally exposes just two routes: creation and the summarisation trigger. The OpenAPI/route listing tests confirm exactly these exist.",
        sourceReference: "app/routers/reviews.py · tests (OpenAPI route listing)",
      },
    ],
  },
  {
    id: "lifecycles",
    title: "Request lifecycles",
    topic: "Request walkthroughs",
    module: "reference",
    chapter: "16-request-lifecycles",
    chapterNumber: 16,
    chapterTitle: "Request lifecycle walkthroughs",
    difficulty: "applied",
    questions: [
      {
        q: "Why is summarize allowed for the author but create_review also requires the same customer?",
        options: ["They use different logic", "Both call require_booking_customer — reviews are only ever touched by the customer who booked", "Only the provider can review", "Admins review for everyone"],
        answerIndex: 1,
        explanation:
          "require_booking_customer enforces booking.customer_id == current_user.id in both routes, mirroring the rule M4 deliberately left as dead code until reviews made it necessary.",
        sourceReference: "app/security.py (require_booking_customer) · app/routers/reviews.py",
      },
      {
        q: "In what order does POST /reviews reject a bad request?",
        options: [
          "author → state → duplicate → not-found",
          "booking not found (404) → not completed (409) → not the customer (403) → duplicate (409)",
          "duplicate → author → found",
          "Anything goes",
        ],
        answerIndex: 1,
        explanation:
          "create_review checks existence first, then completion, then authorship, then duplicates — the ordering is tested so no unowned booking leaks author info via a 403.",
        sourceReference: "app/routers/reviews.py · tests/test_reviews.py",
        misconception: "Author check first feels normal, but a pending slot has no customer — the state guard must run before any authz logic can.",
      },
      {
        q: "Walk through get_db: what tears down the session per request?",
        options: [
          "Nothing",
          "The generator yields, the endpoint works, and on dependency exit the session is closed after commit/rollback",
          "A background thread",
          "A random timer",
        ],
        answerIndex: 1,
        explanation:
          "get_db() is a generator dependency: it yields a session and closes it in the finally block when the request completes — this is the documented per-request session lifecycle.",
        sourceReference: "app/database.py (get_db)",
      },
      {
        q: "Who qualifies as 'the author' for the summarize endpoint?",
        options: [
          "Any admin",
          "The customer who booked the slot (booking.customer_id), via require_booking_customer — same owner rule as creation",
          "The review's writer and anyone else",
          "Providers only",
        ],
        answerIndex: 1,
        explanation:
          "require_booking_customer enforces booking.customer_id == current_user.id in both review routes, so summarizing is author-only exactly as creating is.",
        sourceReference: "app/security.py (require_booking_customer) · app/routers/reviews.py",
      },
      {
        q: "Which state combination makes a booking 'completed' in a way that unlocks reviews?",
        options: [
          "Any status with a rating",
          "status == 'completed' (a row a completed transition produced)",
          "status == 'pending'",
          "customer_id IS NULL",
        ],
        answerIndex: 1,
        explanation:
          "Completion sets status to completed; create_review first checks that status, so only genuinely completed bookings can be reviewed.",
        sourceReference: "app/routers/bookings.py (complete_booking) · tests/test_reviews.py",
      },
    ],
  },
  {
    id: "production",
    title: "Production readiness",
    topic: "Production gaps",
    module: "reference",
    chapter: "17-production-readiness",
    chapterNumber: 17,
    chapterTitle: "Production-safety gaps (honest assessment)",
    difficulty: "challenge",
    questions: [
      {
        q: "Which of the following is a REAL gap, not something the app already does in production form?",
        options: [
          "Reverse proxy/TLS",
          "Storing passwords hashed",
          "Enforcing role-based 403s",
          "Running migrations from a migration chain",
        ],
        answerIndex: 0,
        explanation: "Hashing, RBAC, and Alembic are implemented. TLS/reverse proxy, token expiry, a Redis worker, pagination and credential rotation are documented gaps.",
        sourceReference: "chapter 17 · README (production-readiness gaps)",
        misconception: "Every option except TLS is actually shipped here — the busy look of the working features can make a missing production layer easy to overlook.",
      },
      {
        q: "Which authentication gap is explicitly documented?",
        options: [
          "Passwords are stored in plaintext",
          "Tokens never expire and there is no logout — revocation is manual (set users.token to NULL)",
          "Anyone can login as admin",
          "Tokens are sent in URLs",
        ],
        answerIndex: 1,
        explanation:
          "The DB-stored token is revocable but has no expiry or logout endpoint; the README and chapter 17 call this out as a known production gap.",
        sourceReference: "chapter 17 · README",
      },
      {
        q: "Why does RBAC here scale awkwardly to nested organisations?",
        options: [
          "It can't — roles are a flat enum with no org or tenant concept, so nesting would need a schema change",
          "Roles are per-tenant already",
          "There is only one role",
          "RBAC is not used",
        ],
        answerIndex: 0,
        explanation:
          "UserRole is a flat admin/provider/customer enum on a single users table — no organisation attribute. Adding nested orgs is a documented extension point, not a shipped feature.",
        sourceReference: "app/models/enums.py · AGENTS.md M8 (technical note)",
      },
      {
        q: "Which of these is a documented, deliberate non-feature rather than a bug?",
        options: [
          "The review summarisation writes nothing — it is a queue-only stub",
          "Tokens expire too fast",
          "Duplicates are allowed",
          "The database is SQLite in production",
        ],
        answerIndex: 0,
        explanation:
          "The summarize endpoint only enqueues a job; there is no AI or worker by design and the brief never required one. The other three claims are false — tokens don't expire, duplicates are rejected, and the real database is PostgreSQL.",
        sourceReference: "app/routers/reviews.py (stub) · tests/test_reviews.py (409)",
      },
      {
        q: "What are the documented gaps closest to a real deployment?",
        options: [
          "TLS/reverse proxy, token expiry and logout, a real summarisation worker, pagination, credential rotation",
          "Everything is production-ready",
          "Only speed",
          "Design cosmetics",
        ],
        answerIndex: 0,
        explanation:
          "The README production-readiness section and chapter 17 enumerate these gaps honestly — the site reports what is missing rather than pretending the project is a finished SaaS.",
        sourceReference: "README (production-readiness considerations) · chapter 17",
      },
    ],
  },
  {
    id: "teachme",
    title: "Teach me this code",
    topic: "Guided reading",
    module: "beyond",
    chapter: "18-teach-me-this-code",
    chapterNumber: 18,
    chapterTitle: "Teach me this code: a guided reading",
    difficulty: "challenge",
    questions: [
      {
        q: "What is the smallest honest summary of summaries?",
        options: [
          "AI-generated review summaries stored at POST time",
          "A queue-only stub: rpush the payload and return 202, no worker or AI",
          "A cron job that deletes negative reviews",
          "Summaries are written by providers",
        ],
        answerIndex: 1,
        explanation: "The summarize endpoint only enqueues {\"review_id\": N} onto review_summary_jobs and returns 202. That's it — by design.",
        sourceReference: "app/routers/reviews.py (summarize_review) · app/redis_client.py",
        misconception: "The word 'summarise' drags in AI associations. The honest reading of this code is: write one JSON string to a list, respond 202, stop.",
      },
      {
        q: "What does the guided-reading walkthrough say is the key to a maintainable review route?",
        options: [
          "Just call the database directly",
          "The order of checks: 404 → state(409) → author(403) → duplicate(409), each rule in one small, tested block",
          "Skip duplication checks",
          "Let anyone review",
        ],
        answerIndex: 1,
        explanation:
          "The chapter reads create_review as a sequence of guard blocks whose order is deliberate and each of which is covered by a test.",
        sourceReference: "app/routers/reviews.py · tests/test_reviews.py",
      },
      {
        q: "How does a customer see 'only my own bookings' AND discover available slots at the same time?",
        options: [
          "Two endpoints",
          "One GET /bookings whose default hides others, plus ?status=pending which reveals only unowned pending slots",
          "A separate admin endpoint",
          "They can't do both",
        ],
        answerIndex: 1,
        explanation:
          "The single list endpoint switches behaviour on the query param: default customer view is ownership-scoped; ?status=pending shows only slots nobody owns yet.",
        sourceReference: "app/routers/bookings.py · AGENTS.md M4",
      },
      {
        q: "Why is there no seed script creating an admin or providers?",
        options: [
          "The assessment brief never requires seed data, so none was written",
          "Adds too many users",
          "Passwords can't be seeded",
          "PostgreSQL forbids it",
        ],
        answerIndex: 0,
        explanation:
          "Seed/demo data was deliberately skipped in Milestone 6 — the brief is silent on it. Admin/provider users are created directly in PostgreSQL or the DB.",
        sourceReference: "AGENTS.md M6 (seed data skipped) · README",
      },
      {
        q: "Which four ownership helpers live in app/security.py for bookings and reviews?",
        options: [
          "get_booking_or_404, require_owner_or_admin, require_can_view_booking, require_booking_customer",
          "is_admin, is_provider, is_customer, is_reviewer",
          "check_can_edit, check_can_read, check_can_book, check_can_see",
          "They are inlined in the routers, not in security.py",
        ],
        answerIndex: 0,
        explanation:
          "security.py groups all authorization: the booking loader, slot-owner-or-admin, view-rights check, and the review-customer rule — each chosen only when a milestone actually needed it.",
        sourceReference: "app/security.py · AGENTS.md M4/M5",
      },
    ],
  },
  {
    id: "interactive",
    title: "Interactive learning",
    topic: "Interactive learning",
    module: "beyond",
    chapter: "19-interactive-learning",
    chapterNumber: 19,
    chapterTitle: "Interactive learning: think, don't just watch",
    difficulty: "foundation",
    questions: [
      {
        q: "The playground simulator here on the site…",
        options: [
          "Calls the live API over the network",
          "Is a static, data-driven representation that shows the real endpoints and status codes without network calls",
          "Contains fake endpoints that don't exist",
          "Requires Docker to run",
        ],
        answerIndex: 1,
        explanation: "The study site is static. The simulator encodes the actual API contract (endpoints, status codes from tests) so you can play without a backend.",
        sourceReference: "src/components/interactive/RequestSimulator.tsx",
        misconception: "A 'simulator' that answers correctly might seem to call the API — it's a static replay of the contract, verified against the real tests.",
      },
      {
        q: "Which learning progress does this site persist, and where?",
        options: [
          "opened, readToEnd, quizPassed, mastered — in localStorage under a versioned key",
          "Passwords and tokens",
          "Everything on a server",
          "Nothing at all",
        ],
        answerIndex: 0,
        explanation:
          "src/lib/learning.ts stores per-chapter flags in localStorage ('inside-book-a-slot.learning.v1') and never touches the network.",
        sourceReference: "src/lib/learning.ts",
      },
      {
        q: "Where do this site's QUIZ attempts persist?",
        options: [
          "In localStorage under the versioned key 'inside-book-a-slot.quiz.v1' via src/lib/quizProgress.ts",
          "On a quiz server",
          "In the URL",
          "They don't persist",
        ],
        answerIndex: 0,
        explanation:
          "QuizCard persists a per-quiz record (selected/checked/submitted score) in a localeStorage key versioned like the learning store, and dispatches 'quiz:changed' so the hub updates.",
        sourceReference: "src/lib/quizProgress.ts · src/components/interactive/QuizCard.tsx",
      },
      {
        q: "On /playground, what powers the Code Puzzle?",
        options: [
          "A remote judge",
          "WhichIsReal — the learner picks the verbatim-correct snippet against decoy-wrong variants",
          "The real API",
          "A syntax highlighter only",
        ],
        answerIndex: 1,
        explanation:
          "WhichIsReal shows a verbatim snippet from the code snapshots as the correct option among plausible wrong variants, so the 'real' choice is judged for its stock — and rebuttals are ground-truth-independent.",
        sourceReference: "src/components/interactive/WhichIsReal.tsx",
      },
      {
        q: "Why does the site's dev server need an optimizer hint while preview does not?",
        options: [
          "react-dom/client is CommonJS and was missing from Vite's dev pre-bundle set, so 'astro dev' threw on createRoot; the production build uses Rollup interop and was unaffected",
          "Dev is always broken",
          "Preview uses a CDN",
          "It's a Tailwind bug",
        ],
        answerIndex: 0,
        explanation:
          "Incident I12: the dev defect was real but invisible to preview-based tests. astro.config.mjs's optimizeDeps.include pre-bundles react-dom/client for dev; the production build already interops correctly.",
        sourceReference: "astro.config.mjs · study-site/AGENTS.md I12",
      },
    ],
  },
];

/** Total number of questions across the whole bank (for the hub header). */
export const totalQuestions = quizzes.reduce((n, q) => n + q.questions.length, 0);