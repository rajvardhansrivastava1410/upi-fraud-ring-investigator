'use client';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: 'graph' | 'queue' | 'search';
}

const ICONS = {
  graph: (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="7" fill="#000000" stroke="#00ff66" strokeWidth="2" />
      <circle cx="12" cy="20" r="4" fill="#000000" stroke="#00ff66" strokeWidth="1.5" />
      <circle cx="52" cy="20" r="4" fill="#000000" stroke="#ff003f" strokeWidth="1.5" />
      <circle cx="12" cy="44" r="4" fill="#000000" stroke="#00ff66" strokeWidth="1.5" />
      <circle cx="52" cy="44" r="4" fill="#000000" stroke="#ff003f" strokeWidth="1.5" />
      <line x1="16" y1="22" x2="27" y2="28" stroke="#00ff66" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="48" y1="22" x2="37" y2="28" stroke="#ff003f" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="16" y1="42" x2="27" y2="36" stroke="#00ff66" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="48" y1="42" x2="37" y2="36" stroke="#ff003f" strokeWidth="1.5" strokeDasharray="3 2" />
      <circle cx="32" cy="32" r="2.5" fill="#00ff66" />
    </svg>
  ),
  queue: (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="8" y="14" width="48" height="8" rx="2" fill="#000000" stroke="#00ff66" strokeWidth="1.5" />
      <rect x="8" y="28" width="36" height="8" rx="2" fill="#000000" stroke="#00ff66" strokeWidth="1.5" />
      <rect x="8" y="42" width="24" height="8" rx="2" fill="#000000" stroke="#ff003f" strokeWidth="1.5" />
      <circle cx="54" cy="46" r="5" fill="#000000" stroke="#00ff66" strokeWidth="1.5" />
      <line x1="54" y1="43" x2="54" y2="46" stroke="#00ff66" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="54" cy="48.5" r="0.8" fill="#00ff66" />
    </svg>
  ),
  search: (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="27" cy="27" r="14" fill="#000000" stroke="#00ff66" strokeWidth="1.5" />
      <circle cx="27" cy="27" r="8" fill="none" stroke="#00ff66" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="37" y1="37" x2="52" y2="52" stroke="#00ff66" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="27" cy="27" r="2" fill="#00ff66" opacity="0.8" />
    </svg>
  ),
};

export default function EmptyState({
  title = 'Nothing selected',
  description = 'Select an alert from the queue to begin investigation.',
  icon = 'graph',
}: EmptyStateProps) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center font-mono bg-black"
      role="status"
      aria-label={title}
    >
      <div className="opacity-80">{ICONS[icon]}</div>
      <div className="space-y-1">
        <p className="text-xs font-bold text-white uppercase tracking-wider">{title}</p>
        <p className="max-w-xs text-[11px] text-slate-400">{description}</p>
      </div>
    </div>
  );
}
