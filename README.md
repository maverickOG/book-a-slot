# Book a Slot

[![CI](https://github.com/maverickOG/book-a-slot/actions/workflows/ci.yml/badge.svg)](https://github.com/maverickOG/book-a-slot/actions/workflows/ci.yml)

A REST API for a service-booking and review platform. Providers offer time
slots, customers discover and book them, and every completed booking can be
reviewed. A Redis-backed queue receives a summarisation job for each review.

The service is built with **FastAPI**, persists to **PostgreSQL**, and runs as
a Docker Compose stack (API + PostgreSQL + Redis) with continuous integration
via GitHub Actions.

> **A note about `study-site/`**
> The [`study-site/`](./study-site) folder is **not associated with this
> project**. It is a separate, personal study companion ("Inside Book a Slot")
> that teaches this repository's code chapter by chapter, with quizzes and
> interactive playgrounds. It is not the assessment submission, is not run or
> tested by this project's Docker stack or CI, and has no effect on the API.
> See [study-site/README.md](./study-site/README.md) for what it is built for.

## Features

- **Authentication** — email/password signup and login with PBKDF2-SHA256
  password hashing (passlib).
- **Bearer-token auth** — opaque tokens issued at login and stored in the
  database. Revocable server-side by clearing a user's token. Not JWT.
- **Role-based access control** — `admin`, `provider`, and `customer` roles,
  each with different capabilities.
- **Provider slots** — providers create availability slots and manage them
  (update/delete) while still open.
- **Customer booking** — customers discover available slots and book them with
  an atomic conditional claim designed to prevent double booking.
- **Booking CRUD & states** — a slot is a booking that moves through
  `pending → confirmed → completed`.
- **Ownership isolation** — a provider cannot see another provider's slots,
  and a customer can only read their own bookings, plus open slots listed
  through the `?status=pending` availability filter.
- **Reviews** — a customer can review a completed booking once (rating 1–5).
- **Review summarisation queue** — `POST /reviews/{id}/summarize` pushes a job
  payload to a Redis list. There is **no LLM call and no background worker** in
  this repository — the endpoint only enqueues the job.
- **PostgreSQL persistence** — SQLAlchemy models and Alembic migrations.
- **Docker Compose** — one command brings up the API, PostgreSQL, and Redis
  with health checks and automated migrations.
- **Automated CI** — GitHub Actions runs lint, the unit test suite, a Docker
  image build, and a live integration test against real PostgreSQL + Redis.

## Tech Stack

| Layer              | Technology                          | Version / range                    |
| ------------------ | ----------------------------------- | ---------------------------------- |
| Language           | Python                              | `>= 3.14`                          |
| Framework          | FastAPI                             | `0.141.1` (pinned)                 |
| ASGI server        | Uvicorn (`standard`)                | `>= 0.35, < 1.0`                   |
| ORM                | SQLAlchemy                          | `>= 2.0, < 3.0`                    |
| Migrations         | Alembic                             | `>= 1.15, < 2.0`                   |
| Database           | PostgreSQL (via psycopg 3)          | `16` (Docker image)                |
| In-memory store    | Redis (redis-py)                    | `7` (Docker image) / `redis>=5,<6` |
| Password hashing   | passlib (`pbkdf2_sha256`)           | `>= 1.7, < 2.0`                    |
| Testing            | pytest + httpx (TestClient)         | `pytest>=8`, `httpx>=0.27`         |
| Linting            | Ruff                                | `>= 0.12, < 1.0`                   |
| Containers         | Docker / Docker Compose             | —                                  |
| CI                 | GitHub Actions                      | —                                  |

## Architecture

Single synchronous FastAPI application. Requests are handled directly; the API
reads and writes PostgreSQL through SQLAlchemy sessions and pushes
summarisation jobs to a Redis list. Docker Compose wires the three pieces
together and health-checks every service; the API container runs `alembic
upgrade head` before serving traffic.

```mermaid
flowchart LR
    subgraph docker["Docker Compose"]
        API["api — FastAPI + Uvicorn :8000"]
        DB[("db — PostgreSQL 16 :5432")]
        RQ[("redis — Redis 7 :6379")]
        API -->|"SQLAlchemy"| DB
        API -->|"RPUSH review_summary_jobs"| RQ
    end

    CLI["HTTP client"] -->|"REST / JSON"| API
```

The queue list `review_summary_jobs` holds JSON job payloads such as
`{"review_id": 42}`. **No consumer is included in this repository** — a worker
would have to read the list and produce the actual summary.

## Project Structure

```text
book-a-slot/
├── app/
│   ├── main.py                 # FastAPI app, router registration, root endpoint
│   ├── database.py             # SQLAlchemy engine + session + get_db dependency
│   ├── redis_client.py         # shared Redis client + get_redis_client dependency
│   ├── security.py             # password hashing, token auth, RBAC helpers
│   ├── models/
│   │   ├── enums.py            # UserRole, BookingStatus
│   │   ├── user.py
│   │   ├── booking.py
│   │   └── review.py
│   └── routers/
│       ├── auth.py             # /auth/signup, /auth/login, /auth/me
│       ├── bookings.py         # booking CRUD + book/complete
│       └── reviews.py          # create review + summarise trigger
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/               # three migrations (0001 → 0002 → 0003)
├── tests/
│   ├── conftest.py             # SQLite dependency override + FakeRedis
│   ├── test_main.py
│   ├── test_database.py
│   ├── test_auth.py
│   ├── test_security.py
│   ├── test_bookings.py
│   ├── test_reviews.py
│   └── test_live.py            # gated by RUN_LIVE=1
├── .github/
│   └── workflows/
│       └── ci.yml              # lint-and-test, docker-build, live-smoke
├── Dockerfile
├── docker-compose.yml
├── alembic.ini
├── pyproject.toml
└── .env.example
```

## Getting Started

### Prerequisites

- Docker with the Compose plugin (Docker Desktop includes it)
- Python `3.14` (only needed for the non-Docker local workflow)

### Run with Docker Compose (recommended)

```bash
git clone https://github.com/maverickOG/book-a-slot.git
cd book-a-slot

docker compose up -d --build
docker compose ps

curl http://localhost:8000/
# {"message":"Book a Slot API is running"}
```

Startup sequence:

1. Docker Compose starts the PostgreSQL and Redis services.
2. Compose waits until `db` and `redis` report healthy according to their
   healthchecks (`depends_on: condition: service_healthy`) before starting the
   `api` container.
3. When the `api` container starts, its command runs `alembic upgrade head` to
   apply the migrations.
4. Only after the migrations succeed does Uvicorn start on port `8000`.

Compose itself does not run Alembic — the migrations are executed by the API
container's own start command — and the API healthcheck does not gate Compose's
startup; only the `db`/`redis` healthcheck conditions do.

No manual migration step is needed when using Compose. The environment
variables for the container are defined inside `docker-compose.yml`, so a local
`.env` file is **not** required for the Docker workflow.

Open the interactive API docs:

- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>

Stop the stack with:

```bash
docker compose down          # stop containers
docker compose down -v       # also remove the PostgreSQL volume (wipes data)
```

### Run without Docker (local development)

You need a reachable PostgreSQL 16 and Redis 7 (e.g. running locally or via
`docker compose up -d db redis`).

```bash
python3 -m venv .venv        # requires Python >= 3.14
source .venv/bin/activate
pip install -e ".[dev]"

cp .env.example .env
set -a && source .env && set +a   # export DATABASE_URL / REDIS_URL into the shell

alembic upgrade head          # requires DATABASE_URL to be set
uvicorn app.main:app --reload
```

The application defaults `DATABASE_URL` and `REDIS_URL` to `localhost:5432` /
`localhost:6379` when unset, but the **Alembic** migration environment requires
`DATABASE_URL` to be present as a real environment variable — the app does not
auto-load `.env`, so export it as shown above.

## Configuration

| Variable       | Default                                                         | Used for                                   |
| -------------- | --------------------------------------------------------------- | ------------------------------------------ |
| `DATABASE_URL` | `postgresql+psycopg://book_a_slot:book_a_slot@localhost:5432/book_a_slot` | PostgreSQL connection (SQLAlchemy) |
| `REDIS_URL`    | `redis://localhost:6379/0`                                      | Redis connection (summarisation queue)     |

Inside Docker Compose the `api` service receives its own service-internal URLs
that point at the `db` and `redis` containers:

```yaml
DATABASE_URL: postgresql+psycopg://book_a_slot:book_a_slot@db:5432/book_a_slot
REDIS_URL: redis://redis:6379/0
```

Outside the Compose network you connect through the published port
(`localhost:5432`); inside the Compose network the API reaches the same server
through the `db` hostname. The database role, password, and database themselves
(`book_a_slot` / `book_a_slot` / `book_a_slot`) are created inside the
`postgres:16-alpine` container by the official image's `POSTGRES_USER`,
`POSTGRES_PASSWORD`, and `POSTGRES_DB` variables — no separate PostgreSQL
installation or account is set up on the host machine.

`.env.example` is documented for non-Docker local development only; the Compose
file does not read it. The credentials shown are development defaults and are
**not secrets** — see [Production Considerations](#production-considerations).
A `.env` file copied from it is matched by `*.env` in `.gitignore`, so it stays
out of version control; `.env.example` itself is tracked.

## Database Migrations

[Alembic](https://alembic.sqlalchemy.org/) manages the PostgreSQL schema. The
migration chain is:

| Migration | Purpose |
| --------- | ------- |
| `20260911_0001` | Creates `users`, `bookings`, and `reviews` with the `user_role` and `booking_status` enum types, constraints, and indexes. |
| `20260911_0002` | Makes `bookings.customer_id` nullable (a provider-owned slot has no customer yet) and adds `reviews.summary` (nullable `TEXT`, reserved for future summarisation output). |
| `20260911_0003` | Adds `users.token`, the unique column that backs bearer-token authentication. |

The migration environment requires `DATABASE_URL` to be set explicitly; it
refuses to guess a target database. With Compose, migrations run automatically
on every container start (`alembic upgrade head`).

## API

Interactive docs are auto-generated by FastAPI:

- Swagger UI — `GET /docs`
- ReDoc — `GET /redoc`
- OpenAPI schema — `GET /openapi.json`

All requests and responses use JSON. Dates are ISO-8601 strings. Authenticated
routes expect `Authorization: Bearer <token>`.

### Endpoints

| Method | Path                         | Auth / role                     | Description                                                                     |
| ------ | ---------------------------- | ------------------------------- | ------------------------------------------------------------------------------- |
| GET    | `/`                          | —                               | Health/liveness probe. Returns `{"message": "Book a Slot API is running"}`.     |
| POST   | `/auth/signup`               | —                               | Register. Body `{email, password}`. **Always creates a `customer`.** `201`.      |
| POST   | `/auth/login`                | —                               | Body `{email, password}`. Returns `{access_token, token_type: "bearer"}`. `200`. |
| GET    | `/auth/me`                   | bearer                          | Current user summary `{id, email, role}`.                                       |
| GET    | `/bookings`                  | bearer                          | List bookings (role-filtered — see below).                                      |
| POST   | `/bookings`                  | provider                        | Create an availability slot. Body `{starts_at, ends_at}`. `201`.                |
| GET    | `/bookings/{id}`             | owner / admin                   | Read one booking. `404` if missing, `403` if not accessible.                    |
| PUT    | `/bookings/{id}`             | provider-owner / admin          | Reschedule an open slot. Only `pending` + unbooked; else `409`.                 |
| DELETE | `/bookings/{id}`             | provider-owner / admin          | Delete an open slot (`204`). Only `pending` + unbooked; else `409`.             |
| POST   | `/bookings/{id}/book`        | customer                        | Claim a slot via an atomic conditional claim designed to prevent double booking. `200` on success, `409` if no longer available. |
| POST   | `/bookings/{id}/complete`    | provider-owner / admin          | Mark a `confirmed` booking `completed`. `409` in any other state.               |
| POST   | `/reviews`                   | customer (booking's customer)   | Review a completed booking. Body `{booking_id, rating (1–5), comment}`. `201`.  |
| POST   | `/reviews/{id}/summarize`    | customer (review author)        | Enqueue a summarisation job. Returns `202 {"status": "queued", "review_id": N}`.|

### Booking model

A booking is a single time interval on a provider's schedule:

- `provider_id` — the provider offering the slot (required).
- `customer_id` — set when a customer books it; `NULL` for open slots.
- `status` — `pending` (open) → `confirmed` (booked) → `completed`. The enum
  also defines `cancelled`, but no endpoint currently sets it.
- Body schemas use `{starts_at, ends_at}` and reject intervals that do not end
  after they start (`422`).

A slot **is** a booking with `status=pending` and `customer_id=NULL`; there is
no separate availability table.

## Authentication & RBAC

- Passwords are hashed with passlib's `pbkdf2_sha256` scheme — never stored in
  plaintext.
- Successful login issues a cryptographically random token that is stored in
  `users.token`. Clients send it as `Authorization: Bearer <token>`. Tokens
  are opaque and are not JWTs; they carry no claims and can be revoked simply
  by clearing the stored value.
- **Signup always creates a `customer`.** There is no role field — an
  anonymous caller cannot self-assign `admin` or `provider`. Admin/provider
  accounts must be created directly in the database (see below).

### Role isolation rules

- **Admin** — may view and manage every booking.
- **Provider** —
  - list and modify only their own slots;
  - cannot read or modify another provider's booking (`403`);
  - completes bookings on their own slots.
- **Customer** —
  - sees only their own bookings by default;
  - discovers available slots with `GET /bookings?status=pending` (returns only
    open slots with `customer_id` unset — never another customer's booking);
  - can only review and summarise bookings they hold.

### Creating a provider for local testing

`/auth/signup` only creates customers, so to exercise the provider flow you
must insert a provider row directly into the database (the same approach the
live integration test uses):

```bash
# generate a password hash with the project installed
.venv/bin/python -c "from app.security import get_password_hash; print(get_password_hash('provider-pass'))"

# create the provider inside the running db container
docker compose exec db psql -U book_a_slot -c \
  "INSERT INTO users (email, password_hash, role, created_at)
   VALUES ('provider@example.com', '<paste-hash-here>', 'provider', now());"
```

Then log in as usual with `provider@example.com / provider-pass`.

## Redis / Review Summarisation

Redis is used as the **queue backing the review summarisation endpoint**.

- `POST /reviews/{review_id}/summarize` is restricted to the customer who wrote
  the review.
- It pushes the payload `{"review_id": N}` onto the Redis list
  `review_summary_jobs` (one `RPUSH`) and immediately returns
  `202 {"status": "queued", "review_id": N}`.
- The `reviews.summary` column exists but is currently **never populated**.

There is **no real LLM call and no background worker** in this project. The
endpoint only enqueues the job; processing it is future work.

## Testing

Unit tests run against an in-memory SQLite database (dependency override of
`get_db`) and a hand-rolled `FakeRedis` stand-in, so the suite needs no
external services. PostgreSQL remains the only real database target.

```bash
# lint
ruff check app tests alembic

# full unit suite (the one skipped test is the live integration test)
python -m pytest tests -q
```

**Live integration test** (`tests/test_live.py`) — skipped unless
`RUN_LIVE=1`. It requires a reachable PostgreSQL and Redis, applies
`alembic upgrade head`, waits up to 60s for connectivity, then exercises the
whole flow against the real stack:

1. provider creates a slot,
2. a customer discovers it via `GET /bookings?status=pending`,
3. the customer books it (and gets `409` on double booking),
4. the provider completes it,
5. the customer reviews it (duplicate review `409`, other customer / provider
   `403`),
6. `POST /reviews/{id}/summarize` returns `202`,
7. the test reads the real Redis list with `LRANGE` and asserts the payload is
   exactly `{"review_id": N}`.

The double-booking rejection in step 3 is exercised **sequentially** — a second
request against an already-booked slot returns `409`. The protection itself is
the single atomic conditional `UPDATE` (`status = 'pending' AND customer_id IS
NULL`) in `POST /bookings/{id}/book`; a simultaneous multi-transaction race was
not stress-tested.

With the Docker stack running:

```bash
RUN_LIVE=1 \
DATABASE_URL=postgresql+psycopg://book_a_slot:book_a_slot@localhost:5432/book_a_slot \
REDIS_URL=redis://localhost:6379/0 \
python -m pytest tests/test_live.py -q
```

## Docker

`docker-compose.yml` defines three services. The API container's startup
command runs `alembic upgrade head` before launching Uvicorn, and every
service has a health check:

| Service | Image                | Port (host) | Health check            | Notes                              |
| ------- | -------------------- | ----------- | ----------------------- | ---------------------------------- |
| `api`   | `book-a-slot-api` (built from `./Dockerfile`) | `8000` | `GET /` (HTTP 200) | Wait: `db` + `redis` healthy. Runs migrations then Uvicorn. |
| `db`    | `postgres:16-alpine` | `5432`      | `pg_isready`            | Persistent data in the `pgdata` named volume. |
| `redis` | `redis:7-alpine`     | `6379`      | `redis-cli ping`        | In-memory; no volume configured.   |

Compose starts the `api` container only after `db` and `redis` report healthy
(`depends_on: condition: service_healthy`). The `api` healthcheck provides
readiness information and does not gate Compose's startup order.

The `pgdata` named volume keeps PostgreSQL data across `docker compose down`
(use `docker compose down -v` to remove it).

## CI

`.github/workflows/ci.yml` runs on every push to `main` and on pull requests.
It has three jobs:

| Job             | Runs                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| `lint-and-test` | `ruff check app tests alembic` and the full `pytest tests -q` suite on Python 3.14.                    |
| `docker-build`  | `docker build -t book-a-slot .` to prove the image builds.                                             |
| `live-smoke`    | Starts real `postgres:16-alpine` and `redis:7-alpine` job services, then runs `tests/test_live.py` with `RUN_LIVE=1` against them. |

## API Documentation

FastAPI generates and serves interactive documentation automatically:

- <http://localhost:8000/docs> — Swagger UI (try endpoints directly)
- <http://localhost:8000/redoc> — ReDoc reference
- <http://localhost:8000/openapi.json> — raw OpenAPI schema

Whether you run via Docker Compose or `uvicorn`, these are available at the
same paths.

## Production Considerations

Current limitations and things to address before production use:

- **Summarisation is a stub** — `/reviews/{id}/summarize` only enqueues a job
  payload; it does not generate a summary. A worker must consume
  `review_summary_jobs` and populate `reviews.summary`.
- **No seed/provisioning path** — signup creates only customers; admin and
  provider accounts must be created directly in the database.
- **Committed dev defaults vs. real secrets** — the `book_a_slot` /
  `book_a_slot` pair in `docker-compose.yml` and the URL defaults are committed
  development defaults that make the local Compose stack runnable; they are not
  production credentials. Real credentials and any secret-bearing environment
  files must stay out of version control and be injected at runtime (e.g.
  secrets management or environment variables).
- **Configuration** — `DATABASE_URL` and `REDIS_URL` come from the environment;
  keep them out of version control and rotate any real credentials.
- **Single-process serving** — Compose runs one Uvicorn process per API
  container without a load balancer; scale out (and add a reverse proxy / TLS)
  for production traffic.
- **No pagination** — `GET /bookings` returns all matching rows.
- **Token lifetime** — issued tokens persist until they are changed or cleared;
  there is no expiry or refresh flow.

## License

This project is licensed under the [MIT License](LICENSE).
