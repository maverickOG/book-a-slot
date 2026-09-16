import { useState } from "react";
import { endpoints, type Endpoint } from "../../data/endpoints";

const METHOD_COLOR: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700",
  POST: "bg-indigo-100 text-indigo-700",
  PUT: "bg-amber-100 text-amber-700",
  DELETE: "bg-rose-100 text-rose-700",
};

function sampleFor(e: Endpoint, scenario: string): string {
  if (e.path.startsWith("/auth/signup") || e.path.startsWith("/auth/login") || e.path === "/auth/me") {
    if (scenario.startsWith("201")) return '{ "id": 3, "email": "you@example.com", "role": "customer" }';
    if (e.path.startsWith("/auth/me")) return '{ "id": 3, "email": "you@example.com", "role": "customer" }';
    return '{ "access_token": "z9...ab3", "token_type": "bearer" }';
  }
  if (e.path === "/bookings" && e.method === "POST") {
    return '{ "id": 7, "provider_id": 2, "customer_id": null, "starts_at": "2026-10-01T10:00:00", "ends_at": "2026-10-01T11:00:00", "status": "pending" }';
  }
  if (e.path.startsWith("/bookings") && e.path.includes("/book")) {
    return '{ "id": 7, "provider_id": 2, "customer_id": 3, "starts_at": "2026-10-01T10:00:00", "ends_at": "2026-10-01T11:00:00", "status": "confirmed" }';
  }
  if (e.path.endsWith("/complete")) {
    return '{ "id": 7, "provider_id": 2, "customer_id": 3, "starts_at": "2026-10-01T10:00:00", "ends_at": "2026-10-01T11:00:00", "status": "completed" }';
  }
  if (e.method === "DELETE") return ""; // 204 no content
  if (e.path === "/reviews") {
    return '{ "id": 9, "booking_id": 7, "rating": 5, "comment": "Really smooth!" }';
  }
  if (e.path.endsWith("/summarize")) {
    return '{ "status": "queued", "review_id": 9 }';
  }
  return '[ { "id": 7, "provider_id": 2, "customer_id": 3, "starts_at": "2026-10-01T10:00:00", "ends_at": "2026-10-01T11:00:00", "status": "confirmed" } ]';
}

export default function RequestSimulator() {
  const [selected, setSelected] = useState<Endpoint>(endpoints[0]);
  const [scenario, setScenario] = useState<string | null>(null);

  const pick = (e: Endpoint) => {
    setSelected(e);
    setScenario(null);
  };

  const statusLine = scenario?.split(" ")[0] ?? "";

  return (
    <section className="my-8 rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-4">
        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">
          Static request simulator
        </h4>
        <p className="mt-1 text-sm text-slate-600">
          No network calls — this encodes the actual API contract from the code and tests. Pick an
          endpoint and a scenario to see the expected result.
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-0 md:grid-cols-[minmax(0,19rem)_1fr]">
        <ul className="border-r border-slate-100 px-2 py-3 md:max-h-[30rem] md:overflow-y-auto">
          {endpoints.map((e) => (
            <li key={`${e.method} ${e.path}`}>
              <button
                onClick={() => pick(e)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                  selected === e
                    ? "bg-indigo-50 font-medium text-indigo-800"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${METHOD_COLOR[e.method]}`}>
                  {e.method}
                </span>
                <span className="truncate font-mono text-[12px]">{e.path}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="p-4">
          <div className="sim-request-panel dark-surface rounded-lg bg-slate-900 p-3 font-mono text-sm text-slate-200">
            <p>
              <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${METHOD_COLOR[selected.method]}`}>
                {selected.method}
              </span>{" "}
              <span className="text-indigo-300">{selected.path}</span>
            </p>
            <p className="sim-auth-line mt-1.5 text-xs text-slate-300">auth: {selected.auth}</p>
            {selected.body && (
              <pre className="mt-2 overflow-x-auto rounded bg-slate-800 px-3 py-2 text-xs text-slate-200">
                {selected.body}
              </pre>
            )}
          </div>

          <p className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Possible outcomes
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.responses.map((r) => (
              <button
                key={r}
                onClick={() => setScenario(r)}
                className={`rounded-lg border px-2.5 py-1 text-xs ${scenario === r ? "border-indigo-500 bg-indigo-50 font-semibold text-indigo-800" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"}`}
              >
                {r}
              </button>
            ))}
          </div>

          {scenario && (
            <div className="sim-response-panel mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">response</p>
              <p className="sim-status-pill mb-2 inline-block rounded bg-slate-900 px-2 py-0.5 text-xs font-bold text-emerald-300">
                HTTP {statusLine}
              </p>
              {sampleFor(selected, scenario) && <pre className="overflow-x-auto rounded bg-white px-3 py-2 text-xs text-slate-700">{sampleFor(selected, scenario)}</pre>}
              {selected.method === "DELETE" && <p className="text-xs text-slate-500">204 — empty body</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}