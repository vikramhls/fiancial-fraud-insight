import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ShieldX, ShieldAlert, BrainCircuit, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, AlertTriangle, Loader2, Sparkles,
} from 'lucide-react';
import { StatusBadge, SeverityBadge } from '../components/Badges';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../components/Feedback';
import { api } from '../services/api';

interface FlaggedTransaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  country: string;
  transaction_type: string;
  timestamp: string;
  risk_score: number;
  status: string;
  fraud_probability: number | null;
  old_balance_org: number;
  new_balance_org: number;
  old_balance_dest: number;
  new_balance_dest: number;
  insights: Array<{
    id: string;
    label: string;
    description: string;
    severity: string;
    category: string;
  }>;
  alert_count: number;
  alerts: Array<{
    id: string;
    severity: string;
    reason: string;
    status: string;
  }>;
}

export default function FlaggedTransactionsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['flagged-transactions', page, severity],
    queryFn: () => api.getFlaggedTransactions({ page, per_page: 15, severity }),
  });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const requestAIExplanation = async (txnId: string) => {
    if (aiExplanation[txnId]) return; // Already fetched
    setAiLoading((prev) => ({ ...prev, [txnId]: true }));
    try {
      const res = await api.explainTransaction(txnId);
      setAiExplanation((prev) => ({ ...prev, [txnId]: res.reply }));
    } catch {
      setAiExplanation((prev) => ({
        ...prev,
        [txnId]: '⚠️ Failed to generate AI explanation. Please check your Gemini API key.',
      }));
    } finally {
      setAiLoading((prev) => ({ ...prev, [txnId]: false }));
    }
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-indigo-50 text-xs font-mono text-indigo-700">$1</code>')
      .replace(/^- (.*)/gm, '<li class="ml-4 list-disc text-sm leading-relaxed">$1</li>')
      .replace(/^### (.*)/gm, '<h4 class="font-bold text-sm mt-3 mb-1 text-[var(--color-text-primary)]">$1</h4>')
      .replace(/^## (.*)/gm, '<h3 class="font-bold text-base mt-4 mb-1 text-[var(--color-text-primary)]">$1</h3>')
      .replace(/\n/g, '<br/>');
  };

  if (error) return <ErrorMessage message="Failed to load flagged transactions" />;

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <ShieldX size={22} className="text-red-500" />
            Flagged Transactions
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            All transactions flagged as fraud or requiring review, with AI-powered explanations
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Severity filter */}
          <select
            value={severity}
            onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 cursor-pointer"
          >
            <option value="">All Flagged</option>
            <option value="fraud">🚨 Fraud Only</option>
            <option value="review">⚠️ Review Only</option>
          </select>

          {data && (
            <div className="text-xs text-[var(--color-text-muted)] font-medium">
              {data.total} flagged transactions
            </div>
          )}
        </div>
      </div>

      {/* ─── Transaction Cards ─── */}
      {isLoading ? (
        <LoadingSpinner message="Loading flagged transactions..." />
      ) : !data?.items?.length ? (
        <EmptyState title="No flagged transactions" description="All transactions are clean!" />
      ) : (
        <div className="space-y-4">
          {data.items.map((txn: FlaggedTransaction) => (
            <div
              key={txn.id}
              className={`card overflow-hidden transition-all duration-300 ${
                txn.status === 'fraud'
                  ? 'border-l-4 border-l-red-500'
                  : 'border-l-4 border-l-amber-500'
              }`}
            >
              {/* Main Row */}
              <div
                className="p-5 cursor-pointer hover:bg-[var(--color-surface-muted)] transition-colors"
                onClick={() => toggleExpand(txn.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Risk Badge */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                      txn.status === 'fraud'
                        ? 'bg-gradient-to-br from-red-500 to-rose-700'
                        : 'bg-gradient-to-br from-amber-500 to-orange-600'
                    }`}>
                      {txn.risk_score.toFixed(0)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-[var(--color-text-primary)]">
                          {formatCurrency(txn.amount)}
                        </span>
                        <StatusBadge status={txn.status} />
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-[10px] font-medium text-[var(--color-text-secondary)]">
                          {txn.transaction_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                        <span className="font-mono">{txn.id.slice(0, 8)}...</span>
                        <span>·</span>
                        <span>{txn.user_id}</span>
                        <span>·</span>
                        <span>{txn.country}</span>
                        <span>·</span>
                        <span>{formatDate(txn.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Insight count */}
                    {txn.insights.length > 0 && (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                        <AlertTriangle size={12} />
                        {txn.insights.length} risk signals
                      </span>
                    )}
                    {expandedId === txn.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === txn.id && (
                <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] animate-fade-in">
                  {/* ML Insights */}
                  {txn.insights.length > 0 && (
                    <div className="p-5 border-b border-[var(--color-border)]">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3 flex items-center gap-2">
                        <BrainCircuit size={14} className="text-amber-500" />
                        ML Model Risk Signals — Why This Was Flagged
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {txn.insights.map((insight) => (
                          <div
                            key={insight.id}
                            className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-start gap-3"
                          >
                            <SeverityBadge severity={insight.severity as any} />
                            <div>
                              <h5 className="text-sm font-semibold text-[var(--color-text-primary)]">
                                {insight.label}
                              </h5>
                              <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                                {insight.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Balance Details */}
                  <div className="p-5 border-b border-[var(--color-border)]">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                      Balance Movement
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                        <p className="text-[11px] text-[var(--color-text-muted)]">Sender Before</p>
                        <p className="text-sm font-bold mt-0.5">{formatCurrency(txn.old_balance_org)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                        <p className="text-[11px] text-[var(--color-text-muted)]">Sender After</p>
                        <p className={`text-sm font-bold mt-0.5 ${txn.new_balance_org === 0 ? 'text-red-600' : ''}`}>
                          {formatCurrency(txn.new_balance_org)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                        <p className="text-[11px] text-[var(--color-text-muted)]">Receiver Before</p>
                        <p className="text-sm font-bold mt-0.5">{formatCurrency(txn.old_balance_dest)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                        <p className="text-[11px] text-[var(--color-text-muted)]">Receiver After</p>
                        <p className="text-sm font-bold mt-0.5">{formatCurrency(txn.new_balance_dest)}</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Explanation */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
                        <Sparkles size={14} />
                        AI-Powered Deep Analysis
                      </h4>
                      {!aiExplanation[txn.id] && !aiLoading[txn.id] && (
                        <button
                          onClick={(e) => { e.stopPropagation(); requestAIExplanation(txn.id); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
                        >
                          <BrainCircuit size={13} />
                          Generate AI Explanation
                        </button>
                      )}
                    </div>

                    {aiLoading[txn.id] && (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                        <Loader2 size={18} className="text-indigo-600 animate-spin" />
                        <span className="text-sm text-indigo-700 font-medium">
                          Gemini is analyzing this transaction with RAG...
                        </span>
                      </div>
                    )}

                    {aiExplanation[txn.id] && (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100">
                        <div
                          className="text-sm text-[var(--color-text-primary)] leading-relaxed ai-response-content"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(aiExplanation[txn.id]) }}
                        />
                      </div>
                    )}

                    {!aiExplanation[txn.id] && !aiLoading[txn.id] && (
                      <p className="text-xs text-[var(--color-text-muted)] italic">
                        Click "Generate AI Explanation" to get a detailed, Gemini-powered analysis of why this transaction was flagged.
                      </p>
                    )}
                  </div>

                  {/* View Full Details Button */}
                  <div className="px-5 pb-5">
                    <button
                      onClick={() => navigate(`/admin/transactions/${txn.id}`)}
                      className="w-full py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      View Full Transaction Details →
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {data.total_pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-[var(--color-text-muted)]">
                Page {data.page} of {data.total_pages} · {data.total} total
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg hover:bg-[var(--color-surface)] border border-[var(--color-border)] disabled:opacity-30 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(Math.min(data.total_pages, page + 1))}
                  disabled={page >= data.total_pages}
                  className="p-2 rounded-lg hover:bg-[var(--color-surface)] border border-[var(--color-border)] disabled:opacity-30 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
