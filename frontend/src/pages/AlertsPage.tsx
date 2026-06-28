import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert, CheckCircle2, ArrowUpCircle, MessageSquare,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { SeverityBadge, AlertStatusBadge } from '../components/Badges';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../components/Feedback';
import { api, type Alert } from '../services/api';

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [noteText, setNoteText] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['alerts', page, statusFilter, severityFilter],
    queryFn: () =>
      api.getAlerts({ page, per_page: 20, status: statusFilter, severity: severityFilter }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { status?: string; notes?: string } }) =>
      api.updateAlert(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setSelectedAlert(null);
      setNoteText('');
    },
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const formatCurrency = (n?: number) =>
    n != null
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
      : '—';

  if (error) return <ErrorMessage message="Failed to load alerts" />;

  return (
    <div className="space-y-5">
      {/* ─── Filter Bar ─── */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="escalated">Escalated</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="">All Severity</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <ShieldAlert size={14} />
          <span>{data?.total || 0} total alerts</span>
        </div>
      </div>

      {/* ─── Alert Cards ─── */}
      {isLoading ? (
        <LoadingSpinner message="Loading alerts..." />
      ) : !data?.items?.length ? (
        <div className="card">
          <EmptyState title="No alerts found" description="Adjust your filters" />
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {data.items.map((alert: Alert) => (
            <div
              key={alert.id}
              className={`card p-5 transition-all duration-200 hover:shadow-md cursor-pointer
                ${selectedAlert?.id === alert.id ? 'ring-2 ring-blue-400 shadow-md' : ''}
                ${alert.severity === 'critical' ? 'border-l-4 border-l-red-500' : ''}
                ${alert.severity === 'high' ? 'border-l-4 border-l-orange-500' : ''}
              `}
              onClick={() => setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <SeverityBadge severity={alert.severity} />
                    <AlertStatusBadge status={alert.status} />
                    <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
                      {alert.id.slice(0, 8)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-primary)] font-medium leading-relaxed">
                    {alert.reason}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-muted)]">
                    <span>TXN: {alert.transaction_id.slice(0, 8)}...</span>
                    {alert.amount !== undefined && <span>{formatCurrency(alert.amount)}</span>}
                    {alert.country && <span>📍 {alert.country}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-[var(--color-text-muted)]">{formatDate(alert.created_at)}</p>
                  {alert.risk_score !== undefined && (
                    <p className={`text-sm font-bold mt-1 ${
                      alert.risk_score >= 80 ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      Risk: {alert.risk_score.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>

              {/* ─── Expanded Actions ─── */}
              {selectedAlert?.id === alert.id && (
                <div className="mt-4 pt-4 border-t border-[var(--color-border)] animate-fade-in">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateMutation.mutate({ id: alert.id, body: { status: 'resolved' } });
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors border border-emerald-200"
                    >
                      <CheckCircle2 size={14} /> Mark Resolved
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateMutation.mutate({ id: alert.id, body: { status: 'escalated' } });
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium hover:bg-rose-100 transition-colors border border-rose-200"
                    >
                      <ArrowUpCircle size={14} /> Escalate
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Add investigation notes..."
                      className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (noteText.trim()) {
                          updateMutation.mutate({ id: alert.id, body: { notes: noteText } });
                        }
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                    >
                      <MessageSquare size={14} /> Save
                    </button>
                  </div>
                  {alert.notes && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-xs font-medium text-amber-800">📝 Notes:</p>
                      <p className="text-xs text-amber-700 mt-1">{alert.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Pagination ─── */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg hover:bg-white disabled:opacity-30 transition"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-[var(--color-text-secondary)]">
            Page {page} of {data.total_pages}
          </span>
          <button
            onClick={() => setPage(Math.min(data.total_pages, page + 1))}
            disabled={page >= data.total_pages}
            className="p-2 rounded-lg hover:bg-white disabled:opacity-30 transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
