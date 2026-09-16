import { useState } from "react";

export interface FlowStep {
  title: string;
  method?: string;
  detail: string;
}

export default function RequestFlow({ steps, title = "The flow" }: { steps: FlowStep[]; title?: string }) {
  const [idx, setIdx] = useState(0);
  const step = steps[idx];

  return (
    <figure className="my-6 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-900">{title}</p>

      <div className="flex items-start gap-1.5 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="flex min-w-0 items-center gap-1.5"
          >
            <button
              onClick={() => setIdx(i)}
              aria-current={i === idx ? "step" : undefined}
              className={`shrink-0 rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                i === idx
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : i < idx
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300"
              }`}
            >
              {i + 1}. {s.title}
            </button>
            {i < steps.length - 1 && <span className="shrink-0 text-slate-300">→</span>}
          </div>
        ))}
      </div>

      <div className="dark-surface mt-4 rounded-xl bg-slate-900 p-4 text-sm text-slate-200">
        {step.method && (
          <p className="mb-1.5">
            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 font-mono text-xs font-semibold text-indigo-300">
              {step.method}
            </span>
          </p>
        )}
        <p className="leading-relaxed">{step.detail}</p>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40"
        >
          ← Back
        </button>
        <p className="text-xs text-slate-400">
          step {idx + 1} of {steps.length} — {step.title}
        </p>
        <button
          onClick={() => setIdx((i) => Math.min(steps.length - 1, i + 1))}
          disabled={idx === steps.length - 1}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </figure>
  );
}