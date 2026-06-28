interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const s = status?.toLowerCase();
  const baseClass = size === 'sm' ? 'badge text-[11px]' : 'badge';

  if (s === 'safe') return <span className={`${baseClass} badge-safe`}>● Safe</span>;
  if (s === 'review') return <span className={`${baseClass} badge-review`}>◆ Review</span>;
  if (s === 'fraud') return <span className={`${baseClass} badge-fraud`}>▲ Fraud</span>;
  if (s === 'pending') return <span className={`${baseClass} bg-gray-100 text-gray-600`}>○ Pending</span>;
  return <span className={`${baseClass} bg-gray-100 text-gray-600`}>{status}</span>;
}

export function SeverityBadge({ severity }: { severity: string }) {
  const s = severity?.toLowerCase();
  const map: Record<string, string> = {
    low: 'severity-low',
    medium: 'severity-medium',
    high: 'severity-high',
    critical: 'severity-critical',
  };
  return (
    <span className={`badge text-[11px] ${map[s] || 'bg-gray-100 text-gray-600'}`}>
      {severity?.toUpperCase()}
    </span>
  );
}

export function AlertStatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const map: Record<string, string> = {
    open: 'badge-open',
    resolved: 'badge-resolved',
    escalated: 'badge-escalated',
  };
  return (
    <span className={`badge text-[11px] ${map[s] || 'bg-gray-100 text-gray-600'}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}
