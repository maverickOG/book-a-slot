# study-site/AGENTS.md

Persistent context for AI agents working on `study-site/`. Read this file before
changing anything in this directory. Keep it accurate: every claim here is either
verified from the current source, config, tests, or the local diagnosis report, or
explicitly labelled as unverified. Do not add history that is not on record
anywhere in `study-site/` or the parent repository.

---

## 1. Project identity

- **Name:** Inside Book a Slot.
- **Location:** `study-site/`, a subdirectory of the parent repository
  `/Users/maverick/Documents/All of Code/Kalvium/Bodhrik/book-a-slot`.
- **Purpose:** An interactive, code-grounded study guide to the parent repository
  — the Bodhrik "Book a Slot" (FastAPI + PostgreSQL + Redis + Docker) full-stack
  take-home assessment. It teaches the real repository so the developer can
  explain, extend, and defend it.
- **Ownership (changed 2026-09-16):** `study-site/` is tracked directly in the
  parent repository and is committed and pushed to the parent's GitHub remote
  (`origin` = `https://github.com/maverickOG/book-a-slot`). There is no
  standalone study-site git repository anymore.
- **Stack (verified in `package.json` / `astro.config.mjs`):** Astro `^7.3.2`
  static SSG, `@astrojs/mdx` `^8.0.1`, `@astrojs/react` `^4.0.0`, React/React-DOM
  `^19`, Tailwind CSS v4 via `@tailwindcss/vite`, TypeScript. E2E: Playwright
  `^1.63.0`.
- **Site facts (verified from source):** 20 chapters (`src/content/chapters/`,
  `01-overview` … `20-study-plan`), 9 modules (`src/data/modules.ts`), 19 quizzes
  and 104 questions (`src/data/quiz.ts`), 12 API routes (`src/data/endpoints.ts`),
  3 data-model cards (`src/data/models.ts`), 3 migrations
  (`src/data/migrations.ts`), 49 glossary terms (`src/data/glossary.ts`).
- **Code grounding (verified in `src/code-snapshots/_MANIFEST.json` and
  `src/components/Footer.astro`):** the site documents the repo as frozen at
  app-code commit `e33d36f` / repo HEAD `740be25` (snapshots synced
  `2026-09-11T10:34:17Z`).
- **Status labels used throughout this file and in `docs/`:**
  - `Status: Implemented, awaiting real-browser verification` — code is in place;
    a live browser has not yet proven it.
  - `Status: Reported, not yet browser-verified` — observed or stated; no test
    proves it yet.
  - `Unknown or unverified` — no evidence found.

---

## 2. Hard boundaries

1. **`study-site/` lives inside the parent repository and is pushed with it.**
   There is no standalone study-site git repository anymore. The old separate
   repo (`https://github.com/maverickOG/inside-book-a-slot`) is private and is no
   longer the home of this code; its nested `.git` was removed so the parent repo
   tracks the actual files. Study-site changes are staged, committed, and pushed
   to the parent's `origin` (`https://github.com/maverickOG/book-a-slot`) on the
   normal workflow. Never reintroduce a nested `.git` here, and never commit build
   artifacts or secrets.
2. **All assessment development happens in the parent repository**, never here.
   Do not modify parent files (`app/`, `tests/`, `alembic/`, `pyproject.toml`,
   `Dockerfile`, `docker-compose.yml`, `.github/`, root `AGENTS.md`, README,
   technical note) from study-site work.
3. **No invented assessment facts.** Every claim on the site must trace to the
   frozen code in `src/code-snapshots/`, the quiz `sourceReference` citations, or
   verified parent-repo CI results. Where the assessment brief is silent, the site
   marks it as a design decision or gap instead of inventing a requirement.
4. **Snapshot integrity.** `scripts/sync-code.mjs` reads only from the parent repo
   (`app`, `alembic`, `alembic.ini`, `tests`, `docker-compose.yml`, `Dockerfile`,
   `.dockerignore`, `pyproject.toml`, `.env.example`, `.github`) and writes only
   inside `src/code-snapshots/`. Never hand-edit a snapshot; run `npm run sync:code`
   after the parent repo changes.
5. **No network in the app.** The site is static. Interactive islands
   (RequestSimulator, WhichIsReal, OrderSteps, GlossaryTerm, QuizCard, QuizHub)
   replay local data from `src/data/*`; they must never call the API or any URL.
6. **Both runtime surfaces are verified: static preview (4789) and the Astro dev
   server (4788).** The dev-server hydration defect (section 10, K1) was fixed and
   re-proven; every interactive change must pass the full suite on **both** dev and
   preview. A forwarded dev-tunnel URL is not configured in this environment, so
   tunnel-mode has never been exercised (state that plainly, do not claim it).
7. **Browser tests are the source of truth for this site's UX.** Static SSR
   output, successful builds, and bundled output prove nothing about interactions
   (section 12).

---

## 3. Architecture map

Static SSG: Astro builds all routes at build time; React `client:load` islands
hydrate per page; state lives in components plus the browser-local learning store
(no backend). Source layout (verified by inspection):

- **Build & scripts (`package.json`):** `dev` (port 4788), `build` =
  `astro check && astro build` (30 static pages), `preview` (port 4789),
  `sync:code`, `test:e2e`, `test:e2e:preview`, `test:e2e:dev`.
- **`astro.config.mjs`:** `react()` + `mdx()` integrations, `@tailwindcss/vite`,
  GitHub-dark Shiki with `wrap: true`, and `vite.optimizeDeps.include =
  ["react", "react-dom", "react-dom/client", "react/jsx-runtime"]` — a **dev-only**
  fix so Vite pre-bundles `react-dom/client` and its ESM re-export of `createRoot`
  resolves (section 10, K1; incident I12). It is required for `astro dev` to
  hydrate islands; it does not affect the production build.
- **`src/content/chapters/*.mdx`:** 20 MDX chapters. Collection schema
  (`src/content.config.ts`): `title`, `chapter`, `module`, `order`, `summary`,
  `minutes` (default 8), `prereqs`, `tags`.
- **`src/lib/`**
  - `chapters.ts` — `allChapters()` (collection sorted by `order`),
    `chaptersByModule()` (module order from `src/data/modules.ts`),
    `findPrevNext()`.
  - `learning.ts` — the versioned learning-state store (section 6).
- **`src/data/`** — teaching data: `modules.ts` (9), `quiz.ts` (19/104),
  `endpoints.ts` (12), `glossary.ts` (49), `models.ts` (3), `migrations.ts` (3).
