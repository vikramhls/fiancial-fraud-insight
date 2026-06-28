import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Clock, User, CreditCard,
  ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, BrainCircuit,
} from 'lucide-react';
import { StatusBadge, SeverityBadge, AlertStatusBadge } from '../components/Badges';
import { LoadingSpinner, ErrorMessage } from '../components/Feedback';
import { api } from '../services/api';

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: txn, isLoading, error } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => api.getTransaction(id!),
    enabled: !!id,
  });

  if (isLoading) return <LoadingSpinner message="Loading transaction details..." />;
  if (error || !txn) return <ErrorMessage message="Transaction not found" />;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

  const riskLevel = txn.risk_score >= 80 ? 'fraud' : txn.risk_score >= 40 ? 'review' : 'safe';
  const RiskIcon = riskLevel === 'fraud' ? ShieldX : riskLevel === 'review' ? ShieldAlert : ShieldCheck;
  const riskGradient = riskLevel === 'fraud'
    ? 'from-red-500 to-rose-700'
    : riskLevel === 'review'
    ? 'from-amber-500 to-orange-600'
    : 'from-emerald-500 to-teal-700';

  return (
    <div className="space-y-6">
      {/* ─── Back Button ─── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Transactions
      </button>

      {/* ─── Header ─── */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
                Transaction Details
              </h1>
              <StatusBadge status={txn.status} size="md" />
            </div>
            <p className="text-sm text-[var(--color-text-muted)] font-mono">{txn.id}</p>
          </div>
          <div className={`flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r ${riskGradient} text-white shadow-lg`}>
            <RiskIcon size={24} />
            <div>
              <p className="text-[11px] uppercase tracking-wider opacity-80">Risk Score</p>
              <p className="text-2xl font-bold">{txn.risk_score.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Info Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
        {/* Transaction Info */}
        <div className="card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4 flex items-center gap-2">
            <CreditCard size={14} />
            Transaction Information
          </h3>
          <div className="space-y-3">
            <InfoRow label="Amount" value={formatCurrency(txn.amount)} highlight />
            <InfoRow label="Currency" value={txn.currency} />
            <InfoRow label="Type" value={txn.transaction_type} />
            <InfoRow label="Timestamp" value={formatDate(txn.timestamp)} />
          </div>
        </div>

        {/* User & Device */}
        <div className="card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4 flex items-center gap-2">
            <User size={14} />
            User & Device
          </h3>
          <div className="space-y-3">
            <InfoRow label="User ID" value={txn.user_id} />
            <InfoRow label="Country" value={txn.country} />
            <InfoRow label="Device ID" value={txn.device_id || 'N/A'} />
          </div>
        </div>

        {/* Risk Analysis */}
        <div className="card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4 flex items-center gap-2">
            <AlertTriangle size={14} />
            Risk Analysis
          </h3>
          <div className="space-y-3">
            <InfoRow label="Final Risk Score" value={txn.risk_score.toFixed(2)} />
            <InfoRow label="Raw ML Score" value={txn.fraud_probability != null ? `${(txn.fraud_probability * 100).toFixed(2)}` : 'N/A'} />
            <InfoRow label="Model Version" value={txn.model_version || 'N/A'} />
            <InfoRow label="Classification" value={txn.status.toUpperCase()} />
          </div>
        </div>
      </div>

      {/* ─── AI Explainability ─── */}
      {txn.insights && txn.insights.length > 0 && (
        <div className="card p-5 border-l-4 border-l-amber-500 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
              <BrainCircuit size={16} className="text-amber-500" />
              AI Explainability
            </h3>
            <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              {txn.insights.length} Risk Signals Detected
            </span>
          </div>
          
          <div className="space-y-3">
            {txn.insights.map((insight) => (
              <div 
                key={insight.id} 
                className={`p-3 rounded-lg border border-${insight.severity === 'critical' ? 'red' : insight.severity === 'high' ? 'amber' : 'blue'}-200 bg-${insight.severity === 'critical' ? 'red' : insight.severity === 'high' ? 'amber' : 'blue'}-50/30 flex items-start gap-3`}
              >
                <div className="mt-0.5">
                  <SeverityBadge severity={insight.severity as any} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">{insight.label}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">Risk Factor Progress</span>
              <span className="text-xs font-bold text-[var(--color-text-primary)]">{Math.min(100, txn.insights.length * 20)}%</span>
            </div>
            <div className="insight-bar-container">
              <div 
                className="insight-bar-fill bg-gradient-to-r from-amber-400 to-red-500" 
                style={{ width: `${Math.min(100, txn.insights.length * 20)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Balance Information ─── */}
      <div className="card p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
          Balance Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <BalanceCard label="Sender (Before)" value={formatCurrency(txn.old_balance_org)} />
          <BalanceCard label="Sender (After)" value={formatCurrency(txn.new_balance_org)} />
          <BalanceCard label="Receiver (Before)" value={formatCurrency(txn.old_balance_dest)} />
          <BalanceCard label="Receiver (After)" value={formatCurrency(txn.new_balance_dest)} />
        </div>
      </div>

      {/* ─── Timeline ─── */}
      <div className="card p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-6 flex items-center gap-2">
          <Clock size={14} />
          Processing Timeline
        </h3>
        <div className="flex items-start gap-0">
          {[
            { label: 'Transaction Created', status: 'complete', time: formatDate(txn.timestamp) },
            { label: 'Risk Evaluated', status: 'complete', time: 'ML Pipeline' },
            { label: 'Decision Generated', status: 'complete', time: txn.status.toUpperCase() },
          ].map((step, i, arr) => (
            <div key={i} className="flex-1 flex flex-col items-center text-center">
              <div className="relative flex items-center w-full justify-center">
                {i > 0 && <div className="absolute left-0 right-1/2 h-0.5 bg-emerald-400 top-1/2" />}
                {i < arr.length - 1 && <div className="absolute left-1/2 right-0 h-0.5 bg-emerald-400 top-1/2" />}
                <div className="relative z-10 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                </div>
              </div>
              <p className="text-xs font-semibold mt-2 text-[var(--color-text-primary)]">{step.label}</p>
              <p className="text-[11px] text-[var(--color-text-muted)]">{step.time}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Related Alerts ─── */}
      {txn.alerts && txn.alerts.length > 0 && (
        <div className="card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4 flex items-center gap-2">
            <ShieldAlert size={14} />
            Related Alerts ({txn.alerts.length})
          </h3>
          <div className="space-y-3">
            {txn.alerts.map((alert) => (
              <div key={alert.id} className="flex items-start justify-between p-3 rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge severity={alert.severity} />
                    <AlertStatusBadge status={alert.status} />
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">{alert.reason}</p>
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  {new Date(alert.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
      <span className={`text-sm ${highlight ? 'font-bold text-[var(--color-text-primary)]' : 'font-medium text-[var(--color-text-secondary)]'}`}>
        {value}
      </span>
    </div>
  );
}

function BalanceCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
      <p className="text-[11px] text-[var(--color-text-muted)] font-medium">{label}</p>
      <p className="text-sm font-bold text-[var(--color-text-primary)] mt-1">{value}</p>
    </div>
  );
}
