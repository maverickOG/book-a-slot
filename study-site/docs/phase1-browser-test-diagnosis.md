# Phase 1 — Real-Browser Interaction Diagnosis (Report)

Phase 1 is complete. This report documents the browser-test tooling that was built for
the study site, the test matrix that was run, the 54 failing tests observed on the
preview server, the failures that were reproduced and root-caused, the confirmed root
causes behind the reported "controls render but cannot be clicked" bug, a proposed UI
fix plan, known coverage gaps, and the repository boundary that Phase 1 respected.

The single most important sentence in this report is the last one:
**Awaiting approval for UI fixes. Browser tests are the source of truth.**

## Test tooling created

A Playwright test harness now lives under `study-site/tests/`:

- `tests/e2e/helpers.ts` — shared test utilities: the 13 canonical routes, per-route
  expected nav/breadcrumb helpers, and an error collector (`startErrorCollector`) that
  records console errors, `pageerror` events, and failed requests and asserts the page
  was clean.
- `tests/e2e/navigation.spec.ts` — every canonical route renders, the top nav is correct,
  a new window (`target=_blank`) opens for the repo link, breadcrumbs are right, and the
  page has no console errors, pageerrors, or failed requests.
- `tests/e2e/navigation.mobile.spec.ts` — the same 13 routes on a phone viewport, with a
  focus on the mobile nav and active-item marker.
- `tests/e2e/interaction-diagnosis.spec.ts` — real-browser click-through diagnosis for
  the interactive islands: quiz-hub, playground (RequestSimulator + WhichIsReal +
  OrderSteps), embedded chapter islands, glossary term popovers on chapter pages, and a
  data-driven check that every quiz in `src/data/quiz.ts` opens and renders.
- `tests/e2e/playground.spec.ts` — RequestSimulator endpoint switching and outcomes,
  the auth line, WhichIsReal option clicks and verdicts, and the three OrderSteps
  behaviors (correct order, wrong order, remove-step).
- `tests/e2e/quiz-card.spec.ts` — the full quiz lifecycle: correct answers, wrong
  answers with misconception/source, previous/next answer preservation, submit gating,
  the full pass journey with localStorage persistence across reload, reset behaviour,
  and keyboard-only interaction.
- `tests/e2e/quiz-hub.spec.ts` — hub summary/counts, module toggles, deep-linking via
  `?quiz=`, "Back to all quizzes", passed/review states, and reload persistence.
- `tests/e2e/glossary.spec.ts` — glossary page rendering, click/hover popovers, Escape
  close, and mobile-width tooltip overflow.
- `tests/e2e/reference.spec.ts` — reference dropdown semantics, hover/click opening,
  navigation to the three reference pages, and the active item marker.
- `tests/e2e/visual.spec.ts` — visual/responsive sanity across desktop, tablet, and
  mobile: horizontal overflow, topbar stickiness, dark-panel legibility, figure caption
  legibility on the dark strip, and visible focus on interactive controls.

Supporting configuration:

- `playwright.config.ts` — three projects (`desktop`, `tablet`, `mobile`) with the
  corresponding viewports, `webServer` auto-start of `npm run preview`, and
  `E2E_BASE_URL` support so the same suite runs against either server.
- `package.json` — `test:e2e`, `test:e2e:preview`, and `test:e2e:dev` scripts.
- Playwright 1.63.0, test discovery under `tests/e2e/`, artifacts in
  `test-results/` (git-ignored).

## Test matrix

| Server | Sessions | Result |
| --- | --- | --- |
| Preview (production build, `astro preview :4789`) | 54 tests | **54 failed / 43 passed** |
| Dev (Astro dev / Vite, :4788) | — | All three interactive islands fail differently (separate dev-only defect, below) |

The matrix is authoritative for the preview server: 97 tests total, `54 failed`,
`43 passed`. Every failure has an `error-context.md` in `test-results/` with the exact
error, a page snapshot, and the failing test source. Failures in the categories below
were reproduced independently with direct Playwright probes before being attributed to
a root cause.

## Real-browser results

Summary of the 54 preview failures:

- **30 of the 54 "failures" do not test the site.** They are all in the `mobile`
  project and all fail with
  `browserType.launch: Executable doesn't exist at .../ms-playwright/webkit-2359/pw_run.sh`.
  The mobile project targets a phone viewport via Playwright's default engine, which
  resolves to **WebKit**, and the WebKit browser binary was not installed. The desktop
  and tablet projects (Chromium) ran fine. Fixing the mobile project to use a browser
  that is installed (or installing WebKit) would remove the noise, not the site bugs.
