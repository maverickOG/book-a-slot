/**
 * The Docker Compose topology, grounded in docker-compose.yml.
 */
export interface DockerService {
  name: string;
  image: string;
  port: string;
  env?: string[];
  healthcheck: string;
  dependsOn?: string;
  purpose: string;
}

export const composeServices: DockerService[] = [
  {
    name: "db",
    image: "postgres:16-alpine",
    port: "5432",
    env: ["POSTGRES_USER=book_a_slot", "POSTGRES_PASSWORD=book_a_slot", "POSTGRES_DB=book_a_slot"],
    healthcheck: "pg_isready -U book_a_slot -d book_a_slot",
    purpose: "PostgreSQL — the real database. The POSTGRES_* variables create the role and database inside the container.",
  },
  {
    name: "redis",
    image: "redis:7-alpine",
    port: "6379",
    healthcheck: "redis-cli ping",
    purpose: "Work-queue store for review summarisation jobs.",
  },
  {
    name: "api",
    image: "built from ./Dockerfile (python:3.14-slim)",
    port: "8000",
    env: ["DATABASE_URL=postgresql+psycopg://book_a_slot:book_a_slot@db:5432/book_a_slot", "REDIS_URL=redis://redis:6379/0"],
    healthcheck: "HTTP GET http://localhost:8000/ == 200",
    dependsOn: "db + redis healthy first",
    purpose: "The FastAPI app. Runs alembic upgrade head, then uvicorn.",
  },
];

export const composeCommand =
  "sh -c \"alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000\"";

export const infrastructureFacts = {
  postgresVolume: "pgdata (named volume, persists across restarts)",
  apiStartupOrder: "depends_on: condition: service_healthy (db and redis)",
  localStart: "docker compose up --build",
  firstTime: true,
};