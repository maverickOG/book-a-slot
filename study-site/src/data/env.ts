/**
 * Configuration knobs, grounded in app/database.py, app/redis_client.py,
 * .env.example, docker-compose.yml and .github/workflows/ci.yml.
 */
export interface EnvVar {
  name: string;
  whereRead: string;
  default: string;
  notes: string;
}

export const envVars: EnvVar[] = [
  {
    name: "DATABASE_URL",
    whereRead: "app/database.py",
    default: "postgresql+psycopg://book_a_slot:book_a_slot@localhost:5432/book_a_slot",
    notes: "psycopg is the postgres driver; the compose file points the API at the db service instead of localhost.",
  },
  {
    name: "REDIS_URL",
    whereRead: "app/redis_client.py",
    default: "redis://localhost:6379/0",
    notes: "In compose it becomes redis://redis:6379/0.",
  },
  {
    name: "RUN_LIVE",
    whereRead: "tests/test_live.py",
    default: "unset (test skipped)",
    notes: "Set to 1 to run the live smoke test against real PostgreSQL + Redis.",
  },
  {
    name: "POSTGRES_USER / _PASSWORD / _DB",
    whereRead: "docker-compose.yml only",
    default: "book_a_slot",
    notes: "Used by the Postgres container to bootstrap the role and database. There is no host-level Postgres account.",
  },
];