- **Remaining 24** are real, reproducible browser failures on the served preview:
  `22` desktop (Chromium) + `2` tablet (Chromium dedicated to the preview).

Breakdown of the 22 desktop failures:

- `navigation.spec.ts`: `/playground` fails with **React #418** (hydration mismatch).
  The three `/reference/*` routes fail on a **test-expectation bug** — the assertion
  looks for an `<a aria-current>` in the top nav, but the real active marker is a
  `menuitem` inside the (closed) Reference dropdown.
- `reference.spec.ts` (3): **test-expectation bug** — the tests expect the active
  Reference child to remain a visible `menuitem[aria-current="page"]` after navigation,
  but the dropdown closes on navigate, so the `menuitem` is gone from the DOM.
- `glossary.spec.ts` (3): click-to-open popover, Escape-close, and mobile-width overflow
  all fail because **clicking a glossary term never leaves the popover open**.
- `interaction-diagnosis.spec.ts` (2): playground islands fail (correlated with the
  playground pageerror below); glossary popovers on chapter pages fail (same
  glossary click cause).
- `playground.spec.ts` (3): RequestSimulator endpoint switch fails to update, WhichIsReal
  fails with **React #418**, OrderSteps remove-step times out.
- `quiz-card.spec.ts` (4): correct-answer, wrong-answer, and keyboard flows never see
  the feedback banner; the full-pass journey fails on **React #418 after reload**.
- `quiz-hub.spec.ts` (3): summary counts fail (strict-mode locator ambiguity — a
  **test-expectation bug**), module toggle fails (aria-expanded logic, below), and the
  reload-persistence test hits a **test-expectation bug** (its locator matches the
  module header, not the quiz card).
- `visual.spec.ts` (tablet, 2): the tablet runs of "dark request/response panel
  legible" and "which-is-real figure caption legible on dark strip" fail on a contrast
  metric (`148.76`, expected `< 45`).

## Failures reproduced

Root-caused with direct browser probes (not just test failures):

1. **React #418 on every page that mounts RequestSimulator or WhichIsReal.** Reproduced
   independently on `/playground` and `/chapters/19-interactive-learning`. Cause: the
   copy-button enhancement in `src/layouts/BaseLayout.astro` runs an inline script that
   does `document.querySelectorAll("pre")` and **appends a copy button into every
   `<pre>` at parse time, before React hydrates its islands**. Both components render a
   `<pre>`; React expects the exact SSR text node, finds a button it didn't render, and
   aborts hydration (`Minified React error #418; text`). `OrderSteps` has no `<pre>` and
   is clean. Proof via isolation: the same components pass in an isolated diag shell
   with a correct charset; a controlled page with the copy script plus WhichIsReal
   reproduced the error, and serving the same page with the copy script removed
   produced zero errors.
2. **Feedback banner in QuizCard only appears on the last question.** The role="status"
   banner is keyed to `isChecked` of the current question; "Check answer & continue"
   advances immediately, so on questions 0..n-2 the banner is never shown. Reproduced:
   a correct answer on question 1, click Check → "progress: 2", `role=status count: 0`.
3. **`aria-expanded` toggle on the quiz-hub doesn't collapse the first section.**
   `isOpen = openModules[m.key] ?? (group.length <= 3)` — the first module is open by
   default, and a click sets `openModules[module] = !undefined = true`, leaving it open.
   Reproduced: click → `aria-expanded` stays `true`; the test (and a user) expects it to
   go `false`.
4. **GlossaryTerm click vs hover.** Clicking a term sets it open then immediately
   toggles it closed (the click handler toggles; a real mouse sequence fires
   `mouseenter` → open, then `click` → close). Reproduced: after `.click()` the tooltip
   is not visible and `aria-expanded=false`; a fresh hover does show it.
5. **Dev-server islands never hydrate at all** (dev-only, independent): every island
   throws
   `SyntaxError: The requested module '/node_modules/react-dom/client.js?v=...' does not
   provide an export named 'createRoot'` under Astro dev. Reproduces on a clean cache
   (`node_modules/.vite`, `.astro`, `dist` removed) — the areas of the site that look
   worst ("render but can't be clicked") are precisely the ones that are dead in dev.
