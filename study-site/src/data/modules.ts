export interface StudyModule {
  key: string;
  number: string;
  label: string;
  blurb: string;
}

/**
 * The learning-path grouping used by the sidebar and the home page.
 * Chapter frontmatter references these keys via `module`.
 */
export const modules: StudyModule[] = [
  {
    key: "big-picture",
    number: "Module 1",
    label: "Big picture",
    blurb: "What the project is and how the pieces fit together.",
  },
  {
    key: "language",
    number: "Module 2",
    label: "Python & FastAPI basics",
    blurb: "The language and web framework from zero, using real files.",
  },
  {
    key: "data",
    number: "Module 3",
    label: "The data layer",
    blurb: "SQLAlchemy models, PostgreSQL schema, and Alembic migrations.",
  },
  {
    key: "identity",
    number: "Module 4",
    label: "Identity & access",
    blurb: "Password hashing, bearer tokens, and role-based access control.",
  },
  {
    key: "domain",
    number: "Module 5",
    label: "The booking domain",
    blurb: "The slot lifecycle, the concurrency-safe claim, reviews and Redis.",
  },
  {
    key: "running",
    number: "Module 6",
    label: "Running the stack",
    blurb: "Docker, Postgres and environment configuration.",
  },
  {
    key: "confidence",
    number: "Module 7",
    label: "Confidence",
    blurb: "Automated tests and the GitHub Actions pipeline.",
  },
  {
    key: "reference",
    number: "Module 8",
    label: "Reference",
    blurb: "API reference, request lifecycles, production-safety gaps.",
  },
  {
    key: "beyond",
    number: "Module 9",
    label: "Study & beyond",
    blurb: "Interactive learning, teaching exercises, and design thinking.",
  },
];