# Inside Book a Slot — Study Site

An interactive, code-grounded study guide to the
[Book a Slot](https://github.com/maverickOG/book-a-slot) repository — the
Bodhrik full-stack take-home assessment (FastAPI + PostgreSQL + Redis +
Docker). It walks through the *real* code of that project chapter by chapter,
so the developer can explain, extend, and defend every part of it.

> **Not part of the Book a Slot project.**
> This site is a personal learning companion. It is **not** the assessment
> submission, is **not associated with** the Book a Slot API, and is neither
> run nor tested by that project's Docker stack or CI. It is fully static:
> no backend, no accounts, and no network calls — all interactivity replays
> local data, and learning progress lives in your browser only.

---

## Why this site exists

Reading code is not the same as understanding it. This site turns the Book a
Slot repository into a structured course: every claim is grounded in a frozen
copy of the actual source (see [Code grounding](#code-grounding)), every quiz
answer cites the file that justifies it, and interactive playgrounds let you
replay HTTP requests and booking lifecycles without running the API.

## What's inside

| Surface | What you get |
| --- | --- |
| **20 chapters** | MDX lessons grouped into **9 modules** — from "what is this project?" through Python/FastAPI basics, the data layer, auth & RBAC, the booking domain, Docker, testing, CI, and production thinking |
| **19 quizzes / 104 questions** | Chapter-scoped self-checks; every question cites its `sourceReference`; 80% to pass; wrong picks can show the targeted misconception |
| **Playground** | A static **RequestSimulator** (12 endpoints × scenarios), **WhichIsReal** code puzzles, and an **OrderSteps** sequence builder |
| **Reference** | Full 12-route API table, an interactive schema diagram with the 3 tables, and a migrations timeline (0001 → 0002 → 0003) |
| **Code browser** | `/code` — browse the frozen repository snapshots file by file, exactly as synced |
| **Glossary** | 49 terms in 8 categories, with inline hoverable popovers across the chapters |

Progress tracking (read chapters, passed quizzes, mastered chapters) is stored
per-browser in `localStorage` (`inside-book-a-slot.learning.v1` and
`inside-book-a-slot.quiz.v1`) and never leaves your machine.

## Code grounding

The site never paraphrases the parent repo from memory. `npm run sync:code`
copies the real repository files (`app/`, `alembic/`, `tests/`,
`docker-compose.yml`, `Dockerfile`, `pyproject.toml`, `.env.example`,
`.dockerignore`, `.github/`) into `src/code-snapshots/` and writes a
`_MANIFEST.json` pinning the exact commit:

- **Snapshot pinned at repo HEAD** `740be25` (app code last changed `e33d36f`),
  synced 2026-09-11.
- The footer of every page publishes those pins, so you always know which
  version of the code you are being taught.

If the parent repository changes, re-run:

```bash
npm run sync:code
```

Never hand-edit anything under `src/code-snapshots/` — regenerate it.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Astro `^7.3.2` (static SSG, 30 pages at build time) |
| Content | MDX chapters (`@astrojs/mdx ^8.0.1`) |
| Interactivity | React `^19` islands (`client:load`) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` |
| Language | TypeScript |
| E2E tests | Playwright `^1.63.0` |

## Getting started

Prerequisites: **Node 20+** (developed on Node 22) and npm.

```bash
cd study-site
npm install

# Dev server with hot reload → http://localhost:4788
npm run dev

# Type-check + production build (astro check && astro build)
npm run build

# Serve the production build
npm run preview -- --port 4789
```

The site is a static export — after `npm run build`, anything that serves the
`dist/` folder works (the `/code` browser and all islands are bundled
client-side).

## Testing

Browser tests are the source of truth for this site's UX — a successful build
proves nothing about interactions. Playwright runs against the **preview**
server (port 4789) or the **dev** server (port 4788) via `E2E_BASE_URL`:

```bash
npm run build                                  # required before preview-based runs
npm run preview -- --port 4789                 # terminal 1
npm run test:e2e                               # terminal 2 — suite vs preview

npm run dev                                    # terminal 1 — dev server on 4788
E2E_BASE_URL=http://localhost:4788 npx playwright test   # suite vs dev
```

- 14 spec files under `tests/e2e/`: navigation (desktop + mobile), islands and
  interactions, quiz flows and persistence, glossary popovers, reference
  dropdown, visual/overflow/contrast checks, and dark-surface legibility.
- Three projects: **desktop** (1440×900), **tablet** (768×1024, visual specs),
  and **mobile** (iPhone 13, Chromium).
- Config: 45s test timeout, 2 workers, reduced motion forced for
  determinism, traces/screenshots/videos only on failure (HTML report in
  `playwright-report/`).

## Project structure

```text
study-site/
├── astro.config.mjs          # Astro + React + MDX + Tailwind; dev port 4788
├── package.json              # scripts: dev / build / preview / sync:code / test:e2e
├── playwright.config.ts      # 3 projects, preview base URL, failure artifacts
├── scripts/
│   └── sync-code.mjs         # parent repo → src/code-snapshots (manifest writer)
├── docs/                     # diagnosis & verification history for the site
├── src/
│   ├── content/chapters/     # 20 MDX chapters (the course itself)
│   ├── content.config.ts     # chapter collection schema
│   ├── components/
│   │   ├── diagrams/         # client:load SVG diagrams (schema, docker, flows…)
│   │   ├── interactive/      # RequestSimulator, WhichIsReal, OrderSteps,
│   │   │                     # QuizCard, QuizHub, GlossaryTerm
│   │   ├── ui/               # Callout, Cite, Pill, SourceLinks
│   │   ├── Topbar.astro      # nav + Reference dropdown
│   │   ├── Sidebar.astro     # module tree + learning-progress markers
│   │   └── Footer.astro      # frozen-commit pins
│   ├── layouts/              # BaseLayout / AppShell / ChapterLayout
│   ├── lib/
│   │   ├── chapters.ts       # chapter queries (order, prev/next)
│   │   ├── learning.ts       # versioned localStorage learning state
│   │   └── quizProgress.ts   # versioned localStorage quiz results
│   ├── data/                 # modules, quizzes, endpoints, models,
│   │                         # migrations, glossary (curated teaching data)
│   ├── pages/                # /, /start, /playground, /quiz-hub, /code,
│   │                         # /glossary, /reference/*, /chapters/[slug], /404
│   ├── styles/global.css     # Tailwind v4 theme + chapter typography
│   └── code-snapshots/       # FROZEN copies of the parent repo + _MANIFEST.json
└── tests/e2e/                # Playwright specs + shared helpers
```

## Design rules

- **No network.** Islands never fetch; all data ships with the build.
- **SSR/CSR integrity.** Never mutate server-rendered DOM inside an island
  before React hydrates (a past copy-button bug caused React error #418).
- **Dark surfaces** must use the shared `dark-surface` token scope so prose
  stays legible (the unlayered `.chapter-content` prose colors otherwise win).
- **No horizontal overflow at 375px**; every behavioral change is verified
  test-first in the Playwright suite.

## Relationship to the parent repository

This folder is tracked inside the parent
[book-a-slot](https://github.com/maverickOG/book-a-slot) repository and pushed
with it, so the site's source is publicly viewable. It remains a **separate
learning aid**: the parent project does not import, build, deploy, or test it,
and changes here never affect the Book a Slot API.
