import { useState } from "react";

interface Props {
  file: string;
  correct: string;
  wrong: string;
  wrongReason: string;
}

export default function WhichIsReal({ file, correct, wrong, wrongReason }: Props) {
  const [picked, setPicked] = useState<0 | 1 | null>(null);
  const isCorrect = picked === 0;

  const reset = () => setPicked(null);

  const code = (content: string, idx: 0 | 1) => {
    const label = idx === 0 ? "A" : "B";
    return (
      <figure className="flex min-w-0 flex-col">
        <button
          onClick={() => setPicked(idx)}
          disabled={picked !== null}
          className={`flex flex-1 min-w-0 flex-col overflow-hidden rounded-xl border text-left transition-colors ${
            picked === null
              ? "border-slate-200 hover:border-indigo-400"
              : idx === 0
                ? "border-emerald-500"
                : picked === idx
                  ? "border-rose-400"
                  : "border-slate-200"
          }`}
        >
          <figcaption className="dark-surface flex items-center justify-between gap-2 bg-slate-900 px-3 py-2 font-mono text-xs text-slate-200">
            <span className="flex items-center gap-2">
              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-bold text-slate-100">
                Option {label}
              </span>
              <span className="truncate">{file}</span>
            </span>
            <span className="text-slate-300">Choose option {label}</span>
          </figcaption>
          <pre className="min-h-72 flex-1 overflow-auto scrollbar-gutter-stable bg-slate-950 px-3 py-3 text-[12.5px] leading-relaxed text-slate-200">
            {content}
          </pre>
        </button>
      </figure>
    );
  };

  return (
    <section className="my-8 rounded-2xl border border-slate-200 bg-white p-5">
      <h4 className="mb-1 text-sm font-bold uppercase tracking-widest text-slate-400">
        Code puzzle · which one is the real repo code?
      </h4>
      <p className="mb-5 text-sm text-slate-600">
        Only one of these is verbatim from the repository. The other looks plausible but is wrong. Pick it.
      </p>

      <div className="grid gap-5 2xl:grid-cols-2">
        {code(correct, 0)}
        {code(wrong, 1)}
      </div>

      {picked !== null && (
        <>
          <div
            role="status"
            className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
              isCorrect
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <p className="puzzle-result">
              <strong>{isCorrect ? "That's the real code." : "The other one is real."}</strong>{" "}
              {wrongReason}
            </p>
          </div>
          <button
            onClick={reset}
            className="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
          >
            Try again
          </button>
        </>
      )}
    </section>
  );
}