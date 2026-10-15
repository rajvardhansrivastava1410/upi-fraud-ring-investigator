'use client';

interface LoadingStateProps {
  label?: string;
  /** Number of skeleton rows to render (for list loading states). Default: 4 */
  rows?: number;
  variant?: 'spinner' | 'skeleton' | 'graph';
}

/** Pulsing ring spinner — uses CSS animation, respects `prefers-reduced-motion`. */
function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-label={label}>
      <div className="relative h-10 w-10">
        {/* Outer ring */}
        <span
          className="absolute inset-0 rounded-full border-2 border-slate-700"
          aria-hidden="true"
        />
        {/* Spinning arc — motion-safe only */}
        <span
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400 motion-safe:animate-spin"
          aria-hidden="true"
        />
      </div>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

/** Skeleton shimmer rows for list/table loading. */
function SkeletonRows({ rows }: { rows: number }) {
  return (
    <div className="w-full space-y-3 px-4" role="status" aria-label="Loading content">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="space-y-2 rounded-md border border-slate-800 bg-slate-900 p-3"
          style={{ opacity: 1 - i * 0.15 }}
        >
          {/* Title row */}
          <div
            className="h-3 rounded bg-slate-800 motion-safe:animate-pulse"
            style={{ width: `${60 + Math.sin(i * 1.7) * 20}%` }}
          />
          {/* Score bar mock */}
          <div className="h-2 w-full rounded-full bg-slate-800 motion-safe:animate-pulse" />
          {/* Subtitle */}
          <div
            className="h-2.5 rounded bg-slate-800/70 motion-safe:animate-pulse"
            style={{ width: `${40 + Math.sin(i * 2.3) * 25}%` }}
          />
        </div>
      ))}
    </div>
  );
}

/** Animated graph-node placeholder for the graph pane. */
function GraphPlaceholder() {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      role="status"
      aria-label="Loading graph"
    >
      <span className="sr-only">Loading graph…</span>
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Static edge lines */}
        <line x1="100" y1="100" x2="40" y2="60" stroke="#1e293b" strokeWidth="2" />
        <line x1="100" y1="100" x2="160" y2="60" stroke="#1e293b" strokeWidth="2" />
        <line x1="100" y1="100" x2="40" y2="140" stroke="#1e293b" strokeWidth="2" />
        <line x1="100" y1="100" x2="160" y2="140" stroke="#1e293b" strokeWidth="2" />
        <line x1="100" y1="100" x2="100" y2="30" stroke="#1e293b" strokeWidth="2" />

        {/* Outer nodes — static */}
        <circle cx="40" cy="60" r="10" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
        <circle cx="160" cy="60" r="10" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
        <circle cx="40" cy="140" r="10" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
        <circle cx="160" cy="140" r="10" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
        <circle cx="100" cy="30" r="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />

        {/* Central node — pulses with motion-safe animation via CSS class */}
        <circle
          cx="100"
          cy="100"
          r="16"
          fill="#1e2940"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeOpacity="0.6"
          className="motion-safe:animate-pulse"
        />
        <circle cx="100" cy="100" r="6" fill="#f59e0b" fillOpacity="0.3" />
      </svg>
    </div>
  );
}

export default function LoadingState({
  label = 'Loading…',
  rows = 4,
  variant = 'spinner',
}: LoadingStateProps) {
  if (variant === 'skeleton') return <SkeletonRows rows={rows} />;
  if (variant === 'graph') return <GraphPlaceholder />;
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Spinner label={label} />
    </div>
  );
}
