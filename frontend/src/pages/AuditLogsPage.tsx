import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search, ChevronLeft, ChevronRight,
  LogIn, ShieldAlert, Settings, FileText, Eye, RefreshCw,
} from 'lucide-react';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../components/Feedback';
import { api, type AuditLog } from '../services/api';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  login: <LogIn size={14} className="text-blue-500" />,
  alert_resolved: <ShieldAlert size={14} className="text-emerald-500" />,
  alert_escalated: <ShieldAlert size={14} className="text-rose-500" />,
  threshold_updated: <Settings size={14} className="text-amber-500" />,
  rule_changed: <Settings size={14} className="text-violet-500" />,
  transaction_investigated: <Eye size={14} className="text-indigo-500" />,
  report_generated: <FileText size={14} className="text-teal-500" />,
};

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-blue-50 border-blue-200',
  alert_resolved: 'bg-emerald-50 border-emerald-200',
  alert_escalated: 'bg-rose-50 border-rose-200',
  threshold_updated: 'bg-amber-50 border-amber-200',
  rule_changed: 'bg-violet-50 border-violet-200',
  transaction_investigated: 'bg-indigo-50 border-indigo-200',
  report_generated: 'bg-teal-50 border-teal-200',
};

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', page, search, actionFilter],
    queryFn: () =>
      api.getAuditLogs({ page, per_page: 20, search, action: actionFilter }),
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  if (error) return <ErrorMessage message="Failed to load audit logs" />;

  return (
    <div className="space-y-5">
      {/* ─── Search & Filter ─── */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            type="text"
            placeholder="Search audit logs..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="">All Actions</option>
          <option value="login">Login Events</option>
          <option value="alert_resolved">Alert Resolved</option>
          <option value="alert_escalated">Alert Escalated</option>
          <option value="threshold_updated">Threshold Updated</option>
          <option value="rule_changed">Rule Changed</option>
          <option value="transaction_investigated">Investigated</option>
          <option value="report_generated">Report Generated</option>
        </select>
      </div>

      {/* ─── Timeline ─── */}
      {isLoading ? (
        <LoadingSpinner message="Loading audit logs..." />
      ) : !data?.items?.length ? (
        <div className="card">
          <EmptyState title="No audit logs found" />
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-[var(--color-border)]" />

          <div className="space-y-3 stagger-children">
            {data.items.map((log: AuditLog) => {
              const actionClass = ACTION_COLORS[log.action] || 'bg-[var(--color-surface-muted)] borderbg-[var(--color-surface-muted)]';
              return (
                <div key={log.id} className="relative pl-14">
                  {/* Timeline dot */}
                  <div className={`absolute left-4 top-4 w-5 h-5 rounded-full border-2 ${actionClass} flex items-center justify-center z-10 bg-[var(--color-surface)]`}>
                    {ACTION_ICONS[log.action] || <RefreshCw size={10} className="text-[var(--color-text-primary)]" />}
                  </div>

                  <div className={`card p-4 border ${actionClass} hover:shadow-md transition-all`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                            {log.action.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          {log.user_id && (
                            <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
                              by {log.user_id.slice(0, 12)}
                            </span>
                          )}
                        </div>
                        {log.details && (
                          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{log.details}</p>
                        )}
                        {log.ip_address && (
                          <p className="text-[11px] text-[var(--color-text-muted)] mt-1 font-mono">
                            IP: {log.ip_address}
                          </p>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--color-text-muted)] flex-shrink-0 whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Pagination ─── */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg hover:bg-[var(--color-surface)] disabled:opacity-30 transition"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-[var(--color-text-secondary)]">
            Page {page} of {data.total_pages}
          </span>
          <button
            onClick={() => setPage(Math.min(data.total_pages, page + 1))}
            disabled={page >= data.total_pages}
            className="p-2 rounded-lg hover:bg-[var(--color-surface)] disabled:opacity-30 transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