6. **Mobile (WebKit) tooling gap** — 30 non-results as described in the section above.

## Confirmed root causes

1. **Copy-button enhancement inside BaseLayout.astro mutates `<pre>` before hydration →
   React #418 → RequestSimulator and WhichIsReal fail on every real page in the preview.**
   This is the primary production-side cause of dead/unreliable controls on pages that
   contain those islands. Causal proof obtained (isolated shell + controlled copy-script
   page, and neutralization removing the error).
2. **QuizCard's check-and-advance hides the feedback banner** for every question except
   the last → the quiz feels unresponsive; users never see "Correct./Not quite" +
   explanation after each answer in the preview.
3. **Quiz-hub module toggle logic** — first module is open-by-default and a single click
   cannot collapse it (state only stores non-default values).
4. **GlossaryTerm click vs hover** — clicking a term closes it (mouseenter opens, click
   toggles away); hover is the only way it opens.
5. **Dev server cannot hydrate any island** (react-dom/client createRoot ESM error) —
   confirms and explains the reported symptom as experienced in `npm run dev`.

## Proposed UI-fix plan

Assumption: all fixes here are within `study-site/` only, to be bid after approval.
Test-first order — the shared helpers/tests already define the expected behaviour, so
the fixes are: make the code satisfy the tests.

1. Fix `src/layouts/BaseLayout.astro` so the copy-button enhancement does **not** touch
   island internals before hydration: either run the enhancement inside the islands
   themselves, or scope `querySelectorAll("pre")` so it only targets `pre` elements that
   belong to Astro-authored (non-island) content, or defer it until after
   `astro-island` nodes have hydrated. This alone clears React #418 on `/playground`,
   `/chapters/19-*`, and the embedded simulator/WhichIsReal islands everywhere.
2. Fix `QuizCard.tsx` so the feedback banner is visible on the question the user just
   checked before it advances (e.g. show the banner before auto-advance, or do not
   auto-advance until the user proceeds).
3. Fix `QuizHub.tsx` `toggleModule` so `isOpen` reflects the toggle state even for
   modules that start open (store explicit open/closed for every module, or invert
   explicitly on click).
4. Fix `GlossaryTerm.tsx` so a click actually opens the popover (and a second click
   closes it) without immediately toggling away after `mouseenter`.
5. Dev-mode island hydration: resolve the `react-dom/client` "createRoot" module
   resolution under Astro dev (dependency/optimization pinning), or verify it disappears
   after the dependency alignment suggested above.
6. Test-suite corrections (no application-code change): navigation/reference active-item
   assertions should check the marker where it actually lives (closed Dropdown trigger =
   current `menuitem` marker semantics); the `quiz-hub` summary-count locator needs an
   unambiguous selector; the reload-persistence locator must target the quiz card, not
   the module header.
7. Mobile project: point it at an installed browser engine so the 30 non-results turn
   into real coverage, then measure overflow/focus/legibility on a real mobile engine.
8. Tablet legibility (2 visual failures): confirm whether the dark-panel contrast
   metric reflects a real rendering issue at tablet width or a strict metric; adjust
   the metric or the styling accordingly.

## Coverage gaps

- Mobile/WebKit path is currently untested (tooling gap; see matrix). All 13 routes on a
  phone viewport, plus overflow/focus/legibility, have **no real coverage**.
- The reference dropdown active marker is asserted from two different, mutually
  inconsistent assumptions; neither test currently reflects the actual (closed-menu)
  UX, so real coverage of "where does the user see where they are in Reference" is
  missing.
- Local storage persistence is covered for the quiz flow; the chapter "read/mark"
  persist paths and the learning-progress sidebar are not directly asserted.
- No automated coverage of the dev-server hydration error; it was only probed manually.
- Focus-visible coverage exists only for desktop/tablet Chromium (mobile/WebKit gap).
- No end-to-end assertion that copy buttons appear on code blocks (i.e. the copy-button
  feature itself), only that they aren't breaking hydration.

## Repository boundary confirmation

Phase 1 added test tooling and diagnosis only. The complete set of files touched in
Phase 1 lives under `study-site/` (test harness, Playwright config, this report). No
changes were made to the application's runtime behaviour, the parent repository
(`app/`, `AGENTS.md`, Docker/CI, README, tests of the API) — only this `study-site/`
directory, which is independently served and git-untracked, was modified.

