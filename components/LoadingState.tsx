'use client';

interface LoadingStateProps {
  label?: string;
  rows?: number;
  variant?: 'spinner' | 'skeleton' | 'graph';
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 font-mono" role="status" aria-label={label}>
      <div className="relative h-10 w-10">
        <span
          className="absolute inset-0 rounded-full border-2 border-slate-800"
          aria-hidden="true"
        />
        <span
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-green-400 animate-spin"
          aria-hidden="true"
        />
      </div>
      <p className="text-[11px] text-green-400 font-bold uppercase tracking-wider">{label}</p>
    </div>
  );
}

function SkeletonRows({ rows }: { rows: number }) {
  return (
    <div className="w-full space-y-3 px-4 font-mono" role="status" aria-label="Loading content">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="space-y-2 rounded-md border border-green-500/20 bg-black p-3"
          style={{ opacity: 1 - i * 0.15 }}
        >
          <div
            className="h-3 rounded bg-green-950/40 animate-pulse"
            style={{ width: `${60 + Math.sin(i * 1.7) * 20}%` }}
          />
          <div className="h-2 w-full rounded-full bg-slate-900 animate-pulse" />
          <div
            className="h-2.5 rounded bg-slate-900 animate-pulse"
            style={{ width: `${40 + Math.sin(i * 2.3) * 25}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function GraphSkeleton({ label }: { label: string }) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center font-mono bg-black"
      role="status"
      aria-label={label}
    >
      <div className="relative h-16 w-16">
        <span
          className="absolute inset-0 rounded-full border-2 border-green-500/30 animate-ping"
          aria-hidden="true"
        />
        <span
          className="absolute inset-2 rounded-full border border-green-400/50"
          aria-hidden="true"
        />
        <span
          className="absolute inset-0 flex items-center justify-center text-green-400 text-xs font-black"
          aria-hidden="true"
        >
          ₹
        </span>
      </div>
      <p className="text-xs text-green-300 font-black tracking-widest uppercase">{label}</p>
    </div>
  );
}

export default function LoadingState({
  label = 'Loading…',
  rows = 4,
  variant = 'spinner',
}: LoadingStateProps) {
  if (variant === 'skeleton') return <SkeletonRows rows={rows} />;
  if (variant === 'graph') return <GraphSkeleton label={label} />;
  return (
    <div className="flex h-full items-center justify-center p-8 bg-black">
      <Spinner label={label} />
    </div>
  );
}
