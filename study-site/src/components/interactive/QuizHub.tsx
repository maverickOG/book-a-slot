import { useEffect, useMemo, useState } from "react";
import { modules } from "../../data/modules";
import { quizzes, type Quiz } from "../../data/quiz";
import { clearQuizPassedIn, LEARNING_EVENT, loadLearning, PASS_THRESHOLD } from "../../lib/learning";
import { loadQuizProgress, QUIZ_EVENT, resetAllQuizzes, type QuizRecord } from "../../lib/quizProgress";
import QuizCard from "./QuizCard";

type QuizStatus = "not-started" | "in-progress" | "completed" | "passed";

const QUIZ_CHAPTERS = quizzes.map((q) => q.chapter);

/** Record index in the hub is the quiz id (e.g. "overview"), like QuizCard. */
function getStatus(
  chapterId: string,
  quizId: string,
  passedMap: Record<string, boolean>,
  records: Record<string, QuizRecord>,
): QuizStatus {
  const rec = records[quizId];
  if (passedMap[chapterId] || (rec && rec.submitted && rec.score >= PASS_THRESHOLD)) return "passed";
  if (rec && rec.submitted) return "completed";
  if (rec) return "in-progress";
  return "not-started";
}

function statusLabel(s: QuizStatus): string {
  switch (s) {
    case "passed":
      return "Passed";
    case "completed":
      return "Completed";
    case "in-progress":
      return "In progress";
    default:
      return "Not started";
  }
}

function statusClasses(s: QuizStatus): string {
  switch (s) {
    case "passed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "completed":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "in-progress":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-500";
  }
}

function footerText(s: QuizStatus): string {
  switch (s) {
    case "passed":
      return "Review quiz →";
    case "completed":
      return "Review attempt →";
    case "in-progress":
      return "Continue quiz →";
    default:
      return "Start quiz →";
  }
}

function recordNote(rec: QuizRecord | undefined, totalQuestions: number): string {
  if (!rec) return "No previous attempt";
  if (rec.submitted) {
    const pct = Math.round(rec.score * 100);
    return `Previous: ${pct}% · ${rec.attempts} ${rec.attempts === 1 ? "attempt" : "attempts"}`;
  }
  const answered = rec.checked.length;
  return `In progress · ${answered}/${totalQuestions} checked`;
}

export default function QuizHub() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [passedMap, setPassedMap] = useState<Record<string, boolean>>({});
  const [recordMap, setRecordMap] = useState<Record<string, QuizRecord>>({});
  const [passedCount, setPassedCount] = useState(0);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const m of modules) {
      const group = quizzes.filter((q) => q.module === m.key);
      init[m.key] = group.length <= 3;
    }
    return init;
  });

  useEffect(() => {
    const read = () => {
      const state = loadLearning();
      const qp = loadQuizProgress();
      const map: Record<string, boolean> = {};
      for (const q of quizzes) {
        map[q.chapter] = !!state.chapters[q.chapter]?.quizPassed;
      }
      setPassedMap(map);
      setRecordMap(qp.quizzes);
      const passed = quizzes.filter(
        (q) => map[q.chapter] || (qp.quizzes[q.id]?.submitted && qp.quizzes[q.id].score >= PASS_THRESHOLD),
      ).length;
      setPassedCount(passed);
    };
    read();
    window.addEventListener(LEARNING_EVENT, read);
    window.addEventListener(QUIZ_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(LEARNING_EVENT, read);
      window.removeEventListener(QUIZ_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  // Deep link: read ?quiz= from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const quizParam = params.get("quiz");
    if (quizParam && quizzes.some((q) => q.id === quizParam)) {
      setSelectedId(quizParam);
      // Open the module containing this quiz
      const quiz = quizzes.find((q) => q.id === quizParam);
      if (quiz) {
        setOpenModules((prev) => ({ ...prev, [quiz.module]: true }));
      }
    }
  }, []);

  const totalQuestions = useMemo(() => quizzes.reduce((n, q) => n + q.questions.length, 0), []);

  const selected = selectedId ? quizzes.find((q) => q.id === selectedId) ?? null : null;

  const toggleModule = (key: string) => {
    setOpenModules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openQuiz = (q: Quiz) => {
    setSelectedId(q.id);
    // Update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set("quiz", q.id);
    window.history.replaceState({}, "", url.toString());
  };

  const closeQuiz = () => {
    setSelectedId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("quiz");
    window.history.replaceState({}, "", url.toString());
  };

  const resetAll = () => {
    if (typeof window !== "undefined" && !window.confirm("Clear every saved quiz attempt on this device? This cannot be undone.")) return;
    resetAllQuizzes();
    clearQuizPassedIn(QUIZ_CHAPTERS);
  };

  if (selected) {
    return (
      <div>
        <button
          type="button"
          onClick={closeQuiz}
          className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-700"
        >
          ← All quizzes
        </button>
        <QuizCard key={selected.id} quizId={selected.id} chapter={selected.chapter} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">{quizzes.length} quizzes</span>
              {" · "}
              {totalQuestions} questions
              {" · "}
              passing score <span className="font-mono font-semibold text-slate-900">80%</span>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Quiz passed: <span className="font-semibold text-slate-900">{passedCount} / {quizzes.length}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Attempts are saved in this browser — a quiz reopens where you left it.
            </p>
          </div>
          <button
            id="reset-all-quizzes"
            type="button"
            onClick={resetAll}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-rose-300 hover:text-rose-700"
          >
            Reset all quiz progress
          </button>
        </div>
      </div>

      {modules
        .filter((m) => quizzes.some((q) => q.module === m.key))
        .map((m) => {
          const group = quizzes.filter((q) => q.module === m.key);
          const modulePassed = group.filter((q) => getStatus(q.chapter, q.id, passedMap, recordMap) === "passed").length;
          const isOpen = openModules[m.key] ?? (group.length <= 3);

          return (
            <section key={m.key} className="mb-4">
              <button
                type="button"
                onClick={() => toggleModule(m.key)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-indigo-300"
                aria-expanded={isOpen}
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    {m.number} · {m.label}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {modulePassed} / {group.length} passed · {group.reduce((n, q) => n + q.questions.length, 0)} questions
                  </p>
                </div>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                >
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>

              {isOpen && (
                <div className="mt-2 grid gap-3 pl-0 md:grid-cols-2">
                  {group.map((q) => {
                    const status = getStatus(q.chapter, q.id, passedMap, recordMap);
                    const rec = recordMap[q.id];
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => openQuiz(q)}
                        className="group rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-indigo-400"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-semibold text-slate-900 group-hover:text-indigo-800">
                            {q.topic}
                          </p>
                          <span className={`whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold ${statusClasses(status)}`}>
                            {statusLabel(status)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Chapter {String(q.chapterNumber).padStart(2, "0")} · {q.chapterTitle}
                        </p>
                        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-slate-600">
                            {q.questions.length} {q.questions.length === 1 ? "question" : "questions"}
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">
                            {q.difficulty}
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-slate-600">
                            {recordNote(rec, q.questions.length)}
                          </span>
                        </p>
                        <p className="mt-2 text-xs font-medium text-indigo-600 group-hover:text-indigo-800">
                          {footerText(status)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
    </div>
  );
}