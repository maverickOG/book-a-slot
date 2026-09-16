import { useMemo, useState } from "react";

interface Props {
  title: string;
  steps: string[];
  explanation?: string;
  shuffleSeed?: number;
}

export default function OrderSteps({ title, steps, explanation, shuffleSeed = 1 }: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);

  const shuffled = useMemo(() => {
    // deterministic "shuffle" so SSR and hydration agree
    const arr = steps.map((label, i) => ({ label, orig: i }));
    const r = (n: number) => {
      const x = Math.sin((shuffleSeed + n) * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(r(i) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [steps, shuffleSeed]);

  const available = shuffled.filter((s) => !selected.includes(s.orig));

  const correct = selected.every((v, i) => v === i);

  return (
    <section className="my-8 rounded-2xl border border-slate-200 bg-white p-5">
      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">Order the steps</h4>
      <p className="mb-4 mt-1 text-sm text-slate-600">{title}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Your sequence</p>
          <ol className="space-y-2">
            {selected.map((orig, i) => (
              <li key={orig} className="flex items-start gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm">
                <span className="font-mono font-bold text-indigo-600">{i + 1}.</span>
                <span className="flex-1">{steps[orig]}</span>
                <button
                  onClick={() => {
                    setSelected((s) => s.filter((v) => v !== orig));
                    setChecked(false);
                  }}
                  className="text-xs text-slate-400 hover:text-rose-600"
                  aria-label="remove step"
                >
                  ✕
                </button>
              </li>
            ))}
            {selected.length === 0 && <p className="text-sm italic text-slate-400">Tap steps on the right to build the sequence.</p>}
          </ol>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                setChecked(true);
              }}
              disabled={selected.length !== steps.length}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
            >
              Check
            </button>
            <button
              onClick={() => {
                setSelected([]);
                setChecked(false);
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
            >
              Reset
            </button>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Available</p>
          <div className="flex flex-wrap gap-2">
            {available.map((s) => (
              <button
                key={s.orig}
                onClick={() => {
                  setSelected((sel) => [...sel, s.orig]);
                  setChecked(false);
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {checked && (
        <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${correct ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
          {correct ? "Correct order!" : "Not quite — the indexes show where the sequence diverges."}
          {explanation && <span className="mt-1 block">{explanation}</span>}
        </p>
      )}
    </section>
  );
}