- **`src/layouts/`**
  - `BaseLayout.astro` — HTML shell; copy-button script that skips `<pre>`
    inside `astro-island` (React #418 fix).
  - `AppShell.astro` — `Topbar` + `Sidebar` + `<main class="min-w-0 flex-1">` +
    `Footer`; normalizes pathnames by stripping trailing slashes so nav/breadcrumb
    active state matches canonical paths.
  - `ChapterLayout.astro` — module header, breadcrumbs, prev/next; throws for an
    unknown chapter id.
- **`src/components/`** — `Topbar.astro` (nav + Reference dropdown with
  `aria-current` on the trigger when a `/reference/*` page is active),
  `Sidebar.astro` (learning-progress panel + chapter tree), `Footer.astro`,
  `ui/Callout.astro` (note/tip/warn/danger), `diagrams/SchemaDiagram.tsx` and
  `diagrams/MigrationsTimeline.tsx` (React `client:load` SVGs), `interactive/`
  (`RequestSimulator.tsx`, `WhichIsReal.tsx`, `OrderSteps.tsx`, `GlossaryTerm.tsx`,
  `QuizCard.tsx`, `QuizHub.tsx`).
- **`src/styles/global.css`** — Tailwind v4 `@theme`, base integrity
  (`.chapter-content` typography, focus-visible, smooth scroll, reduced-motion).
- **`src/code-snapshots/`** — frozen repo copies + `_MANIFEST.json` (section 5).
- **`tests/e2e/`** — 10 spec files + `helpers.ts`; `playwright.config.ts`
  (section 12). `test-results/` and `playwright-report/` are git-ignored artifacts.
- **`docs/phase1-browser-test-diagnosis.md`** — historical diagnosis report with
  the Phase 2 verification section appended.

---

## 4. Route map and user journeys

13 canonical routes (the `ROUTES` list in `tests/e2e/helpers.ts`):

| Route | Page | Purpose |
| --- | --- | --- |
| `/` | `index.astro` | Hero ("20 chapters", 9 modules, total minutes), module-grouped chapter list, "the promise" section (verified repo state: 53 unit tests, live smoke vs PostgreSQL 16 + Redis 7, Docker Compose, GitHub Actions) |
| `/start` | `start.astro` | Study plan / how to use the site |
| `/playground` | `playground.astro` | RequestSimulator (12 endpoints × scenarios), WhichIsReal puzzles, OrderSteps sequence builder |
| `/quiz-hub` | `quiz-hub.astro` | All 19 quizzes grouped by module; `?quiz=<id>` deep link |
| `/code` | `code.astro` | Code browser over `src/code-snapshots/**` (raw imports via `import.meta.glob`, grouped by top-level dir, file/line totals) |
| `/glossary` | `glossary.astro` | 49 terms in 8 categories; inline hoverable popovers elsewhere |
| `/reference/api` | `reference/api.astro` | Full 12-route table (method, path, purpose, auth, key outcomes, source) |
| `/reference/models` | `reference/models.astro` | `SchemaDiagram` + 3 table cards; Callout for nullable-`customer_id` / no-slot-table decisions |
| `/reference/migrations` | `reference/migrations.astro` | `MigrationsTimeline` + `<details>` per migration; why migration `0002` exists |
| `/chapters/01-…` | dynamic | 20 MDX chapters with breadcrumbs, prev/next, embedded islands |
| `/404` | `404.astro` | Not-found page |

**Usual journeys:**
- **Learner:** `/` → `/start` → chapters in order (sidebar markers `○ ● ✓ ★` and
  `aria-live` summary), glossary popovers inline, embedded islands in chapters
  (`/chapters/19-interactive-learning` mounts simulator + WhichIsReal).
- **Quiz:** `/quiz-hub` (or a chapter-embedded `QuizCard`) → answer all questions
  (each judged after "Check") → Submit at ≥80% → saved to learning state.
- **Playground:** `/playground` → endpoint + scenario in the static simulator →
  WhichIsReal verdicts → OrderSteps sequence check.
- **Reference:** `/reference/api` → `/reference/models` → `/reference/migrations`
  (desktop: Reference dropdown; mobile: flat child links).
- **Mobile (verified in `navigation.mobile.spec`):** Reference dropdown becomes
  flat child links (active marker = the child page); sidebar hidden below `lg`.

---

## 5. Source-of-truth rules

Order of authority for any claim this site makes:

1. **`src/code-snapshots/`** — verbatim copies of the parent repo at a frozen
   commit; `_MANIFEST.json` records `repoHead` (`740be25`), `appCodeLastChanged`
   (`e33d36f`), and `syncedAt`. This is what "grounded in the real code" means.
2. **Parent repo tests** (`code-snapshots/tests/`) — behavior claims (400/403/409,
   concurrency guarantees, review rules) trace to passing test behavior, not prose.
3. **`src/data/*.ts`** — curated teaching summaries (endpoints, models,
   migrations, glossary, modules, quizzes). Values must agree with the snapshots;
   every quiz question's `sourceReference` cites the snapshot file(s) that
   justify its answer.
4. **Verified parent CI evidence** — e.g. the home-page "promise" (53 unit tests,
   live smoke against PostgreSQL 16 + Redis 7) reflects the parent repo's own CI
   records; the study site reports that evidence, it does not generate evidence.
5. **`docs/`** — local diagnosis/verification records for this site itself.

Rules: never inherit claims from generic boilerplate; if the assessment brief is
silent on a point, mark it as a design decision or gap rather than a fact; when
the parent repo changes, re-run `npm run sync:code` and re-check the footer and
any page that cites commits.

---

## 6. Learning-state model

All verified from `src/lib/learning.ts` (single source, used by `Sidebar.astro`,
`QuizCard.tsx`, `QuizHub.tsx`):

- **Persistence:** browser `localStorage` only. Key
  `inside-book-a-slot.learning.v1`; change event `learning:changed`; pass
  threshold `PASS_THRESHOLD = 0.8`. Version guard `isV1` ignores stale shapes. The
  old broken mechanism's key `study.progress` is removed on every load so it can
  never interfere.
- **Per-chapter fields (`ChapterLearning`):** `opened` (visited), `readToEnd`
  (reached the meaningful end via scroll detection), `quizPassed` (monotonic),
  `mastered` (**computed** as `readToEnd && quizPassed`, never set directly),
  `updatedAt`.
- **Mutations:** `markOpened`; `markReadToEnd` (also implies `opened`);
  `markQuizPassed` (also implies `opened`, monotonic — once passed stays passed);
  `resetAllLearning`. All persist, then dispatch `LEARNING_EVENT`.
- **Counts:** `readCount`; `quizPassedCount` (denominator = the 19 quiz chapter
  ids); `masteredCount`.
- **UI:** `Sidebar.astro` renders `#progress-summary` (`aria-live=polite`, reads
  `Read n/20 · Quiz passed n/19 · Mastered n/20`), per-link markers
  (`opened` ⚬ / `read` ● / `passed` ✓ / `mastered` ★) driven by `data-quiz-ids`,
  and a `#progress-reset` button guarded by a confirm dialog. `QuizCard` shows a
  persistent "Passed — saved to learning progress" badge; `QuizHub` shows a live
  `passedCount` and per-module counts. Listeners also react to `storage` events so
  two tabs stay in sync.
- **Nothing in this model touches the network.** Private-mode/quota failures are
  swallowed (progress just won't persist).

---

## 7. Quiz system

Data (verified in `src/data/quiz.ts`): `Quiz { id, title, topic, module, chapter,
chapterNumber, chapterTitle, difficulty, questions[] }`; `Question { q, options,
answerIndex, explanation, sourceReference, misconception? }`. 19 quizzes, 104
questions, 42 with `misconception` (shown only on a wrong pick); every question
has a `sourceReference` citing frozen snapshot files. Difficulty is
`foundation | applied | challenge`.

- **Placement:** quizzes are tied to chapters by the `chapter` field, shown in the
  hub grouped by module, and embedded on chapter pages via `QuizCard`.
- **Flow (`QuizCard.tsx`, verified):** pick an option per question → "Check answer
  & continue" (enabled only with a selection) judges that question, marks it
  checked, records `lastChecked`, and advances. The feedback banner
  (`role="status"`) shows verdict + correct answer (if wrong) + explanation +
  optional misconception + `sourceReference`; `lastChecked` keeps the just-answered
  question's verdict visible after auto-advance. Submit is disabled until **every**
  question is checked; score = correct/total; ≥ `PASS_THRESHOLD` (80%) calls
  `markQuizPassed` only when not already passed. Reset replays questions via a
  remount key.
- **Hub (`QuizHub.tsx`, verified):** summary card (quiz/question counts, "passing
  score 80%", live `passedCount`); module headers are `<button>`s with
  `aria-expanded`; modules with ≤3 quizzes start open and every module has an
  explicit init value so one click can collapse it; deep link `?quiz=<id>` selects
  a quiz and opens its module; the URL is updated with `history.replaceState`,
  cleared on "Back to all quizzes".
- **Rule:** nothing is auto-judged before the learner checks each question; pass
  state is only saved on a full submit at threshold.

---

## 8. UI, accessibility, and responsive rules

- **Global base (`src/styles/global.css`):** Tailwind v4; body `bg-amber-50/40
  text-slate-900` (amber/indigo palette); `prefers-reduced-motion` collapses
  animations to ~0.01ms (also keeps reduced-motion Playwright runs deterministic);
  `.chapter-content` typography with explicit colors and spacing.
- **Prose-color gotcha (the most important CSS fact):** `.chapter-content`
  typography colors `p`, `a`, and lists **directly**, and those rules are
  UNLAYERED — they beat both Tailwind's layered `text-*` utilities and any
  inherited light color, so a `<p>` inside a dark panel inherits prose styling,
  not the panel's text color. Verified: panel bg is slate-900 but its `<p>` would
  stay slate-700. Two live layers of defense: (1) prose colours resolve through
  the `--surface-text/--surface-strong/--surface-link` tokens defined on
  `.chapter-content`; (2) every dark panel carries `dark-surface`, which
  overrides those tokens to light values so all its textual descendants are
  legible. When adding a new dark surface, apply the `dark-surface` class — never
  a bare ancestor `text-…` utility or a per-element colour. Light surfaces keep
  the token defaults and are byte-identical.
- **Link styling:** plain ("prose") links must not be styled broadly as `.btn` —
  an over-broad prose-link rule once turned primary CTA text white-on-white.
  Buttons are real `<button>`s; primary CTAs use `.btn.btn-primary`.
- **SSR/CSR integrity:** never mutate server-rendered DOM inside an island before
  React hydrates it (the copy-button script once appended a button into every
  `<pre>`, including island `<pre>`s → React #418 on `/playground` and
  `/chapters/19-*`). Copy buttons now **skip `pre` inside `astro-island`**. Island
  rendering must be deterministic between SSR and client (`OrderSteps` shuffle is
  a seeded, SSR-stable PRNG).
- **Responsive (verified rule set):** no horizontal page overflow at 375px; use
  `min-w-0` on flex/grid children of constrained containers,
  `grid-cols-[minmax(0,1fr)]` on single-column mobile layouts; long code wraps or
  scrolls inside its own container; tooltips/absolute elements must stay within
  the viewport width (`GlossaryTerm` shifts via `useLayoutEffect` from the
  tooltip's measured box); wide tables scroll inside `overflow-x-auto`.
- **Accessibility:** `aria-current="page"` on the active nav trigger (Topbar
  Reference trigger when a `/reference/*` page is active) and on sidebar chapter
  links; `aria-expanded` on hub module buttons; `aria-live` progress summary;
  `role="status"` quiz feedback; `role="progressbar"` quiz progress; `aria-pressed`
  on quiz options; Escape closes glossary popovers; visible `:focus-visible`
  outline on interactive controls; remount keys on reset so state does not leak.
- **Navigation identity:** `AppShell` strips trailing slashes so active-state
  matching works on SSG trailing-slash variants; mobile nav flattens the Reference
  dropdown into child links (the active child differs from the desktop active
  trigger).
- **Reference dropdown (2026-09-12):** click-controlled, not hover — pointer
  events were removed from `Topbar.astro`. The trigger (`#reference-trigger`,
  `aria-haspopup`/`aria-expanded`/`aria-controls`) toggles the `hidden`
  `#reference-menu[role=menu]`; a script closes it on menu-item/outside click and
  opens/closes on Enter/Space/ArrowDown/Escape with focus management (Escape
  refocuses the trigger). Keyboard-synthetic clicks are guarded with
  `e.detail === 0`. A hover that opens the menu is now an E2E failure (asserted in
  `reference.spec.ts` `E2E-REFERENCE-MENU-POINTER-001`).
- **Heading & page-header rhythm (2026-09-12):** `.chapter-content` headings use
  `:not(:first-child)` margins (h2 `2.75rem/0.6rem`, h3 `2.25rem/0.5rem`,
  h4 `1.75rem/0.4rem`) so a heading never reserves downward spacing it cannot use;
  page headers use `.page-header`/`.page-eyebrow`/`.page-title`/`.page-lead`.
  Island sections (`section.rounded-2xl`: RequestSimulator, WhichIsReal,
  OrderSteps) keep their own `2.25rem` top/bottom rhythm via unlayered
  `.chapter-content section.rounded-2xl` and — because they live inside
  `<astro-island>` wrappers — must always be selected with **descendant** (never
  `> child`) selectors.

---

## 9. Diagram rules

- Diagrams are `client:load` React SVG components: `SchemaDiagram` (3 tables +
  relationships, `/reference/models`) and `MigrationsTimeline` (migrations
  `0001 → 0002 → 0003`, `/reference/migrations`).
- Rules learned from confirmed incidents (Phase 1 diagnosis):
  - **No long labels on short arrows** — text collided with diagram edges.
  - **No rotated essential labels** — model labels must stay horizontally legible.
  - **No fragile absolute offsets** — timeline markers positioned by absolute
    numbers broke across viewports.
- Keep diagrams responsive (viewBox-scaled, `min-w-0` in the surrounding layout);
  a diagram that widens the page at 375px is a failure (visual.spec asserts no
  overflow).
- Diagram verification is behavioral/visual (legibility, overflow, focus), not
  pixel-snapshot based.

---

## 10. Known issues, risks, and verification status

| ID | Area | Description | Status | Evidence | Next verification step |
| --- | --- | --- | --- | --- | --- |
| K1 | Dev server | Astro dev (4788) could not hydrate any island: `SyntaxError: … react-dom/client … does not provide an export named 'createRoot'` | **Fixed and verified on dev + preview** | Phase 1 diagnosis item 5; incident I12; this fix | `optimizeDeps.include` for `react-dom/client` pre-bundles it; re-run `npm run test:e2e:dev` after any dependency/version change |
| K2 | Visual tests | `getComputedStyle` returns `oklch(…)` strings (Chromium); naive regex luminance mis-parses them | Implemented (canvas 1×1 readback resolver), verified in suite | `visual.spec.ts` `colorLuminance`; Phase 2 report | Re-check if/when a second engine is added |
| K3 | Mobile tests | Mobile project runs Chromium (iPhone 13 UA); WebKit binary not installed; real WebKit/Safari behavior unproven | Implemented (Chromium mobile); WebKit unverified | `playwright.config.ts` mobile project; Phase 1 matrix | Install WebKit, or accept Chromium-only mobile |
| K4 | Copy buttons | The copy-to-clipboard feature itself has no e2e assertion (only that it does not break hydration) | Reported, not yet browser-verified | Phase 1 "coverage gaps" | Add an assertion that a copy button appears and copies |
| K5 | Chapter read tracking | `readToEnd` / sidebar markers' persistence across a full reload is not directly e2e-asserted (quiz persistence is) | Implemented, awaiting real-browser verification | Phase 1 "coverage gaps"; `Sidebar.astro` script | Add a reload-persistence test for read markers |
| K6 | Reference nav | "Where am I" in Reference is asserted via the dropdown trigger's `aria-current` (desktop) and child links (mobile) | Implemented, verified in suite | `Topbar.astro`, `reference.spec.ts`, `helpers.ts` | Keep in sync if dropdown UX changes |
| K7 | Dark panels | Unlayered prose colors (`p`/`strong`/`a`) beat ancestor `text-…` on dark panels — the "ghost text" trap | **Fixed via tokens** (2026-09-13): prose colours resolve through `--surface-*` tokens; every dark panel carries `dark-surface`, which overrides them to light values; verified by `visibility.spec.ts` + a full route sweep | `RequestFlow.tsx`, `DockerStack.tsx`, `RequestSimulator.tsx`, `WhichIsReal.tsx`; `global.css` | Re-probe after any dark-panel layout edit |
| K8 | Suite surface | Green runs are against preview 4789 **and** dev 4788 across three Chromium projects (desktop/tablet/mobile); non-Chromium engines unverified | Implemented, verified on preview + dev | Full `npx playwright test` runs (**128 passed on each** — norm updated by the 2026-09-13 dark-surface pass) | Optionally add a study-site CI job; install WebKit if real-Safari behavior matters |
| K9 | Diagrams | Absolute-positioned timeline markers are fragile if edited | Implemented, verified in suite; regression risk | `MigrationsTimeline.tsx`; section 9 | Re-run the mobile visual spec after diagram edits |
| K10 | Glossary tooltip overflow test | `glossary.spec.ts` "tooltip does not overflow the viewport at mobile width" flaked **once** during a full parallel run (2026-09-12) and passed in isolation (twice) and in the next full run | Likely flake (positioning/layout-effect timing under 2-worker load); not a regression, not reproduced | Two isolated re-runs passed; subsequent full runs green | If it flakes again, investigate the `useLayoutEffect` margin-shift timing vs `boundingBox`/`scrollWidth` reads under parallel load |

---

## 11. Mistakes, causes, fixes, and prevention

Every row is labelled **Confirmed** (reproduced by probes/tests), **Likely**
(well-supported inference), or **Reported but unverified** (observed/stated, not
reproduced). Evidence cites `docs/phase1-browser-test-diagnosis.md` ("Phase 1
report") or its Phase 2 section ("P2").

| ID | Mistake or failure | Root cause | Fix status | Prevention rule | Evidence |
| --- | --- | --- | --- | --- | --- |
| I1 | React #418 on pages mounting RequestSimulator / WhichIsReal | Copy-button script appended a button into every `<pre>` at parse time, incl. island `<pre>`s; React aborted hydration | Fix applied (skip `astro-island` `<pre>`), verified | Never mutate SSR DOM inside an island before hydration | Confirmed; Phase 1 cause 1; P2 |
| I2 | Quiz feedback banner only ever showed on the last question | Check-and-advance moved `current` before the banner could read it | Fix applied (`lastChecked` drives the banner), verified | Feedback must reference the just-checked answer after advancing; keep a test asserting the banner on a non-last question | Confirmed; Phase 1 cause 2; P2 |
| I3 | First quiz-hub module could not collapse | `isOpen = openModules[k] ?? (len<=3)`; a click stored the same truthy default | Fix applied (explicit init for every module), verified | Default-true toggles need explicit stored state, not fallbacks | Confirmed; Phase 1 cause 3; P2 |
| I4 | Clicking a glossary term after hover instantly closed it | `mouseenter` opened, then `click` toggled it shut | Fix applied, verified | Test both hover and click paths; a click must open the popover | Confirmed; Phase 1 cause 4; P2 |
| I5 | `/playground` overflowed a 375px viewport (scrollWidth 732→390) | Grid children with intrinsic max-content width; no `min-w-0` / `minmax(0,1fr)` | Fix applied, verified | `min-w-0` + `grid-cols-[minmax(0,1fr)]` on constrained layouts; visual.spec asserts no overflow | Confirmed; P2 probes |
| I6 | Glossary tooltip ran past the right viewport edge on mobile (box x177→94) | No viewport-aware positioning | Fix applied (`useLayoutEffect` margin shift), verified | Tooltips must measure and clamp to the viewport | Confirmed; P2 probes |
| I7 | Contrast metric false-failed on Tailwind v4 `oklch` colors and on the wrong text node | Regex luminance can't parse `oklch(…)`; a `<p>` inherited prose color instead of the panel color | Fix applied (canvas readback + sample the indigo span), verified | Resolve colors through a canvas; assert on the element that actually renders the text | Confirmed; P2 |
| I8 | Playwright locators ambiguous: `.bg-slate-50` matched both the simulator response area and OrderSteps buttons | Bare class selectors over-specified | Fix applied (scope to the simulator `section`, explicit lexemes), verified | Prefer semantic/scoped locators (`page.locator("section", { hasText })`, exact text) | Confirmed; P2 |
| I9 | 30 of 54 failures were WebKit-launch non-results (no WebKit binary) | Mobile project defaulted to WebKit; binary not installed | Fix applied (mobile → installed Chromium), verified | Pin the mobile project to an installed engine | Confirmed; Phase 1 matrix |
| I10 | Reference active-item assertions contradicted the real closed-dropdown UX | Two specs encoded different mental models of the marker | Fix applied (Topbar `aria-current` + `helpers.ts` desktop/mobile expectations), verified | Define nav expectations centrally; encode "desktop trigger vs mobile child" | Confirmed; P2 |
| I11 | Old click-to-mark progress key could leak into the new system | Legacy `study.progress` key + unversioned storage | Fix applied (versioned key; legacy key removed on load), verified | Version + shape-guard persisted state; clear legacy keys | Confirmed; `learning.ts` doc-comment |
| I12 | Dev-server hydration broken (`createRoot` export missing) | `react-dom/client` is shipped as CommonJS but was absent from Vite's dev optimizer pre-bundle set, so `astro dev` served the raw CJS module untransformed and ESM `import { createRoot } from 'react-dom/client'` threw at import time. Preview was unaffected: the Astro production build runs through Rollup with proper CJS/ESM interop, so the defect was dev-only and invisible to static-preview tests | **Fix applied and verified**: `astro.config.mjs` `vite.optimizeDeps.include = ["react", "react-dom", "react-dom/client", "react/jsx-runtime"]`, clear `node_modules/.vite`, restart dev; no other change needed | Never conclude "dev works" from a green preview suite and vice versa. Every future interactive change must pass the full suite on **both** dev and preview (section 12 gate 2). After any dependency upgrade, re-run `npm run test:e2e:dev` on a clean `.vite` cache | Confirmed; reproduced module graph + `_metadata.json`; dev suite 97 passed |
| I13 | First hypothesis blamed the copy-button script for the dev hydration failure | The copy-button script (React #418 on preview) and the dev `createRoot` failure are **two independent causes**: the script mutates SSR DOM before hydration; the dev error is a module-resolution/pre-bundling gap. They co-exist and superficially look like one defect | Cause kept separate; only the true (optimizer) cause was changed for dev; the script fix stayed untouched | When two environments fail, verify each independently before editing — a fix for one can mask the other | Confirmed; dev console showed import-time SyntaxError, not #418 |
| I14 | `VIS-SPACING-PLAYGROUND-001` matched zero sections (`article.chapter-content > section.rounded-2xl` → count 0) | `client:load` islands render inside `<astro-island>` wrappers, so the island root `<section>` is **not** a direct child of the article — a `>` child selector can never match it. A CSS rule for the island rhythm also had to be added (islands lost `my-8` to unlayered `.chapter-content > * + *` once they stopped being direct children) | Fix applied, verified | Use **descendant** selectors for island roots (`.chapter-content section.rounded-2xl`); probe the live DOM before writing structural locators | Confirmed; live DOM probe showed `<astro-island>` wrappers; 14/14 targeted tests then passed |
| I15 | `E2E-GLOSSARY-TERM-001` closed via click, then `hover()` did not reopen the tooltip | The pointer never left the term, so `onMouseEnter` did not re-fire (hovering after a click moves the cursor to the same coordinates) | Fix applied (move the mouse away with `page.mouse.move(0,0)` before hovering), verified | When a test relies on `mouseenter`, ensure the pointer physically leaves the element first | Confirmed; `GlossaryTerm.tsx` mouseenter/mouseleave model |
| I16 | reference.spec reopened the dropdown by clicking the trigger a second time, which **toggled it closed**, then failed to click "Migrations" | The test's mental model assumed clicking the trigger always opens the menu; the implementation toggles | Fix applied (navigate straight to "Migrations" while the menu is open), verified | Model trigger-toggle state explicitly in tests; after an assertion the menu's open/closed state is whatever the toggle left | Confirmed; failure reproduced at the second `trigger.click()` |
| I17 | `VIS-GLOSSARY-COPY-001` fixture chapter `05-alembic-migrations` had no def-terms on page | Chapter 05 imports `GlossaryTerm` but renders no inline `<GlossaryTerm>` (only chapter 01 does) | Fix applied (fixture moved to `/chapters/01-overview`), verified | Confirm the fixture page actually renders the element before asserting its styling | Confirmed; grep showed only imports, no usages |
| I18 | `VIS-SPACING-PLAYGROUND-001` still failed after the CSS rule because the test read margins on the wrong DOM shape | Two issues compounded: the missing island rule and the over-strict locator (I14). The computed `margin-top` on island sections is 36px (2.25rem, unlayered rule beats the layered `my-8`) once the descendant rule/locator are in place | Fixed by the I14 pair of edits | Keep the CSS rule and the test locator consistent about DOM shape | Confirmed; final targeted run 14/14 |

---

## 12. Testing strategy and mandatory acceptance gates

**Setup (verified in `playwright.config.ts` / `helpers.ts`):** spec files in
`tests/e2e/`; base URL `E2E_BASE_URL ?? http://localhost:4789` (static preview);
`timeout 45s`, `expect 10s`, `workers 2`, `retries 0`,
`contextOptions.reducedMotion: "reduce"`; traces/screenshots/videos only on
failure. Projects: `desktop` (Desktop Chrome, 1440×900; ignores `*.mobile.*` and
`visual.spec`), `tablet` (Desktop Chrome, 768×1024; **only** `visual.spec.ts`),
`mobile` (iPhone 13 device, `isMobile`, `hasTouch`, engine **Chromium**;
`*.mobile.*` + `visual.spec.ts`). Spec files: `navigation.spec.ts` (13 routes:
render, nav active marker, breadcrumbs, repo link opens new tab, and no console
error / `pageerror` / failed requests), `navigation.mobile.spec.ts` (same at phone
viewport), `interaction-diagnosis.spec.ts` (islands click-through, glossary
popovers on chapter pages, data-driven: every quiz opens), `playground.spec.ts`
(RequestSimulator switching + outcomes, auth line, WhichIsReal verdicts,
OrderSteps correct/wrong/remove-step), `quiz-card.spec.ts` (correct/wrong/
misconception, prev/next preservation, submit gating, full pass + localStorage
persistence across reload, reset, keyboard-only), `quiz-hub.spec.ts` (counts,
module toggles, deep link, back-to-all, passed/review persistence), `glossary.spec.ts`
(render, hover/click popovers, Escape close, mobile-width overflow),
`reference.spec.ts` (dropdown hover/click, navigation to the three pages, active
marker), `visual.spec.ts` (overflow, topbar stickiness, dark-panel legibility, dark
figure-caption legibility, visible focus — on desktop, tablet, and mobile),
`visibility.spec.ts` (desktop: dark-surface prose legibility on RequestFlow ch 08 +
ch 16, DockerStack env block ch 11, RequestSimulator auth line ch 19; light prose
and migration-timeline guards).

**The single most important rule (quoted from the Phase 1 report; still binding):**

> SSR output, source review, bundle inspection, and successful builds do not prove
> browser interactions work.

Browser tests against the static preview server are the source of truth for this
site's UX. `npm run build` (`astro check` + `astro build`) and type checking are
necessary, never sufficient.

**Mandatory acceptance gates for any study-site change:**
1. `npm run build` passes (`astro check` + `astro build`).
2. Targeted spec(s) run green first, then the full suite `npx playwright test` —
   all three projects green against the preview **and** the dev server (current
   norm: **128 passed, 0 failed on each of preview 4789 and dev 4788**). The dev
   run needs `E2E_BASE_URL=http://localhost:4788` and a dev server started after
   the change with a clean `.vite` cache. This binding dev+preview rule prevents
   the K1/I12 class of dev-only/hydration regressions from ever going unnoticed
   again.
3. Every behavior change is **test-first**: the new/updated test must fail before
   the fix and pass after.
4. Touched routes are clean under `startErrorCollector` (no console error,
   pageerror, failed request) on desktop **and** mobile.
5. No island makes a network call (static contract-only).
6. No horizontal overflow at 375px.
7. Accessibility invariants hold (`aria-current`, `aria-expanded`, labels,
   focus-visible) where the change touches nav or controls.

**2026-09-12 UI-correction pass (gate 3 applied literally):** the nine new/updated
tests — `VIS-SPACING-START-001`, `VIS-SPACING-PLAYGROUND-001`,
`VIS-CONTRAST-SIMULATOR-001`, `E2E-REFERENCE-MENU-POINTER-001`,
`E2E-REFERENCE-MENU-KEYBOARD-001`, `VIS-CODE-PUZZLE-DESKTOP-001`,
`VIS-CODE-PUZZLE-MOBILE-001`, `E2E-GLOSSARY-TERM-001`, `VIS-GLOSSARY-COPY-001`
(the two E2E-REFERENCE IDs are test titles in `reference.spec.ts`; the other seven
live in the new `tests/e2e/ui-corrections.spec.ts`, which runs on the `desktop`
project only) — were run **against the pre-fix preview build first, yielding 10
failures** (the old build's hover menu, missing rhythm/contrast/column rules, and
old glossary signals), then passed 14/14 (these specs plus the rewritten
`reference.spec.ts`) after the fix. Full-suite evidence: **104 passed, 0 failed on
preview 4789 and on dev 4788**; `npm run build` (`astro check` + `astro build`,
30 pages) passes.

---

## 13. Required workflow for every future change

1. Read this `study-site/AGENTS.md`.
2. Read the owning docs (`docs/*.md`) and the relevant specs under `tests/e2e/`
   before writing anything.
3. Make the change **only inside `study-site/`**.
4. If the parent repo changed underneath you, run `npm run sync:code` and confirm
   `src/code-snapshots/_MANIFEST.json` matches the current parent HEAD before
   touching any claim.
5. Add or update a failing browser test for the behavior first (test-first).
6. Run the targeted spec(s) against the preview server until green
   (`npm run preview -- --port 4789`, or set `E2E_BASE_URL`).
7. Run `npm run build` (`astro check` + `astro build`) — it must pass.
8. Run the full suite `npx playwright test` — all projects must be green on the
   preview **and** on the dev server (dev 4788, clean `.vite` cache,
   `E2E_BASE_URL=http://localhost:4788`). Both surfaces are mandatory (gate 2;
   K1/I12).
9. Confirm error collectors on touched routes are clean and no island transmits
   network traffic.
10. Update this file (Change log, Decision log, Known issues / Incidents where
    relevant) and `docs/` if the change is meaningful.
11. Report honestly — never claim "browser-verified" unless the suite actually ran
    green on both the preview server and the dev server.

---

## 14. Change log

Reverse-chronological; dates appear only where the local record contains them.

**2026-09-16 — Folded into the parent repository and pushed to the public GitHub:**
- Changed: `study-site/` was removed from the parent `.gitignore`; the nested git
  repository (`study-site/.git`) was deleted so the parent repo tracks the real
  files; this `AGENTS.md` now states parent-repo ownership (section 1 bullet,
  section 2 boundary 1, D3 superseded by D14). All study-site source files were
  committed and pushed to the parent remote `https://github.com/maverickOG/book-a-slot`.
- Reason: the separate study-site repo is private, so the frontend was not
  accessible; the old AGENTS.md instructions ("own repo / never push into the
  assessment repo") no longer apply and were updated to permit pushing.
- Verification: `git check-ignore` no longer excludes `study-site`; staged files
  inspected to confirm only source is committed (`node_modules/`, `dist/`,
  `.astro/`, and test artifacts stay ignored via `study-site/.gitignore`); no
  parent app/test/migration/Docker/CI files changed.

**2026-09-13 — Dark-surface visibility pass (shared-token fix for "ghost text"):**
- Changed (all under `study-site/`): `src/styles/global.css` — `.chapter-content`
  now carries three surface prose tokens (`--surface-text` slate-700,
  `--surface-strong` slate-900, `--surface-link` indigo-700) and `p` / `strong` /
  `a:not(.btn)` resolve their colour through them; a new unlayered `.dark-surface`
  class overrides the tokens (slate-200 / slate-50 / indigo-300) and sets a light
  base colour. The old one-off `.chapter-content .sim-request-panel p` patch was
  removed (redundant with the token). Markup: `dark-surface` added to the
  RequestFlow detail panel, both DockerStack dark regions (env block + figcaption),
  the RequestSimulator `sim-request-panel`, and the WhichIsReal figcaption.
  `tests/e2e/visibility.spec.ts` (**new**, desktop project, 6 tests).
- Reason: `.chapter-content p` is an UNLAYERED rule, so it beats Tailwind's
  layered `text-*` utilities and inherited light colors on every dark panel:
  RequestFlow detail (ch 08 + ch 16 ×3), DockerStack env block (ch 11) rendered
  slate-700-on-slate-900 — "ghost text" that is present but invisible. Token +
  `.dark-surface` fixes the root cause once per dark surface instead of
  per-element hacks.
- Verification (gate 3 applied literally): the three new dark-panel tests ran
  **against the pre-fix preview build first and failed**, then passed after the
  fix along with the repair of the DockerStack env-block `<p>`; full suite green
  on **both** preview 4789 and dev 4788 — **128 passed, 0 failed on each** (norm
  updated from 122 to 128 by this pass); `npm run build` (`astro check` +
  `astro build`, 30 pages) passes; a luminance sweep across all 15 significant
  routes (both surfaces) found zero dark-surface or light-surface contrast
  anomalies (probe deleted after use).

**2026-09-13 — Quiz bank expanded 52 → 104 questions (all 19 quizzes):**
- Changed (all under `study-site/`): `src/data/quiz.ts` gained exactly 52 new
  questions — one targeted `edit` per quiz (overview +3, architecture +2,
  fastapi +2, database +3, alembic +2, auth +3, rbac +3, booking-flow +3,
  concurrency +3, reviews +2, docker +3, env +3, testing +3, ci +3, api +3,
  lifecycles +3, production +3, teachme +2, interactive +3), each anchored on the
  quiz's last-question tail. Every new question carries `sourceReference`
  grounded in the frozen snapshots / AGENTS facts; two carry `misconception`.
  No component, layout, or test file changed.
- Reason: meet the quiz-bank expansion target (52 → ~104, i.e. +52) so the
  site's self-checks cover the assessment surface more deeply while keeping
  every answer traceable to the real code.
- Verification: per-quiz counts recalculated (19 × target, 104 total — the
  extra `answerIndex` occurrences are the JSDoc example + the `Question`
  interface); `npm run build` passes; targeted specs (`quiz-hub`,
  `quiz-card`, `quiz-persistence`, `interaction-diagnosis`) green 28/28;
  full suite green on **both** preview 4789 and dev 4788 — **122 passed,
  0 failed on each** (norm updated from 104 to 122 by this expansion run).

**2026-09-12 — UI-correction pass completed (spacing/hierarchy, simulator
contrast, code puzzle, glossary copy, click-controlled Reference menu):**
- Changed (all under `study-site/`): `src/styles/global.css` (heading
  `:not(:first-child)` rhythm; `.page-header/.page-eyebrow/.page-title/.page-lead`;
  `.callout`; strengthened `.def-term`; simulator contrast rules on
  `sim-request-panel`/`sim-auth-line`/`sim-response-panel`/`sim-status-pill`;
  `.puzzle-result` inherit; `.chapter-content section.rounded-2xl` island rhythm;
  removed dead `.ref-dropdown:focus-within` CSS); `src/components/ui/Callout.astro`
  (`.callout` class); `src/components/interactive/RequestSimulator.tsx` and
  `src/components/interactive/WhichIsReal.tsx` (dark-panel contrast classes;
  puzzle redesigned as a stacked card grid with one-column mobile layout,
  scrollable `max-h-72` pre, `role="status"` verdict, "Try again" reset);
  `src/components/Topbar.astro` (click-controlled Reference dropdown with
  keyboard support, outside-click close, Escape refocus); the five non-chapter
  pages (`start`, `playground`, `quiz-hub`, `code`, `glossary`), the three
  reference pages, and `ChapterLayout.astro` (page-header classes); glossary intro
  copy replaced with "Browse {glossary.length} terms here. In lessons, highlighted
  terms can be opened for quick definitions."; `tests/e2e/helpers.ts`
  (`colorLuminance` + `ROUTES` shared); `tests/e2e/visual.spec.ts` (imports
  `colorLuminance` from helpers); `tests/e2e/reference.spec.ts` (rewritten to the
  click model; contains the two E2E-REFERENCE-MENU IDs);
  `tests/e2e/ui-corrections.spec.ts` (**new**, 7 tests carrying 9 required IDs).
- Reason: address the confirmed UI-correction list (heading rhythm, page-header
  consistency, dark request-panel contrast, Code Puzzle card layout incl. single
  column at 1440 and no mobile overflow, glossary copy + def-term styling + hover
  wording, and a Reference dropdown that is pointer-event independent) with a
  fail-before-fix/pass-after test contract as requested.
- Verification (see section 12): pre-fix preview build → 10 failures on the new
  specs; post-fix targeted specs → 14/14; full suite → **104 passed, 0 failed on
  preview 4789 and on dev 4788**; `npm run build` passes. The def-term fixture
  uses chapter 01 (chapter 05 imports but never renders a term).
- Not verified: forwarded dev-tunnel URL (unchanged; no tunnel tooling exists
  here — stated plainly, not claimed).

**2026-09-12 — Dev-server hydration defect fixed and both surfaces verified:**
- Changed (all under `study-site/`): `astro.config.mjs` gained
  `vite.optimizeDeps.include = ["react", "react-dom", "react-dom/client",
  "react/jsx-runtime"]` (a comment marks it dev-only). No component, layout, test,
  or spec file changed. Temporary probe scripts under `scripts/` deleted after
  use.
- Reason: `astro dev` (4788) served `react-dom/client` (CommonJS) untransformed
  because it was missing from Vite's optimizer pre-bundle set, so every island
  failed hydration with `SyntaxError: … does not provide an export named
  'createRoot'` — the forwarded dev server the user routes through was broken
  (incident I12). Preview was never affected because the production build uses
  Rollup CJS/ESM interop, which is exactly why green preview suites hid the dev
  defect.
- Verification: reproduced the import-time error on every island page; confirmed
  `react-dom/client` absent from `node_modules/.vite/deps/_metadata.json` before
  the fix and present after; re-probed (zero console errors / pageerrors / failed
  requests on `/`, `/playground`, `/quiz-hub`, `/reference/models`,
  `/chapters/19-interactive-learning`); full suite green on **both** preview 4789
  and dev 4788 — **97 passed, 0 failed on each** — covering quiz-hub
  expand/collapse + Start Quiz, quiz select/check/prev-next/submit/retry/reset,
  RequestSimulator outcomes, Code Puzzle (WhichIsReal) verdicts, OrderSteps
  correct/wrong/remove/reset, Reference dropdown navigation, and Glossary
  hover/click popovers. `npm run build` (`astro check` + `astro build`, 30 pages)
  passes. Copy buttons verified present on all Astro `<pre>` blocks and
  never injected inside hydrated islands on dev.
- Not verified: a forwarded dev-tunnel URL — no tunnel tooling (ngrok/cloudflared/
  localhost.run) or forwarded URL exists in this environment, so tunnel mode is
  **not** claimed as tested. The dev server binds `127.0.0.1`/`[::1]` only; the
  served module graph of the running instance is confirmed repaired (no raw
  `react-dom/client.js?v=` import remains; the fixed process was started after
  the config change).

**2026-09-12 — Phase 2: UI fixes applied and verified** (evidence: report section
"Phase 2 — UI Fixes Applied & Verified (2026-09-12)"):
- Changed (all under `study-site/`): `BaseLayout.astro` (copy-button script skips
  `<pre>` inside `astro-island`); `QuizCard.tsx` (sticky `lastChecked` feedback);
  `QuizHub.tsx` (explicit `openModules` init so every module toggles, incl. the
  first; `passedCount` computed in an effect); `GlossaryTerm.tsx` (hover/click no
  longer conflict; viewport-aware tooltip shift); `RequestSimulator.tsx`
  (`grid-cols-[minmax(0,1fr)]` mobile grid; explicit light text on the dark
  panel); `WhichIsReal.tsx` (`min-w-0` figures); `Topbar.astro` (`aria-current`
  on the Reference trigger when a reference page is active); `playwright.config.ts`
  (mobile project → installed Chromium); `visual.spec.ts` (canvas-resolved
  luminance; samples the actual indigo path text); `playground.spec.ts` (scoped
  simulator section; canonical OrderSteps remove-step sequence); `navigation*.spec.ts`
  and `helpers.ts`, `reference.spec.ts`, `quiz-hub.spec.ts`,
  `interaction-diagnosis.spec.ts` aligned. Temporary probe scripts under `scripts/`
  deleted after use.
- Reason: make the app satisfy the already-defined browser expectations; resolve
  the Phase-1 failures.
- Verification: `npx playwright test` → **97 passed, 0 failed** across
  desktop/tablet/mobile on preview 4789; live DOM probes confirmed geometry fixes
  (scrollWidth 732→390; tooltip right edge 465→382).

**Pre-Phase-2 (dates not recorded in the report; site files dated 2026-09-11/12) —
Phase 1: test harness + diagnosis report:**
- Created the Playwright harness (`tests/e2e/`, `playwright.config.ts`,
  `package.json` test scripts), the 13-route coverage matrix, and
  `docs/phase1-browser-test-diagnosis.md` recording 54 failing / 43 passing tests
  on the preview, five confirmed root causes (copy-button → React #418, QuizCard
  feedback, QuizHub toggle, GlossaryTerm click/hover, dev-only createRoot defect),
  the proposed fix plan, coverage gaps, and the boundary statement.
- Verified: diagnosis only; no app behavior changed. Superseded by Phase 2
  (97/97 green).

**2026-09-11 — Site foundations + first code snapshot** (evidence:
`src/code-snapshots/_MANIFEST.json`, `syncedAt 2026-09-11T10:34:17Z`; app code
`e33d36f`, repo HEAD `740be25`):
- Initial static site, MDX chapter collection, data modules, interactive
  components, and the `npm run sync:code` snapshot of the parent repo.

---

## 15. Decision log

Format per entry: Decision / Reason / Consequences / When to revisit.

### D1 — Astro + MDX + React islands
- **Decision:** Astro 7 SSG with MDX chapters and `client:load` React islands for
  interactivity; Tailwind v4 via `@tailwindcss/vite`.
- **Reason:** static-first (fast, deterministic SSR), islands keep SSG benefits
  where real interactivity is needed, MDX suits a chapter-based study site, and
  Tailwind v4 is the current-stack convention.
- **Consequences:** `client:load` islands must never break the SSR/CSR contract
  (#418-class bugs) or Vite's dev pre-bundle resolution (K1/I12 — fixed via
  `optimizeDeps.include`; still a watch-point after dependency upgrades).
- **When to revisit:** if a page needs server-side data fetching or real
  persistence.

### D2 — Frozen snapshot strategy
- **Decision:** `scripts/sync-code.mjs` copies the parent repo into
  `src/code-snapshots/` at the current commit; `_MANIFEST.json` pins `repoHead`
  and `appCodeLastChanged`; the footer publishes the pins.
- **Reason:** the site must teach the *actual* code, and that code must stay stable
  across study sessions; ad-hoc quoting drifts.
- **Consequences:** claims go stale after parent-repo changes until `npm run
  sync:code` is run; snapshot copies are never hand-edited.
- **When to revisit:** if the parent repo starts changing frequently (re-sync more
  often).

### D3 — Study site hosted in its own GitHub repository
- **Decision:** `study-site/` is version-controlled in its own git repository
  with remote `origin` = `https://github.com/maverickOG/inside-book-a-slot`
  (branch `main`). It is not tracked by the parent assessment repo (root commit
  `740be25` `chore: ignore study site`), so the two histories never mix.
- **Reason:** the assessment deliverables stay in the parent repo; the study site
  is a separate learning aid that must not affect the submission state or parent
  CI, while still being committed and pushed to GitHub like any normal repo.
- **Consequences:** study-site changes are staged, committed, and pushed to
  `origin` on the normal workflow; a clean clone of the parent repo still won't
  contain it; study-site history never goes into the assessment repo.
- **When to revisit:** if the site's remote or repository policy changes.
- **Status:** **SUPERSEDED 2026-09-16 by D14.** Kept for the record; see D14.

### D14 — Study site tracked and pushed inside the parent repository
- **Decision:** `study-site/` is tracked directly in the parent repository
  (`https://github.com/maverickOG/book-a-slot`). The nested git repo (`study-site/.git`)
  was deleted so the parent commits the actual files, and `study-site/` was removed
  from the parent's `.gitignore`.
- **Reason:** the study site's own repo is private, so the built frontend was not
  accessible. Folding the source into the public parent repo makes the frontend
  reachable on GitHub; a gitlink/submodule would have uploaded only a commit
  pointer, not the files.
- **Consequences:** study-site changes are committed and pushed together with the
  parent repo; the parent's CI is unaffected (it never installs node deps); the
  old `inside-book-a-slot` history stays preserved on GitHub but is no longer used.
- **When to revisit:** if the study site is ever moved back to its own repository.

### D4 — Browser-local progress
- **Decision:** learning state lives in `localStorage` under the versioned key
  `inside-book-a-slot.learning.v1`, keyed by chapter, with no backend/accounts.
- **Reason:** the site is static and private; accounts would require infrastructure
  the site intentionally does not have.
- **Consequences:** progress is per-browser/per-device; storage can be cleared;
  version bumps ignore stale data.
- **When to revisit:** if cross-device progress becomes a requirement.

### D5 — Quiz structure
- **Decision:** 19 chapter-scoped quizzes (104 questions, difficulty tiers) with
  mandatory `sourceReference` citations, an 80% pass threshold, monotonic pass
  saving, one shared `QuizCard` (hub and in-chapter modes), a module-grouped hub
  with `?quiz=` deep links.
- **Reason:** quizzes must be answerable from the frozen code alone, and reuse one
  verified component rather than two divergent quiz UIs.
- **Consequences:** every question must cite its snapshot source; hub and chapter
  modes must stay behaviorally identical.
- **When to revisit:** if the quiz count or chapter mapping changes (sidebar and
  hub counts derive from `quiz.ts`).

### D6 — Design system direction
- **Decision:** Tailwind v4 utilities, amber-50/indigo palette, `.chapter-content`
  typography living in `global.css`, `ui/Callout` for note/tip/warn/danger.
- **Reason:** consistent tone for a study guide; utility-first keeps changes local
  and auditable.
- **Consequences:** prose color rules override inheritance on dark panels (K7);
  any new prose styling must respect the existing rules.
- **When to revisit:** if a page needs a distinct visual language.

### D7 — Diagram strategy
- **Decision:** schema and migration timelines as `client:load` React SVG diagrams
  with the section 9 rules (no long labels on short arrows, no rotated essential
  text, no absolute offsets).
- **Reason:** interactive diagrams aid understanding, but only if they survive
  narrow viewports and never distract from the content.
- **Consequences:** diagrams must be re-verified on mobile after edits (K9).
- **When to revisit:** if a new cross-cutting diagram is needed.

### D8 — Code discoverability approach
- **Decision:** raw `src/code-snapshots/**` exposed through the `/code` browser
  (`import.meta.glob` ?raw), curated first-class reference pages
  (`/reference/api|models|migrations`), and every claim grounded in the frozen
  copy.
- **Reason:** "look it up yourself" beats trusting my prose; two surfaces — raw
  files and curated summaries — cover both modes.
- **Consequences:** curated data must be re-synced/checked with the repo; the
  snapshot manifest is the version marker.
- **When to revisit:** if a new reference surface (e.g. env config) becomes
  central.

### D9 — Test-first browser verification requirement
- **Decision:** Playwright on the static preview is the acceptance criterion;
  app fixes satisfy already-written tests or get a failing test first; SSR/build
  output is never the proof.
- **Reason:** the Phase-1 diagnosis proved SSR-verified pages can still be dead in
  the browser; tests encode the intended interaction.
- **Consequences:** every change is slower (test first, full suite at the end) but
  argued from evidence; the 104-test suite is the current regression floor.
- **When to revisit:** only if the project gains a different, stricter verification
  method.

### D10 — Click-controlled Reference dropdown
- **Decision:** the desktop Reference menu opens on **click** (and keyboard), not
  on pointer hover; pointer-event CSS (`group-hover`/`group-focus-within`) was
  removed in favour of an `hidden`-toggle script with outside-click close, Escape
  close + trigger refocus, and a `e.detail === 0` guard so synthetic keyboard
  clicks do not double-toggle.
- **Reason:** the requested correction list asked for a dropdown whose open
  behavior does not depend on pointer events; hover-first menus are also hostile
  to keyboard and touch users.
- **Consequences:** hovering the trigger no longer opens the menu — asserted as a
  negative in `E2E-REFERENCE-MENU-POINTER-001`; `aria-expanded`/`aria-controls`/
  `aria-current` semantics remain on the trigger (K6 intact); mobile flat child
  links unchanged.
- **When to revisit:** if a hover-open variant is ever requested, the two
  E2E-REFERENCE-MENU tests must be reconsidered (they codify click-only).

### D11 — Heading and page-header system
- **Decision:** `.chapter-content` headings use `:not(:first-child)` margin rhythm
  (h2 2.75rem/0.6rem, h3 2.25rem/0.5rem, h4 1.75rem/0.4rem); page headers use the
  `.page-header/.page-eyebrow/.page-title/.page-lead` classes; island sections keep
  a dedicated unlayered `2.25rem` rhythm via `.chapter-content section.rounded-2xl`.
- **Reason:** uniform visual rhythm across prose, pages, and islands; the
  `:not(:first-child)` form keeps section-leading headings (e.g. glossary) from
  acquiring margin below 16px contexts.
- **Consequences:** a heading clone that relies on `* + *` sibling spacing or a
  direct-child `> section` selector will not match islands (they render inside
  `<astro-island>`); the `VIS-SPACING-*` tests enforce 32px+ top margins and the
  descendant selector rule (I14).
- **When to revisit:** if a new page header variant is introduced.

### D12 — Static Request Simulator contrast strategy (superseded by D13)
- **Decision:** legibility on the dark request panel is enforced by explicitly
  coloured wrapper classes (`sim-request-panel p`, `.sim-auth-line`,
  `.sim-response-panel p:not(.sim-status-pill)`, `.sim-status-pill`) that live in
  unlayered CSS so they beat both the layered utilities and the `.chapter-content`
  prose colour rules.
- **Reason:** `.chapter-content` styles `p` directly (the K7 prose-color gotcha),
  so intermediate "light text on the panel" ancestor colours cannot win; an
  explicit element-level rule is the only reliable lever, and a canvas-readback
  test (`VIS-CONTRAST-SIMULATOR-001`) proves the rendered colour.
- **Consequences:** any future dark panel must follow the same pattern (scoped,
  element-level, unlayered) rather than relying on an ancestor's `text-…` class.
- **When to revisit:** if the simulator layout is redesigned and the scoped
  classes are renamed (update the tests in the same change).
- **Status:** superseded 2026-09-13 by D13 — the panels now use the shared
  `dark-surface` token scope (`.sim-auth-line` / `.sim-response-panel p:not(.sim-status-pill)` /
  `.sim-status-pill` survive as secondary-tone refinements on top of it).

### D13 — Shared surface-prose tokens (`--surface-text/-strong/-link`) + `dark-surface` scope
- **Decision:** `.chapter-content` prose colours resolve through CSS custom
  properties (`--surface-text` slate-700, `--surface-strong` slate-900,
  `--surface-link` indigo-700, holding the exact light-surface values); an
  unlayered `.dark-surface` class overrides the three tokens to slate-200 /
  slate-50 / indigo-300 and sets `color: var(--surface-text)`. Every dark panel
  (RequestFlow, DockerStack env + figcaption, RequestSimulator request panel,
  WhichIsReal figcaption) carries `dark-surface`; the one-off
  `.sim-request-panel p` rule was removed as redundant.
- **Reason:** the root cause of "ghost text" is that unlayered `.chapter-content p`
  beats layered utilities and inherited light colors on every dark panel — three
  components were broken, not one. Tokens fix the root cause once so any future
  dark surface is correct just by adding one class; light surfaces are
  byte-identical because the token defaults equal the old values.
- **Consequences:** new dark surfaces must add `dark-surface` (never a bare
  ancestor `text-…` utility); `visibility.spec.ts` (three fail-first dark-panel
  tests + two light-surface guards + one timeline guard) enforces both sides of
  the contract on the desktop project.
- **When to revisit:** if a genuinely light-on-light or dark-on-dark design
  surface is introduced that contradicts the default token values.

---

## 16. Update protocol

1. **This file is the persistent context for agents working on `study-site/`.**
   Read it before any change; update it after any meaningful change.
2. Record changes in section 14 (Change log), new decisions in section 15
   (Decision log), new failures in section 11 (Incidents), and new risks in
   section 10 (Known issues). Keep every item evidence-based and status-labelled
   per section 1.
3. Keep this file aligned with `docs/*.md`, `package.json`, `astro.config.mjs`,
   `playwright.config.ts`, and `src/code-snapshots/_MANIFEST.json`. If those
   change, say so here.
4. Never delete historical incident/decision records; superseded entries stay with
   a pointer to the record that superseded them (Phase 1 is superseded by Phase 2,
   not deleted).
5. Verify before claiming: a change is "verified" only when the full suite ran
   green on the preview server (or the local record says otherwise).
6. If a future attempt fails, record it here (Problem / Cause / Fix / Prevention)
   instead of letting the failure resurface silently.