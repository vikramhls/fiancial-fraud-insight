import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { StatusBadge } from '../components/Badges';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../components/Feedback';
import { api, type Transaction } from '../services/api';

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [minRisk, setMinRisk] = useState('');
  const [maxRisk, setMaxRisk] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions', page, perPage, search, statusFilter, sortBy, sortOrder, minRisk, maxRisk, minAmount, maxAmount],
    queryFn: () =>
      api.getTransactions({
        page,
        per_page: perPage,
        search,
        status: statusFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        min_risk: minRisk,
        max_risk: maxRisk,
        min_amount: minAmount,
        max_amount: maxAmount,
      }),
  });

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 font-bold';
    if (score >= 40) return 'text-amber-600 font-semibold';
    return 'text-emerald-600';
  };

  if (error) return <ErrorMessage message="Failed to load transactions" />;

  return (
    <div className="space-y-5">
      {/* ─── Search & Filter Bar ─── */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              type="text"
              placeholder="Search by Transaction ID, User ID, or Country..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="safe">Safe</option>
            <option value="review">Review</option>
            <option value="fraud">Fraud</option>
          </select>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors
              ${showFilters
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:bg-gray-100'
              }`}
          >
            <SlidersHorizontal size={14} />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--color-border)] animate-fade-in">
            <div>
              <label className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Min Risk</label>
              <input
                type="number" min="0" max="100" value={minRisk}
                onChange={(e) => { setMinRisk(e.target.value); setPage(1); }}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Max Risk</label>
              <input
                type="number" min="0" max="100" value={maxRisk}
                onChange={(e) => { setMaxRisk(e.target.value); setPage(1); }}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                placeholder="100"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Min Amount</label>
              <input
                type="number" min="0" value={minAmount}
                onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                placeholder="$0"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Max Amount</label>
              <input
                type="number" min="0" value={maxAmount}
                onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                placeholder="No limit"
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── Table ─── */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading transactions..." />
        ) : !data?.items?.length ? (
          <EmptyState title="No transactions found" description="Try adjusting your filters" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                    {[
                      { key: 'id', label: 'Transaction ID' },
                      { key: 'user_id', label: 'User ID' },
                      { key: 'amount', label: 'Amount', sortable: true },
                      { key: 'country', label: 'Country' },
                      { key: 'type', label: 'Type' },
                      { key: 'timestamp', label: 'Timestamp', sortable: true },
                      { key: 'risk_score', label: 'Risk Score', sortable: true },
                      { key: 'status', label: 'Status', sortable: true },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={col.sortable ? () => handleSort(col.key) : undefined}
                        className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]
                          ${col.sortable ? 'cursor-pointer hover:text-[var(--color-text-primary)] select-none' : ''}`}
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          {col.sortable && sortBy === col.key && (
                            <ArrowUpDown size={12} className="text-blue-500" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((txn: Transaction, idx: number) => (
                    <tr
                      key={txn.id}
                      onClick={() => navigate(`/admin/transactions/${txn.id}`)}
                      className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-blue-50/50 cursor-pointer transition-colors"
                      style={{ animationDelay: `${idx * 20}ms` }}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 font-medium">
                        {txn.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)] font-medium">
                        {txn.user_id}
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(txn.amount)}</td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">{txn.country}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-[11px] font-medium text-gray-600">
                          {txn.transaction_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                        {formatDate(txn.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                txn.risk_score >= 80 ? 'bg-red-500' : txn.risk_score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${txn.risk_score}%` }}
                            />
                          </div>
                          <span className={`text-xs ${getRiskColor(txn.risk_score)}`}>
                            {txn.risk_score.toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={txn.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <p className="text-xs text-[var(--color-text-muted)]">
                Showing {(page - 1) * perPage + 1} - {Math.min(page * perPage, data.total)} of{' '}
                <span className="font-semibold">{data.total}</span> transactions
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, data.total_pages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, data.total_pages - 4)) + i;
                  if (p > data.total_pages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition
                        ${p === page
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-[var(--color-text-secondary)] hover:bg-white'
                        }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(data.total_pages, page + 1))}
                  disabled={page >= data.total_pages}
                  className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
