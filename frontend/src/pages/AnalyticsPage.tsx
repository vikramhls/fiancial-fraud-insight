import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { LoadingSpinner } from '../components/Feedback';
import { api, type CountryFraud } from '../services/api';

const TOOLTIP_STYLE = {
  background: 'var(--color-surface)',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

export default function AnalyticsPage() {
  const { data: trends, isLoading: loadingTrends } = useQuery({
    queryKey: ['fraud-trends-analytics'],
    queryFn: () => api.getFraudTrends(30),
  });
  const { data: riskDist, isLoading: loadingRisk } = useQuery({
    queryKey: ['risk-dist-analytics'],
    queryFn: api.getRiskDistribution,
  });
  const { data: volume, isLoading: loadingVolume } = useQuery({
    queryKey: ['volume-analytics'],
    queryFn: api.getVolumeByDay,
  });
  const { data: countryData, isLoading: loadingCountry } = useQuery({
    queryKey: ['country-fraud-analytics'],
    queryFn: api.getCountryFraud,
  });

  const isLoading = loadingTrends || loadingRisk || loadingVolume || loadingCountry;
  if (isLoading) return <LoadingSpinner message="Loading analytics..." />;

  return (
    <div className="space-y-6">
      {/* ─── Fraud Trends (Line Chart) ─── */}
      <div className="card p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
              Fraud Trends
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Daily fraud count vs total transactions over 30 days
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={trends || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d?.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line
              type="monotone" dataKey="total_count" stroke="#3b82f6" strokeWidth={2.5}
              dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} name="Total"
            />
            <Line
              type="monotone" dataKey="fraud_count" stroke="#ef4444" strokeWidth={2.5}
              dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }} name="Fraud"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Risk Distribution (Histogram) ─── */}
        <div className="card p-6 animate-fade-in">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
            Risk Score Distribution
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-6">
            Frequency of transactions by risk score range
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={riskDist || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {(riskDist || []).map((entry, idx) => {
                  const start = parseInt(entry.bucket);
                  let color = '#10b981';
                  if (start >= 70) color = '#ef4444';
                  else if (start >= 40) color = '#f59e0b';
                  return <Cell key={idx} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ─── Transaction Volume (Bar Chart) ─── */}
        <div className="card p-6 animate-fade-in">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
            Transaction Volume
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-6">
            Number of transactions processed per day
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={volume || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="volume" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Country Fraud Map (Table + Bars) ─── */}
      <div className="card p-6 animate-fade-in">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
          Country-Wise Fraud Analysis
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-6">
          Fraud rate and occurrence by region
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Country</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Total</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Fraud</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Fraud Rate</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] w-48">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {(countryData || []).slice(0, 15).map((c: CountryFraud) => {
                const maxFraudRate = Math.max(...(countryData || []).map(x => x.fraud_rate), 1);
                return (
                  <tr key={c.country} className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-muted)] transition-colors">
                    <td className="px-4 py-3 font-medium">{c.country}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{c.total_count}</td>
                    <td className="px-4 py-3">
                      <span className={c.fraud_count > 0 ? 'text-red-600 font-semibold' : 'text-[var(--color-text-muted)]'}>
                        {c.fraud_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${
                        c.fraud_rate > 15 ? 'text-red-600' : c.fraud_rate > 5 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {c.fraud_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            c.fraud_rate > 15 ? 'bg-red-500' : c.fraud_rate > 5 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max((c.fraud_rate / maxFraudRate) * 100, 2)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
