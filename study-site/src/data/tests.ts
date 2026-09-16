/**
 * Testing inventory, grounded in tests/* and the CI logs (run 34573662242).
 * Unit tests run against SQLite + a FakeRedis; one live test runs against
 * real PostgreSQL + Redis when RUN_LIVE=1.
 */
export interface TestFileInfo {
  file: string;
  focus: string;
  count?: number;
}

export const testFiles: TestFileInfo[] = [
  { file: "tests/test_auth.py", focus: "signup, login, /auth/me, token handling", count: 9 },
  { file: "tests/test_security.py", focus: "role dependencies in isolation (in-memory users)" },
  { file: "tests/test_bookings.py", focus: "18 tests: CRUD, role isolation, atomic booking, guards", count: 18 },
  { file: "tests/test_reviews.py", focus: "13 tests: review rules, author 403s, FakeRedis queue", count: 13 },
  { file: "tests/test_database.py", focus: "PostgreSQL target, registered tables, sessions" },
  { file: "tests/test_main.py", focus: "root endpoint", count: 1 },
  { file: "tests/test_live.py", focus: "full end-to-end vs real PostgreSQL + Redis (RUN_LIVE=1)", count: 1 },
];

export const testSummary = {
  unitTests: 53,
  skippedByDefault: 1,
  liveTests: 1,
  ruffScope: "app tests alembic",
  ciRun: "34573662242 (all 3 jobs passed)",
  versions: "Python 3.14.7 · FastAPI 0.141.1 · SQLAlchemy 2.0.52 · Alembic 1.19.2 · psycopg 3.3.5",
};