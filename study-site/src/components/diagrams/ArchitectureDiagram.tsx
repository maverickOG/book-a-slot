import { useState } from "react";

interface NodeInfo {
  key: string;
  label: string;
  sub: string;
  detail: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const NODES: NodeInfo[] = [
  {
    key: "client",
    label: "Client",
    sub: "curl · TestClient · UI",
    detail: "Sends HTTP requests with JSON bodies. No app state is kept here; authentication uses a bearer token header.",
    x: 20,
    y: 150,
    w: 170,
    h: 92,
  },
  {
    key: "api",
    label: "FastAPI app",
    sub: "uvicorn · alembic",
    detail: "app/main.py includes the auth, bookings and reviews routers. Every request goes through FastAPI's dependency injection (get_db, get_current_user, role checks).",
    x: 330,
    y: 138,
    w: 210,
    h: 116,
  },
  {
    key: "db",
    label: "PostgreSQL 16",
    sub: "postgres:16-alpine",
    detail: "The real database, reached via DATABASE_URL (psycopg driver). Stores users, bookings and reviews. Migrated by Alembic before the API boots.",
    x: 640,
    y: 60,
    w: 210,
    h: 100,
  },
  {
    key: "redis",
    label: "Redis 7",
    sub: "redis:7-alpine",
    detail: "Used only as a work queue: rpush on 'review_summary_jobs'. No worker consumes it — summarisation is a queue-only stub.",
    x: 640,
    y: 240,
    w: 210,
    h: 100,
  },
];

export default function ArchitectureDiagram() {
  const [hover, setHover] = useState<string | null>(null);
  const active = NODES.find((n) => n.key === hover);

  const box = (n: NodeInfo) => (
    <g
      key={n.key}
      onMouseEnter={() => setHover(n.key)}
      onMouseLeave={() => setHover(null)}
      style={{ cursor: "pointer" }}
    >
      <rect
        x={n.x}
        y={n.y}
        width={n.w}
        height={n.h}
        rx={14}
        fill="white"
        stroke={hover === n.key ? "#4f46e5" : n.key === "db" ? "#2563eb" : n.key === "redis" ? "#dc2626" : "#64748b"}
        strokeWidth={hover === n.key ? 2.5 : 1.5}
      />
      <text x={n.x + n.w / 2} y={n.y + 34} textAnchor="middle" fontSize={17} fontWeight={700} fill="#0f172a">
        {n.label}
      </text>
      <text x={n.x + n.w / 2} y={n.y + 56} textAnchor="middle" fontSize={12} fill="#64748b" fontStyle="italic">
        {n.sub}
      </text>
      <text x={n.x + n.w / 2} y={n.y + n.h - 18} textAnchor="middle" fontSize={11} fill="#475569">
        {hover === n.key ? "click for details ↓" : "hover me"}
      </text>
    </g>
  );

  return (
    <figure className="my-6 rounded-2xl border border-slate-200 bg-white p-4">
      <svg viewBox="0 0 900 380" className="w-full" role="img" aria-label="Architecture diagram">
        {/* Docker Compose boundary */}
        <rect x={280} y={30} width={610} height={330} rx={20} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="7 5" />
        <text x={300} y={52} fontSize={12} fontWeight={700} fill="#64748b" fontFamily="monospace">
          docker compose up ── one stack: api + db + redis
        </text>

        {/* Client → API */}
        <line x1={190} y1={196} x2={330} y2={196} stroke="#94a3b8" strokeWidth={2} markerEnd="url(#arrow)" />
        <text x={230} y={184} fontSize={12} fill="#475569">
          HTTP + JSON
        </text>

        {/* API → PostgreSQL */}
        <line x1={540} y1={172} x2={640} y2={110} stroke="#2563eb" strokeWidth={2} markerEnd="url(#arrow)" />
        <text x={548} y={140} fontSize={11.5} fill="#2563eb">
          SQLAlchemy
        </text>

        {/* API → Redis */}
        <line x1={540} y1={238} x2={640} y2={290} stroke="#dc2626" strokeWidth={2} markerEnd="url(#arrow)" />
        <text x={548} y={278} fontSize={11.5} fill="#dc2626">
          rpush
        </text>

        {NODES.map(box)}

        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#64748b" />
          </marker>
        </defs>
      </svg>
      <figcaption className="mt-2 min-h-[2.5rem] rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
        {active ? (
          <>
            <strong className="text-slate-900">{active.label}:</strong> {active.detail}
          </>
        ) : (
          "Hover a component to see what it does in this project."
        )}
      </figcaption>
    </figure>
  );
}