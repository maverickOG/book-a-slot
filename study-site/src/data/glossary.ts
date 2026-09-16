/**
 * Terms we define for a programmer unfamiliar with Python backends.
 */
export interface GlossaryEntry {
  term: string;
  definition: string;
  category:
    | "Python"
    | "FastAPI"
    | "Database"
    | "Auth"
    | "Infra"
    | "Testing"
    | "Domain"
    | "Project";
}

export const glossary: GlossaryEntry[] = [
  {
    term: "FastAPI",
    definition:
      "A modern Python web framework. You declare routes with Python functions and type hints, and it generates API docs and request validation for you.",
    category: "FastAPI",
  },
  {
    term: "Uvicorn",
    definition:
      "The ASGI server that actually listens on a port and runs the FastAPI app (uvicorn app.main:app ...).",
    category: "FastAPI",
  },
  {
    term: "Route / endpoint",
    definition:
      "A function attached to a method + path (e.g. POST /bookings). When a request matches, FastAPI calls the function.",
    category: "FastAPI",
  },
  {
    term: "APIRouter",
    definition:
      "A way to group routes. Each module (auth, bookings, reviews) declares a router with a prefix, and app/main.py includes them.",
    category: "FastAPI",
  },
  {
    term: "Dependency injection / Depends",
    definition:
      "A function can declare the things it needs (a DB session, the current user) via Depends(...). FastAPI builds them and calls them before the endpoint runs.",
    category: "FastAPI",
  },
  {
    term: "ASGI",
    definition:
      "The async Python interface standard that Uvicorn and FastAPI speak (the heritage of the older WSGI standard).",
    category: "FastAPI",
  },
  {
    term: "Pydantic",
    definition:
      "The validation library under FastAPI. Request/response models are (sub)classes of BaseModel; type + constraint errors become automatic 422 responses.",
    category: "FastAPI",
  },
  {
    term: "model_validator",
    definition:
      "A Pydantic hook that runs after a model is built — used here to reject ends_at <= starts_at.",
    category: "FastAPI",
  },
  {
    term: "SQLAlchemy",
    definition:
      "The Python ORM used here. Models (= classes) map to tables; sessions wrap transactions.",
    category: "Database",
  },
  {
    term: "ORM (object-relational mapper)",
    definition:
      "Lets you write database rows as Python objects (User(email=...)) instead of raw SQL strings.",
    category: "Database",
  },
  {
    term: "DeclarativeBase / Base",
    definition:
      "app.database.Base is the shared base class every model inherits so SQLAlchemy can discover all tables.",
    category: "Database",
  },
  {
    term: "Session / sessionmaker",
    definition:
      "A session is your unit of work: add() a row, commit() it, refresh() it. get_db() yields one session per request and always closes it.",
    category: "Database",
  },
  {
    term: "mapped_column",
    definition:
      "SQLAlchemy 2.x way of declaring a column directly (`Mapped[int] = mapped_column(...)`).",
    category: "Database",
  },
  {
    term: "Enum / StrEnum",
    definition:
      "A fixed set of values. UserRole and BookingStatus are StrEnum-backed and stored as PostgreSQL enum types.",
    category: "Database",
  },
  {
    term: "PostgreSQL enum type",
    definition:
      "A database-level type restricted to given strings (user_role, booking_status) — stronger than a plain varchar.",
    category: "Database",
  },
  {
    term: "Constraint",
    definition:
      "A rule enforced by Postgres itself: CHECK (rating BETWEEN 1 AND 5), UNIQUE(email), FK RESTRICT, etc.",
    category: "Database",
  },
  {
    term: "CheckConstraint",
    definition:
      "A boolean expression every row must satisfy — e.g. ends_at > starts_at at the database layer.",
    category: "Database",
  },
  {
    term: "Foreign key",
    definition:
      "A column pointing at another table's primary key (bookings.provider_id → users.id), keeping references valid.",
    category: "Database",
  },
  {
    term: "ondelete='RESTRICT'",
    definition:
      "Postgres refuses to DELETE a user while bookings still reference them — no orphaned rows.",
    category: "Database",
  },
  {
    term: "Index",
    definition:
      "Extra structure that makes lookups fast (ix_bookings_provider_id, etc.).",
    category: "Database",
  },
  {
    term: "Normalisation",
    definition:
      "Designing tables so each fact is stored once. No separate 'slots' table exists because a slot and a booking share one bookings row in different states.",
    category: "Database",
  },
  {
    term: "Normal form",
    definition:
      "Checklist-style rules for normalisation (1NF, 2NF, 3NF). New columns that depend on the full key and nothing else keep the schema near 3NF.",
    category: "Database",
  },
  {
    term: "Migration / Alembic",
    definition:
      "Version-controlled schema changes. Each migration is a Python file that upgrades/downgrades the real database.",
    category: "Database",
  },
  {
    term: "Revision",
    definition:
      "A single Alembic migration with a unique id and a down_revision forming a chain (0001 → 0002 → 0003).",
    category: "Database",
  },
  {
    term: "Bearer token",
    definition:
      "A secret string sent as 'Authorization: Bearer <token>'. Here it's stored in users.token and looked up per request.",
    category: "Auth",
  },
  {
    term: "Password hashing",
    definition:
      "Storing a one-way mathematical digest instead of the plaintext. passlib uses PBKDF2-SHA256 with a salt.",
    category: "Auth",
  },
  {
    term: "PBKDF2-SHA256",
    definition:
      "A deliberately slow, salted key-derivation function chosen here because passlib's bcrypt backend is unmaintained on Python 3.14.",
    category: "Auth",
  },
  {
    term: "RBAC (role-based access control)",
    definition:
      "Permissions attached to a role, not a person. A dependency like require_provider rejects the request with 403 when the role differs.",
    category: "Auth",
  },
  {
    term: "401 vs 403",
    definition:
      "401 = you aren't authenticated (missing/bad token). 403 = you are authenticated but not allowed to do this (wrong role/owner).",
    category: "Auth",
  },
  {
    term: "409 Conflict",
    definition:
      "The request was fine but clashes with current state: slot already taken, booking not completed, duplicate review, etc.",
    category: "Domain",
  },
  {
    term: "Conditional UPDATE",
    definition:
      "An UPDATE ... WHERE status='pending' AND customer_id IS NULL. If the row changed under the race, rowcount is 0 and we respond 409.",
    category: "Domain",
  },
  {
    term: "rowcount",
    definition:
      "How many rows a statement changed; used to detect that the atomic claim actually won.",
    category: "Domain",
  },
  {
    term: "Redis",
    definition:
      "An in-memory key-value store running here as a simple work queue: rpush a JSON payload onto a list.",
    category: "Infra",
  },
  {
    term: "RPUSH / LRANGE",
    definition:
      "Redis list commands: rpush appends to the end; lrange reads a range. The queue is written with rpush and inspected with lrange in tests.",
    category: "Infra",
  },
  {
    term: "Worker",
    definition:
      "A separate process that would pop jobs off the queue and do the work. This project intentionally has none — summarization only enqueues.",
    category: "Infra",
  },
  {
    term: "Docker / container",
    definition:
      "An isolated, reproducible environment. Here each service (API, Postgres, Redis) runs in its own container managed by Compose.",
    category: "Infra",
  },
  {
    term: "Image",
    definition:
      "A packaged, immutable recipe for a container (here: python:3.14-slim + app code). Running an image creates a container.",
    category: "Infra",
  },
  {
    term: "Container",
    definition:
      "A running instance of an image — an isolated process. One per service (API, Postgres, Redis) here.",
    category: "Infra",
  },
  {
    term: "Docker Compose",
    definition:
      "A YAML file that defines services, pulls images, waits on healthchecks, and runs one command: docker compose up.",
    category: "Infra",
  },
  {
    term: "Healthcheck",
    definition:
      "A command Compose polls (pg_isready, redis-cli ping, HTTP GET /) before considering a service healthy.",
    category: "Infra",
  },
  {
    term: "Volume",
    definition:
      "Persistent disk attached to a container. pgdata keeps Postgres data when the container restarts.",
    category: "Infra",
  },
  {
    term: "TestClient",
    definition:
      "FastAPI/Starlette's in-process HTTP client for unit tests — you call routes without starting a server.",
    category: "Testing",
  },
  {
    term: "Dependency override",
    definition:
      "Tests swap real dependencies (get_db, get_redis_client) for fakes via app.dependency_overrides, keeping the rest of the code real.",
    category: "Testing",
  },
  {
    term: "Fixture",
    definition:
      "pytest function that sets up and tears down state (e.g. an in-memory database) shared across tests.",
    category: "Testing",
  },
  {
    term: "SQLite in-memory / StaticPool",
    definition:
      "The unit-test database: a throwaway SQLite shared by all connections — PostgreSQL is still the only real deployment target.",
    category: "Testing",
  },
  {
    term: "skipif / RUN_LIVE",
    definition:
      "pytest.ini.mark.skipif hides the live test unless RUN_LIVE=1 — so the same file is both skipped locally and run in CI against real Postgres + Redis.",
    category: "Testing",
  },
  {
    term: "GitHub Actions",
    definition:
      "CI runs on every push: lint + unit tests, Docker image build, and a live smoke test against real PostgreSQL/Redis service containers.",
    category: "Infra",
  },
  {
    term: "pool_pre_ping",
    definition:
      "SQLAlchemy checks a connection is still alive before using it — avoids surprises after a PostgreSQL restart.",
    category: "Database",
  },
  {
    term: ".env / environment variable",
    definition:
      "Configuration injected at runtime (DATABASE_URL, REDIS_URL) rather than hard-coded in source.",
    category: "Infra",
  },
];