export function Logo({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  const ink = inverse ? "#ffffff" : "#0f172a";
  return (
    <div className="flex items-center gap-3" aria-label="Krenora Lead">
      <svg className="size-9 shrink-0" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path d="M20 5v30M8 20h24M20 20 31 8M20 20l11 12" stroke={ink} strokeWidth="4" strokeLinecap="round" />
        <path d="M8 12l7 8-7 8" stroke="#2170e4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8" cy="12" r="3" fill="#2170e4" /><circle cx="8" cy="28" r="3" fill="#2170e4" /><circle cx="20" cy="20" r="3" fill={ink} />
      </svg>
      {!compact && <span className={`text-lg font-bold tracking-tight ${inverse ? "text-white" : "text-slate-950"}`}>Krenora</span>}
    </div>
  );
}
