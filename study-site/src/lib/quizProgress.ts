/**
 * Browser-local persisted quiz-attempt records.
 *
 * Independent of the learning store: this holds the per-quiz working record
 * (selections, checked answers, score, position) so an in-progress or finished
 * quiz can be reopened exactly where it was left. The learning store still owns
 * the monotonic "quiz passed" marker for the sidebar.
 *
 * Versioned key: "inside-book-a-slot.quiz.v1" — bump the version if the shape
 * ever changes so stale persisted data is ignored instead of misread.
 *
 * Nothing here ever touches the network. Persistence is localStorage only.
 */

export const QUIZ_KEY = "inside-book-a-slot.quiz.v1";
export const QUIZ_EVENT = "quiz:changed";

export interface QuizRecord {
  /** Question index -> chosen option index. */
  selected: Record<number, number>;
  /** Question indexes that have been checked (judged). */
  checked: number[];
  /** True once the attempt has been submitted for a score. */
  submitted: boolean;
  /** Score at submit time: correct / total, 0..1. */
  score: number;
  correctCount: number;
  /** Last question index the user was on. */
  current: number;
  /** How many times the quiz has been submitted. */
  attempts: number;
  updatedAt: number;
}

export interface QuizProgressState {
  version: "v1";
  quizzes: Record<string, QuizRecord>;
}

export function emptyRecord(): QuizRecord {
  return {
    selected: {},
    checked: [],
    submitted: false,
    score: 0,
    correctCount: 0,
    current: 0,
    attempts: 0,
    updatedAt: 0,
  };
}

function isV1(value: unknown): value is QuizProgressState {
  return (
    !!value &&
    typeof value === "object" &&
    (value as QuizProgressState).version === "v1" &&
    typeof (value as QuizProgressState).quizzes === "object"
  );
}

export function loadQuizProgress(): QuizProgressState {
  if (typeof window === "undefined") return { version: "v1", quizzes: {} };
  try {
    const raw = window.localStorage.getItem(QUIZ_KEY);
    if (!raw) return { version: "v1", quizzes: {} };
    const parsed: unknown = JSON.parse(raw);
    if (!isV1(parsed)) return { version: "v1", quizzes: {} };
    return parsed;
  } catch {
    return { version: "v1", quizzes: {} };
  }
}

function save(state: QuizProgressState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUIZ_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode, quota). Progress just won't persist.
  }
}

function dispatch(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(QUIZ_EVENT));
  }
}

export function loadQuiz(quizId: string): QuizRecord | undefined {
  return loadQuizProgress().quizzes[quizId];
}

export function saveQuiz(quizId: string, record: QuizRecord): void {
  if (!quizId) return;
  const state = loadQuizProgress();
  state.quizzes[quizId] = record;
  save(state);
  dispatch();
}

/** Delete one quiz's record. Returns true if a record was removed. */
export function resetQuiz(quizId: string): boolean {
  const state = loadQuizProgress();
  if (!(quizId in state.quizzes)) return false;
  delete state.quizzes[quizId];
  save(state);
  dispatch();
  return true;
}

/** Delete every quiz record. Returns true if anything was cleared. */
export function resetAllQuizzes(): boolean {
  const state = loadQuizProgress();
  const had = Object.keys(state.quizzes).length > 0;
  if (!had) return false;
  save({ version: "v1", quizzes: {} });
  dispatch();
  return true;
}