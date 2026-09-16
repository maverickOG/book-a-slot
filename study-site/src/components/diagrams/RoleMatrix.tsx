import { actionLabels, roles, type Access } from "../../data/roles";

function cellClass(v: Access): string {
  switch (v) {
    case "✓":
      return "bg-emerald-100 text-emerald-700";
    case "✗":
      return "text-slate-300";
    case "own":
      return "bg-indigo-100 text-indigo-700";
    case "own-pending":
      return "bg-amber-100 text-amber-700";
    case "public":
      return "bg-slate-100 text-slate-500";
  }
}

const legend: Array<[Access, string]> = [
  ["✓", "always allowed"],
  ["✗", "never allowed"],
  ["own", "only your own records"],
  ["own-pending", "own and still available (pending)"],
  ["public", "no token required"],
];

export default function RoleMatrix() {
  const actions = Object.keys(actionLabels);

  return (
    <figure className="my-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="border-b border-r border-slate-200 px-3 py-2 text-left">Role</th>
              {actions.map((a) => (
                <th key={a} className="border-b border-slate-200 px-2 py-2 text-center font-medium text-slate-600">
                  {actionLabels[a]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.role} className="border-b border-slate-100 last:border-0">
                <td className="border-r border-slate-200 px-3 py-2 align-middle">
                  <span className="font-mono font-semibold text-slate-900">{r.role}</span>
                  <p className="max-w-[16rem] text-xs text-slate-500">{r.note}</p>
                </td>
                {actions.map((a) => {
                  const v = r.actions[a] ?? "✗";
                  return (
                    <td key={a} className="px-2 py-1.5 text-center">
                      <span className={`inline-flex h-6 w-8 items-center justify-center rounded-md text-xs font-bold ${cellClass(v)}`}>
                        {v === "✗" ? "·" : v}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        {legend.map(([v, label]) => (
          <span key={v} className="flex items-center gap-1.5">
            <span className={`inline-flex h-5 w-7 items-center justify-center rounded-md text-xs font-bold ${cellClass(v)}`}>{v}</span>
            {label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}