/**
 * Entity-relationship diagram — HTML/CSS version.
 *
 * Three table cards plus a plain horizontal list of relationship annotations.
 * No rotated labels, no fixed SVG coordinates, no hover-to-understand.
 */

import { models } from "../../data/models";

const relationships = [
  {
    code: "bookings.provider_id → users.id",
    note: "NOT NULL · RESTRICT · indexed — the provider who opened the slot.",
  },
  {
    code: "bookings.customer_id → users.id",
    note: "nullable · RESTRICT · indexed — NULL until the slot is booked.",
  },
  {
    code: "reviews.booking_id → bookings.id",
    note: "UNIQUE · RESTRICT · one review per booking.",
  },
];

export default function SchemaDiagram() {
  return (
    <figure className="my-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          The three tables
        </p>
        <div className="grid gap-3 lg:grid-cols-3">
          {models.map((m) => (
            <div key={m.table} className="overflow-hidden rounded-xl border border-slate-200">
              <div className="border-b border-slate-100 bg-indigo-50/60 px-3 py-2.5">
                <p className="font-mono text-sm font-bold text-indigo-800">{m.table}</p>
                <p className="mt-0.5 text-xs text-slate-500">{m.label}</p>
              </div>
              <ul className="divide-y divide-slate-100">
                {m.fields.map((f) => (
                  <li key={f.name} className="px-3 py-1.5">
                    <p className="flex items-baseline gap-2 text-[13px]">
                      <span className="font-mono font-medium text-slate-800">{f.name}</span>
                      <span className="ml-auto whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {f.type}
                      </span>
                    </p>
                    {f.notes && <p className="mt-0.5 text-[11px] text-slate-500">{f.notes}</p>}
                  </li>
                ))}
              </ul>
              <p className="border-t border-slate-100 bg-slate-50 px-3 py-1.5 font-mono text-[10px] text-slate-400">
                {m.source}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Relationships
        </p>
        <ul className="space-y-2">
          {relationships.map((r) => (
            <li key={r.code} className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5">
              <p className="break-words font-mono text-[13px] font-semibold text-indigo-800">{r.code}</p>
              <p className="mt-0.5 text-xs text-slate-600">{r.note}</p>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          Every foreign key uses ondelete="RESTRICT" — a referenced user or booking cannot be deleted
          while rows still point at it. customer_id is nullable because a pending slot has no customer.
        </p>
      </div>
    </figure>
  );
}