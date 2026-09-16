/**
 * Docker Compose wiring — HTML/CSS version.
 *
 * A clear startup sequence (db+redis healthy → api starts → migrations →
 * uvicorn) followed by the three service cards. Long env values wrap instead
 * of breaking the card layout, and nothing crucial is hidden behind a click.
 */

import { composeCommand, composeServices, infrastructureFacts } from "../../data/docker";

const ACCENT: Record<string, string> = {
  db: "border-blue-200 bg-blue-50/70",
  redis: "border-rose-200 bg-rose-50/70",
  api: "border-indigo-200 bg-indigo-50/70",
};

const steps = [
  {
    title: "db healthy · redis healthy",
    detail: "Compose waits for both: pg_isready -U book_a_slot -d book_a_slot, and redis-cli ping.",
  },
  {
    title: "API container starts",
    detail: "Only once both pass — the api service uses depends_on: condition: service_healthy.",
  },
  {
    title: "Alembic migrations run",
    detail: "The api command starts with 'alembic upgrade head', applying 0001 → 0002 → 0003.",
  },
  {
    title: "Uvicorn serves requests",
    detail: "Only after migrations succeed: uvicorn app.main:app --host 0.0.0.0 --port 8000.",
  },
];

export default function DockerStack() {
  return (
    <figure className="my-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Startup order
        </p>
        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 sm:grid-cols-[2.25rem_minmax(0,1fr)]">
              <div className="flex flex-col items-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 font-mono text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                {i < steps.length - 1 && <span aria-hidden="true" className="w-px flex-1 bg-indigo-200" />}
              </div>
              <div className="pb-2">
                <p className="text-sm font-semibold text-slate-900">{s.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          The three services
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {composeServices.map((s) => (
            <div key={s.name} className={`rounded-xl border p-3 ${ACCENT[s.name] ?? "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-sm font-bold text-slate-900">{s.name}</p>
                <span className="rounded-md bg-white px-2 py-0.5 font-mono text-[11px] text-slate-600">
                  :{s.port}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600">{s.image}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-700">{s.purpose}</p>
              {s.env && s.env.length > 0 && (
                <div className="mt-2">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">env</p>
                  <div className="dark-surface overflow-hidden rounded-md bg-slate-900 px-2 py-1.5">
                    {s.env.map((e) => (
                      <p key={e} className="break-all font-mono text-[10px] leading-relaxed text-slate-200">
                        {e}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              <p className="mt-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">health: </span>
                <span className="break-all font-mono text-[11px] text-slate-700">{s.healthcheck}</span>
              </p>
              {s.dependsOn && (
                <p className="mt-1 text-xs text-slate-600">
                  <span className="font-semibold">depends on:</span> {s.dependsOn}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <figcaption className="dark-surface rounded-lg bg-slate-900 px-3 py-2.5 text-xs text-slate-200">
        <span className="font-semibold text-slate-100">api command:</span>{" "}
        <code className="break-all font-mono text-slate-300">{composeCommand}</code>
        <span className="mt-1 block text-slate-300">
          {infrastructureFacts.postgresVolume} · {infrastructureFacts.localStart}. Migrations are the
          API's responsibility, not Docker's — the image just runs the ordered command.
        </span>
      </figcaption>
    </figure>
  );
}