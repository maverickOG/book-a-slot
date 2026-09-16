import { useEffect, useMemo, useRef, useState } from "react";
import { quizzes } from "../../data/quiz";
import { clearQuizPassed, LEARNING_EVENT, loadLearning, markQuizPassed, PASS_THRESHOLD } from "../../lib/learning";
import { emptyRecord, loadQuiz, resetQuiz, saveQuiz, type QuizRecord } from "../../lib/quizProgress";

export function readQuizPassed(chapter: string): boolean {
  return !!chapter && !!loadLearning().chapters[chapter]?.quizPassed;
}

export default function QuizCard({
  quizId,
  chapter,
}: {
  quizId: string;
  chapter?: string;
}) {
  const quiz = quizzes.find((q) => q.id === quizId);

  const [selected, setSelected] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState<Set<number>>(() => new Set());
  const [submitted, setSubmitted] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [passed, setPassed] = useState(false);
  const [current, setCurrent] = useState(0);
  const [lastChecked, setLastChecked] = useState<number | null>(null);

  // Mirror of the persisted record, kept so mutations can merge partial changes.
  const recordRef = useRef<QuizRecord | null>(null);

  // Restore any saved record for this quiz after hydration. The initial states
  // stay empty so SSR and the first client render are identical.
  useEffect(() => {
    if (!quiz) return;
    const saved = loadQuiz(quiz.id);
    if (saved) {
      recordRef.current = saved;
      setSelected(saved.selected);
      setChecked(new Set(saved.checked));
      setSubmitted(saved.submitted);
      setCurrent(Math.min(saved.current, Math.max(quiz.questions.length - 1, 0)));
      setAttempt(saved.attempts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  useEffect(() => {
    if (!quiz) return;
    const id = chapter ?? quiz.chapter;
    setPassed(readQuizPassed(id));
    const onLearning = () => setPassed(readQuizPassed(id));
    window.addEventListener(LEARNING_EVENT, onLearning);
    return () => window.removeEventListener(LEARNING_EVENT, onLearning);
  }, [quiz, quizId, chapter]);

  const chapterId = chapter ?? quiz?.chapter ?? "";
  const total = quiz?.questions.length ?? 0;

  const persist = (patch: Partial<QuizRecord>) => {
    if (!quiz) return;
    const base = recordRef.current ?? emptyRecord();
    const next: QuizRecord = { ...base, ...patch, updatedAt: Date.now() };
    recordRef.current = next;
    saveQuiz(quiz.id, next);
  };

  const isChecked = useMemo(() => checked.has(current), [checked, current]);
  const isSelected = selected[current] !== undefined;

  const correctCount = useMemo(() => {
    if (!quiz) return 0;
    return quiz.questions.reduce((n, q, i) => n + (selected[i] === q.answerIndex ? 1 : 0), 0);
  }, [quiz, selected]);

  const score = total > 0 ? correctCount / total : 0;
  const passedNow = score >= PASS_THRESHOLD;

  const allChecked = useMemo(() => {
    if (!quiz) return false;
    return quiz.questions.every((_, i) => checked.has(i));
  }, [quiz, checked]);

  const nextQuestion = () => {
    if (current < total - 1) {
      const next = current + 1;
      setCurrent(next);
      persist({ current: next });
    }
  };

  const prevQuestion = () => {
    if (current > 0) {
      const next = current - 1;
      setCurrent(next);
      persist({ current: next });
    }
  };

  const submitQuiz = () => {
    if (!quiz || !allChecked) return;
    const attempts = (recordRef.current?.attempts ?? 0) + 1;
    setSubmitted(true);
    persist({ submitted: true, score, correctCount, attempts });
    if (passedNow && !readQuizPassed(chapterId)) {
      markQuizPassed(chapterId);
    }
  };

  const resetAttempt = () => {
    if (!quiz) return;
    // A reset is not pass-preserving: clear the saved record and, if this quiz
    // was marked passed, revoke that marker too.
    resetQuiz(quiz.id);
    if (readQuizPassed(chapterId)) {
      clearQuizPassed(chapterId);
    }
    recordRef.current = null;
    setSelected({});
    setChecked(new Set());
    setSubmitted(false);
    setCurrent(0);
    setLastChecked(null);
    setAttempt((n) => n + 1);
  };

  if (!quiz) return <p className="text-sm text-slate-500">No quiz for "{quizId}".</p>;

  const optionLabel = (oi: number) => `Option ${String.fromCharCode(65 + oi)}`;

  // ----- Saved results view -------------------------------------------------
  if (submitted) {
    return (
      <section className="my-8 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Self-check · {quiz.title}
          </h4>
          {passedNow ? (
            <span className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-800">
              <span aria-hidden="true">★</span> Passed — saved to learning progress
            </span>
          ) : (
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-600">
              {correctCount} / {total} correct
            </span>
          )}
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Pass threshold:{" "}
          <span className="font-mono font-semibold text-slate-700">{Math.round(PASS_THRESHOLD * 100)}%</span>
          {" · "}Saved attempt:{" "}
          <span className="font-mono font-semibold">
            {correctCount}/{total}
          </span>
          {recordRef.current ? ` · attempt ${recordRef.current.attempts}` : ""}
        </p>

        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            passedNow ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
          }`}
          role="status"
        >
          <p className="font-semibold text-slate-900">
            {passedNow ? "Passed — nice." : "Not yet at 80%."} You got {correctCount} of {total} correct
            (<span className="font-mono">{Math.round(score * 100)}%</span>).
          </p>
          <p className="mt-1 text-xs text-slate-700">
            {passedNow
              ? `Score is at or above the ${Math.round(PASS_THRESHOLD * 100)}% threshold, so this quiz is saved as passed.`
              : `Re-read the chapter (especially the sources below) and reset the attempt to try again.`}
          </p>
        </div>

        <ol className="space-y-3">
          {quiz.questions.map((q, i) => {
            const pick = selected[i];
            const right = pick === q.answerIndex;
            return (
              <li
                key={i}
                className={`rounded-lg border p-3 ${right ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40"}`}
                aria-label={`Question ${i + 1}`}
              >
                <p className="font-semibold text-slate-900">
                  <span
                    aria-hidden="true"
                    className={`mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white ${right ? "bg-emerald-500" : "bg-rose-400"}`}
                  >
                    {right ? "✓" : "✗"}
                  </span>
                  <span className="mr-1.5 font-mono text-sm text-slate-400">{i + 1}.</span>
                  {q.q}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  Your answer:{" "}
                  <span className="font-medium">
                    {pick !== undefined ? `${optionLabel(pick)}: ${q.options[pick]}` : "none given"}
                  </span>
                </p>
                {!right && (
                  <p className="mt-0.5 text-sm text-slate-800">
                    Correct answer:{" "}
                    <span className="font-medium">
                      {optionLabel(q.answerIndex)}: {q.options[q.answerIndex]}.
                    </span>
                  </p>
                )}
                <p className="mt-1 text-sm text-slate-700">{q.explanation}</p>
                {q.misconception && !right && (
                  <p className="mt-1 text-sm text-slate-700">
                    A common misconception: <span className="font-medium">{q.misconception}</span>
                  </p>
                )}
                <p className="mt-1 font-mono text-[11px] text-slate-500">source: {q.sourceReference}</p>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={resetAttempt}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
          >
            Reset this quiz
          </button>
          <p className="text-xs text-slate-400">Resetting clears your saved attempt and returns to question 1.</p>
        </div>
      </section>
    );
  }

  // ----- Interactive question flow -------------------------------------------
  const q = quiz.questions[current];

  // The feedback banner shows the current question when it has been checked,
  // otherwise the most recently checked question. Checking advances to the next
  // question immediately, so without this the verdict would never be visible.
  const feedbackIndex = isChecked ? current : lastChecked ?? -1;
  const feedback = feedbackIndex >= 0 ? quiz.questions[feedbackIndex] : undefined;

  return (
    <section className="my-8 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">
          Self-check · {quiz.title}
        </h4>
        {passed ? (
          <span className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-800">
            <span aria-hidden="true">★</span> Passed — saved to learning progress
          </span>
        ) : (
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-600">
            {correctCount} / {total} correct
          </span>
        )}
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Pass threshold: <span className="font-mono font-semibold text-slate-700">{Math.round(PASS_THRESHOLD * 100)}%</span>
        {" · "}Checked {checked.size} of {total} questions
      </p>
      <p className="mb-4 text-xs text-slate-400">
        {quiz.topic} · {quiz.difficulty} · chapter {String(quiz.chapterNumber).padStart(2, "0")}
      </p>

      {/* Progress bar */}
      <div className="mb-4 flex items-center gap-2" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total} aria-label="Question progress">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${((current + 1) / total) * 100}%` }}
          />
        </div>
        <span className="whitespace-nowrap font-mono text-xs text-slate-500">
          {current + 1} / {total}
        </span>
      </div>

      {/* Current question */}
      <div key={`${q.q}-${current}-${attempt}`} className="border-t border-slate-100 pt-4">
        <p className="font-semibold text-slate-900">
          <span className="mr-1.5 font-mono text-sm text-slate-400">{current + 1}.</span>
          {q.q}
        </p>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          {q.options.map((opt, oi) => {
            const isSelectedOpt = selected[current] === oi;
            const isRightOption = oi === q.answerIndex;
            const stateClass = !isChecked
              ? isSelectedOpt
                ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-300"
                : "border-slate-200 bg-white hover:border-indigo-400"
              : isRightOption
                ? "border-emerald-500 bg-emerald-50"
                : isSelectedOpt
                  ? "border-rose-400 bg-rose-50"
                  : "border-slate-200 bg-white opacity-60";
            const label = isRightOption ? " (correct answer)" : isSelectedOpt ? " (your pick)" : "";
            return (
              <button
                key={opt}
                type="button"
                aria-pressed={isSelectedOpt}
                aria-label={`${optionLabel(oi)}: ${opt}${label}`}
                onClick={() => {
                  if (!isChecked) {
                    const nextSelected = { ...selected, [current]: oi };
                    setSelected(nextSelected);
                    persist({ selected: nextSelected });
                  }
                }}
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm text-slate-700 transition-colors ${stateClass}`}
              >
                <span aria-hidden="true" className="mt-0.5 font-mono text-xs text-slate-400">
                  {String.fromCharCode(65 + oi)}
                </span>
                <span>{opt}</span>
                {isSelectedOpt && (
                  <span aria-hidden="true" className="ml-auto shrink-0 font-bold text-indigo-600">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {!isChecked ? (
            <button
              type="button"
              onClick={() => {
                if (isSelected) {
                  const nextChecked = new Set(checked);
                  nextChecked.add(current);
                  setChecked(nextChecked);
                  setLastChecked(current);
                  const nextCurrent = current < total - 1 ? current + 1 : current;
                  setCurrent(nextCurrent);
                  persist({ checked: [...nextChecked], current: nextCurrent });
                }
              }}
              disabled={!isSelected}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                !isSelected
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {current < total - 1 ? "Check answer & continue" : "Check my answer"}
            </button>
          ) : (
            <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              Question {current + 1} checked
            </span>
          )}
          {isChecked && current < total - 1 && (
            <button
              type="button"
              onClick={nextQuestion}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-700"
            >
              Next →
            </button>
          )}
        </div>

        {feedback && (
          <div
            role="status"
            className={`mt-2 rounded-lg border px-3 py-2 text-sm ${
              selected[feedbackIndex] === feedback.answerIndex
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            <p className="font-semibold">
              <span className="mr-1" aria-hidden="true">
                {selected[feedbackIndex] === feedback.answerIndex ? "✓" : "✗"}
              </span>
              {selected[feedbackIndex] === feedback.answerIndex ? "Correct." : "Not quite."}
            </p>
            {selected[feedbackIndex] !== feedback.answerIndex && (
              <p className="mt-0.5">
                Correct answer:{" "}
                <span className="font-medium">{feedback.options[feedback.answerIndex]}.</span>
              </p>
            )}
            <p className="mt-0.5">{feedback.explanation}</p>
            {feedback.misconception && selected[feedbackIndex] !== feedback.answerIndex && (
              <p className="mt-1">
                A common misconception: <span className="font-medium">{feedback.misconception}</span>
              </p>
            )}
            <p className="mt-1 font-mono text-[11px] text-slate-500">
              source: {feedback.sourceReference}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={prevQuestion}
          disabled={current === 0}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
            current === 0
              ? "cursor-not-allowed border-slate-100 text-slate-300"
              : "border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
          }`}
        >
          ← Previous
        </button>
        {current < total - 1 && !isChecked && (
          <button
            type="button"
            onClick={nextQuestion}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-700"
          >
            Next →
          </button>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={submitQuiz}
          disabled={!allChecked}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            allChecked
              ? "bg-slate-900 text-white hover:bg-slate-700"
              : "cursor-not-allowed bg-slate-100 text-slate-400"
          }`}
        >
          Submit quiz for score
        </button>
        <button
          type="button"
          onClick={resetAttempt}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-700"
        >
          Reset this quiz
        </button>
        <p className="text-xs text-slate-400">
          {allChecked
            ? "Every option you submit is checked first — nothing is auto-judged. Resetting clears a saved attempt."
            : `Check ${total - checked.size} more question${total - checked.size === 1 ? "" : "s"} to unlock the score.`}
        </p>
      </div>
    </section>
  );
}