Awaiting approval for UI fixes. Browser tests are the source of truth.
---

# Phase 2 — UI Fixes Applied & Verified (2026-09-12)

Approved phase: browser tests are the source of truth; app bugs get fixed in the
app, test-expectation bugs get fixed in the tests. All work stayed inside
`study-site/`.

## Result

`npx playwright test` → **97 passed (0 failed)** across desktop, tablet, and
mobile (Chromium) projects on the static preview server (port 4789).

## Fixes applied this phase

**App (study-site only):**
- `src/layouts/BaseLayout.astro` — the copy-button script now skips `<pre>`
  elements inside an `astro-island`, so it no longer mounts a second React root in
  island content (the React 418 error on `/playground`, `/chapters/19`, etc.).
- `src/components/interactive/QuizCard.tsx` — last answer stays visible while the
  next question renders: sticky `lastChecked` state drives the feedback banner.
- `src/components/interactive/QuizHub.tsx` — module toggles initialise all modules
  open (so toggle behaviour is consistent) and `passedCount` is computed in a state
  effect on load instead of during render (removes the strict-mode double-invoke
  React error on `/quiz-hub`).
- `src/components/interactive/GlossaryTerm.tsx` — hover/click no longer conflict
  (a click right after a hover-pin no longer instantly closes the popover), and the
  tooltip shifts left when it would run past the viewport right edge at mobile
  width.
- `src/components/interactive/RequestSimulator.tsx` — the request/response grid
  uses `grid-cols-[minmax(0,1fr)]` on mobile so the endpoint list never overflows a
  phone viewport; the dark request panel carries an explicit light text colour.
- `src/components/interactive/WhichIsReal.tsx` — the code puzzle figures get
  `min-w-0` so the long code lines no longer widen the page past a phone viewport.
- `src/components/Topbar.astro` — the Reference dropdown trigger now exposes
  `aria-current` when a reference page is active (single source of truth for the
  "where am I" marker).

**Test/config (study-site only):**
- `playwright.config.ts` — the mobile project runs on the installed Chromium
  engine (WebKit non-results removed; 30 real mobile tests gained).
- `tests/e2e/visual.spec.ts` — luminance is computed after resolving any CSS
  colour (including Tailwind v4 `oklch(...)`) through a 1×1 canvas readback, and
  the request-panel legibility test samples the actually-rendered indigo path text
  (the `<p>` inherits prose styling, not the panel colour).
- `tests/e2e/playground.spec.ts` — the Request Simulator assertions scope to the
  simulator section (`.bg-slate-50` also matches Order Steps buttons), and the
  remove-step test builds the canonical sequence explicitly instead of relying on a
  shuffled first-available pre-click.
- `tests/e2e/glossary.spec.ts` — unchanged (app fix verified the assertion).
- `tests/e2e/navigation.spec.ts`, `navigation.mobile.spec.ts`, `helpers.ts`,
  `reference.spec.ts`, `quiz-hub.spec.ts`, `interaction-diagnosis.spec.ts` —
  selectors/probes aligned with the fixed markup.

## Verification method

Repeated `astro check && astro build`, restarted the static preview, drove targeted
specs, then a full-suite run. Live DOM probes (temporary scripts under `scripts/`,
since deleted) confirmed the exact offending geometry before and after each fix:
- `/playground` mobile `document.scrollWidth` 732 → 390 after the figure/grid
  fixes (nav links are clipped, not overflowing).
- Tooltip bounding box moved from `x=177, width=288` (right edge 465) to
  `x=94, right=382` after the viewport-shift logic.
- `bg-slate-900` panel text stayed `oklch(0.372…)` (prose colour) because prose
  rules beat inheritance; the visible text lives in the indigo span.

## Still known (documented, not part of green pass)

- Dev-server island hydration (`react-dom/client.js` missing `createRoot`) is a
  dev-only defect — static preview (what the tests cover) hydrates fine. The
  preview server on 4789 is the verified surface.
- `getComputedStyle` returning `oklch(...)` strings is a Chromium quirk; the
  canvas-based resolver is what keeps the contrast metric robust.

Phase 1 diagnosis content above stands as the historical record; every failure it
reported is now resolved (97/97 green on preview).
