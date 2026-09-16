/**
 * Booking status machine — HTML/CSS version.
 *
 * A flow of three active states (pending → confirmed → completed) with each
 * endpoint and its guard shown explicitly, plus the pending-only side actions
 * and the unreachable `cancelled` state. No fixed geometry, no hover-only
 * text, readable at narrow widths.
 */

const states = [
  {
    name: "pending",
    meaning: "An available slot. customer_id is NULL until a customer books it.",
    reachedBy: "POST /bookings (provider)", 
    accent: "from-amber-400 to-orange-400",
  },
  {
    name: "confirmed",
    meaning: "A customer claimed the slot; the interval is now a real booking.",
    reachedBy: "POST /bookings/{id}/book (atomic claim)",
    accent: "from-indigo-500 to-blue-500",
  },
  {
    name: "completed",
    meaning: "The provider finished the booking. Only this state is reviewable.",
    reachedBy: "POST /bookings/{id}/complete (provider/admin)",
    accent: "from-emerald-500 to-teal-500",
  },
] as const;

const forwardActions = [
  {
    step: "1",
    method: "POST /bookings",
    who: "provider",
    text: "Creates a bookings row in pending with customer_id NULL — an open slot, not yet a booking.",
    result: "→ pending",
  },
  {
    step: "2",
    method: "POST /bookings/{id}/book",
    who: "customer",
    text: "Credibility guard: one atomic UPDATE matched only while status = 'pending' AND customer_id IS NULL. If it affects 0 rows the slot was already claimed — 409.",
    result: "→ confirmed",
  },
  {
    step: "3",
    method: "POST /bookings/{id}/complete",
    who: "provider or admin",
    text: "Guard: transitions only a confirmed booking that has a customer (WHERE status = 'confirmed' AND customer_id IS NOT NULL); anything else is 409.",
    result: "→ completed",
  },
] as const;

const sideActions = [
  {
    method: "PUT /bookings/{id}",
    text: "Reschedule the interval, but only while the slot is still pending and unbooked; otherwise 409.",
  },
  {
    method: "DELETE /bookings/{id}",
    text: "Physically removes an open slot while pending and unbooked. Confirmed and completed bookings cannot be deleted.",
  },
] as const;

export default function StatusStateMachine() {
  return (
    <figure className="my-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          The flow of states
        </p>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
          {states.map((s, i) => (
            <div key={s.name} className="relative min-w-0 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r ${s.accent}`} />
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 font-mono text-sm font-bold text-slate-900">{s.name}</p>
                {i < states.length - 1 && (
                  <span aria-hidden="true" className="hidden shrink-0 font-mono text-slate-400 sm:block">→</span>
                )}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{s.meaning}</p>
              <p className="mt-2 font-mono text-[11px] text-indigo-700">reached by: {s.reachedBy}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-xs text-slate-500">
          pending → confirmed → completed
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          How a slot moves — endpoints and their guards
        </p>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-3">
          {forwardActions.map((a) => (
            <div key={a.step} className="min-w-0 rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 font-mono text-[13px] font-bold text-slate-900">{a.method}</p>
                <span className="shrink-0 whitespace-nowrap rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
                  {a.who}
                </span>
              </div>
              <ol className="mt-2 list-none">
                <li className="flex gap-2 text-xs leading-relaxed text-slate-600">
                  <span className="shrink-0 font-bold text-indigo-600">{a.step}.</span>
                  <span className="min-w-0">{a.text}</span>
                </li>
              </ol>
              <p className="mt-2 font-mono text-xs font-semibold text-slate-700">{a.result}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Only while pending &amp; unbooked
        </p>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
          {sideActions.map((a) => (
            <div key={a.method} className="min-w-0 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
              <p className="font-mono text-[13px] font-bold text-slate-900">{a.method}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{a.text}</p>
            </div>
          ))}
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3">
            <p className="font-mono text-[13px] font-bold text-stone-500">cancelled</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Defined in the enum, but no current endpoint reaches it.
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          statuses.ts encodes the same facts; the repo never sets cancelled.
        </p>
      </div>
    </figure>
  );
}