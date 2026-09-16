export default function QueueVisual() {
  return (
    <figure className="my-6 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col items-stretch gap-0 sm:flex-row sm:items-center sm:gap-4">
        {/* Review row */}
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm">
          <p className="font-mono font-bold text-violet-800">reviews</p>
          <p className="mt-1 text-xs text-violet-700">
            one row per review, e.g. <span className="font-mono">id = 42</span>
          </p>
          <p className="text-xs text-violet-700">
            <span className="rounded bg-white px-1.5 py-0.5 font-mono">summary</span> still NULL
          </p>
        </div>

        <div className="flex items-center justify-center gap-1 py-2 text-2xl text-slate-300 sm:py-0" aria-hidden="true">
          <span className="diagram-pulse">→</span>
        </div>

        {/* Endpoint */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm">
          <p className="font-mono font-bold text-indigo-800">POST /reviews/{`{id}`}/summarize</p>
          <p className="mt-1 text-xs text-indigo-700">author-only · returns 202 {`{"status":"queued"}`}</p>
        </div>

        <div className="flex items-center justify-center gap-1 py-2 text-2xl text-slate-300 sm:py-0" aria-hidden="true">
          <span className="diagram-pulse">→</span>
        </div>

        {/* Payload */}
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm">
          <p className="font-mono font-bold text-rose-800">rpush(KEY, payload)</p>
          <p className="mt-1 rounded bg-white px-2 py-1 font-mono text-xs text-rose-700">
            {`{"review_id": N}`}
          </p>
        </div>

        <div className="flex items-center justify-center gap-1 py-2 text-2xl text-slate-300 sm:py-0" aria-hidden="true">
          <span className="diagram-pulse">→</span>
        </div>

        {/* Redis list */}
        <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="font-mono font-bold text-slate-800">redis list: review_summary_jobs</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs text-slate-600">{"{review_id: 1}"}</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs text-slate-600">…</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs text-slate-600">{"{review_id: N}"}</span>
          </div>
        </div>
      </div>

      <figcaption className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
        This project has <strong className="font-semibold text-slate-900">no worker and no AI</strong>: the
        summarize endpoint only appends the exact payload with Redis <span className="font-mono text-xs">rpush</span>.
        The queue is never drained in the assessment scope.
      </figcaption>
    </figure>
  );
}