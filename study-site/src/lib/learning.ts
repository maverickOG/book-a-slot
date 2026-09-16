/**
 * Browser-local persisted learning state.
 *
 * Versioned key: "inside-book-a-slot.learning.v1" — bump the version if the
 * shape ever changes so stale persisted data is ignored instead of misread.
 *
 * State is keyed by chapter id and tracks four distinct concepts:
 *   - opened      : the chapter page was visited at least once
 *   - readToEnd   : the reader reached the meaningful end of the chapter content
 *   - quizPassed  : the chapter's quiz was passed at the 80% threshold
 *   - mastered    : readToEnd AND quizPassed (computed, never set directly)
 *
 * Nothing here ever touches the network. Persistence is localStorage only.
 */

export const LEARNING_KEY = "inside-book-a-slot.learning.v1";
export const LEARNING_EVENT = "learning:changed";
export const PASS_THRESHOLD = 0.8;

/** The old click-to-mark mechanism's key; cleared so it can never interfere. */
const OLD_KEY = "study.progress";

export interface ChapterLearning {
  opened: boolean;
  readToEnd: boolean;
  quizPassed: boolean;
  mastered: boolean;
  updatedAt: number;
}

export interface LearningState {
  version: "v1";
  chapters: Record<string, ChapterLearning>;
}

export function emptyChapter(): ChapterLearning {
  return { opened: false, readToEnd: false, quizPassed: false, mastered: false, updatedAt: 0 };
}

function emptyState(): LearningState {
  return { version: "v1", chapters: {} };
}

function isV1(value: unknown): value is LearningState {
  return (
    !!value &&
    typeof value === "object" &&
    (value as LearningState).version === "v1" &&
    typeof (value as LearningState).chapters === "object"
  );
}

export function loadLearning(): LearningState {
  if (typeof window === "undefined") return emptyState();
  try {
    // Remove the old broken mechanism's key if it is still around.
    window.localStorage.removeItem(OLD_KEY);
    const raw = window.localStorage.getItem(LEARNING_KEY);
    if (!raw) return emptyState();
    const parsed: unknown = JSON.parse(raw);
    if (!isV1(parsed)) return emptyState();
    return parsed;
  } catch {
    return emptyState();
  }
}

export function saveLearning(state: LearningState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LEARNING_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode, quota). Progress just won't persist.
  }
}

function chapterOf(state: LearningState, id: string): ChapterLearning {
  if (!state.chapters[id]) {
    state.chapters[id] = emptyChapter();
  }
  return state.chapters[id];
}

function recomputeMastered(state: LearningState): void {
  for (const c of Object.values(state.chapters)) {
    c.mastered = c.readToEnd && c.quizPassed;
  }
}

function persist(state: LearningState): void {
  recomputeMastered(state);
  saveLearning(state);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LEARNING_EVENT));
  }
}

/** Mark that a chapter was opened (visited). Opening is NOT completion. */
export function markOpened(id: string): void {
  const state = loadLearning();
  const c = chapterOf(state, id);
  if (!c.opened) {
    c.opened = true;
    c.updatedAt = Date.now();
    persist(state);
  }
}

/** Mark that a chapter was read to its meaningful end. Pure scroll-based detecting. */
export function markReadToEnd(id: string): void {
  const state = loadLearning();
  const c = chapterOf(state, id);
  if (!c.readToEnd) {
    c.readToEnd = true;
    c.opened = true;
    c.updatedAt = Date.now();
    persist(state);
  }
}

/** Set quiz pass state for a chapter. Monotonic: once passed stays passed. */
export function markQuizPassed(id: string): void {
  const state = loadLearning();
  const c = chapterOf(state, id);
  if (!c.quizPassed) {
    c.quizPassed = true;
    c.opened = true;
    c.updatedAt = Date.now();
    persist(state);
  }
}

/**
 * Clear the quiz pass marker for one chapter. Used by a per-quiz reset so a
 * reset attempt no longer keeps the "passed" badge (reset is not
 * pass-preserving). Recomputes mastered from the remaining flags.
 */
export function clearQuizPassed(id: string): void {
  const state = loadLearning();
  const c = state.chapters[id];
  if (c?.quizPassed) {
    c.quizPassed = false;
    c.updatedAt = Date.now();
    persist(state);
  }
}

/**
 * Clear the quiz pass markers for many chapters at once. Used by the hub's
 * "Reset all quiz progress" action. Returns true if anything changed.
 */
export function clearQuizPassedIn(ids: string[]): boolean {
  const state = loadLearning();
  let changed = false;
  for (const id of ids) {
    const c = state.chapters[id];
    if (c?.quizPassed) {
      c.quizPassed = false;
      c.updatedAt = Date.now();
      changed = true;
    }
  }
  if (changed) persist(state);
  return changed;
}

/** Chapters that were read to the end. */
export function readCount(state: LearningState): number {
  return Object.values(state.chapters).filter((c) => c.readToEnd).length;
}

/** Chapters whose quiz is passed (only meaningful for the 19 quiz chapters). */
export function quizPassedCount(state: LearningState, chapterIds: string[]): number {
  return chapterIds.filter((id) => state.chapters[id]?.quizPassed).length;
}

/** Chapters that are mastered (read to end AND quiz passed). */
export function masteredCount(state: LearningState): number {
  return Object.values(state.chapters).filter((c) => c.mastered).length;
}

/** Clear all persisted learning state. Returns true if anything was cleared. */
export function resetAllLearning(): boolean {
  if (typeof window === "undefined") return false;
  const had = window.localStorage.getItem(LEARNING_KEY) !== null;
  try {
    window.localStorage.removeItem(LEARNING_KEY);
  } catch {
    // ignore
  }
  if (had) {
    window.dispatchEvent(new Event(LEARNING_EVENT));
  }
  return had;
}