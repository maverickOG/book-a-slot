/**
 * Migration timeline — semantic ordered list with a fixed marker column.
 *
 * Each row is `grid: [fixed marker column] | [content column]`, so the numbers
 * and their cards stay aligned at every width without absolute positioning.
 */

import { migrations } from "../../data/migrations";

export default function MigrationsTimeline() {
  return (
    <figure className="my-6">
      <ol className="space-y-4">
        {migrations.map((m, i) => {
          const last = i === migrations.length - 1;
          return (
            <li
              key={m.id}
              className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 sm:grid-cols-[2.5rem_minmax(0,1fr)]"
            >
              <div className="flex flex-col items-center">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-mono text-xs font-bold text-white">
                  {i + 1}
                </span>
                {!last && <span aria-hidden="true" className="w-px flex-1 bg-indigo-200" />}
              </div>
              <div className={last ? "" : "pb-4"}>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="font-semibold text-slate-900">{m.title}</p>
                    <p className="font-mono text-xs font-bold text-indigo-700">{m.id}</p>
                  </div>
                  <p className="mt-1 break-all font-mono text-[11px] text-slate-400">{m.file}</p>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    What changed
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-600">
                    {m.changes.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Downgrade
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-600">
                    {m.downgrade.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <figcaption className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
        A chain: 0001 → 0002 → 0003. Each migration's{" "}
        <span className="font-mono text-xs">down_revision</span> is the previous one, and{" "}
        <span className="font-mono text-xs">alembic upgrade head</span> applies whatever is missing.
      </figcaption>
    </figure>
  );
}