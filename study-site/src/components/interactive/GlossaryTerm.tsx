import { useLayoutEffect, useRef, useState } from "react";
import { glossary } from "../../data/glossary";

/** Inline definition popover for glossary terms. */
export default function GlossaryTerm({ term, label }: { term: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const hovering = useRef(false);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const entry = glossary.find((g) => g.term.toLowerCase() === term.toLowerCase());

  useLayoutEffect(() => {
    if (!open || !tooltipRef.current) return;
    const el = tooltipRef.current;
    const rect = el.getBoundingClientRect();
    const overflowRight = rect.right - (window.innerWidth - 8);
    el.style.marginLeft = overflowRight > 0 ? `${-overflowRight}px` : "";
  }, [open]);

  if (!entry) return <span>{label ?? term}</span>;

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => {
        hovering.current = true;
        setOpen(true);
      }}
      onMouseLeave={() => {
        hovering.current = false;
        setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => {
          if (hovering.current) {
            // The pointer is already over the term (hover just opened it). A
            // plain toggle here would close it the instant it was opened, so
            // treat this click as the pin/keep-open gesture instead.
            hovering.current = false;
            setOpen(true);
          } else {
            setOpen((o) => !o);
          }
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-expanded={open}
        className="def-term"
      >
        {label ?? entry.term}
      </button>
      {open && (
        <span
          ref={tooltipRef}
          role="tooltip"
          className="absolute left-0 z-30 mt-1 block w-72 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 text-left text-[13px] font-normal normal-case leading-relaxed text-slate-700 shadow-xl"
        >
          <span className="mb-0.5 block font-semibold text-slate-900">{entry.term}</span>
          <span className="not-italic">{entry.definition}</span>
          <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {entry.category}
          </span>
        </span>
      )}
    </span>
  );
}