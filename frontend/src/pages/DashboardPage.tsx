import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  ShieldAlert,
  Gauge,
  DollarSign,
  Target,
  Bell,
  Eye,
  Zap,
  TrendingUp,
  AlertTriangle,
  BarChart2,
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import MetricCard from '../components/MetricCard';
import { LoadingSpinner, ErrorMessage } from '../components/Feedback';
import { api } from '../services/api';

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'];

export default function DashboardPage() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: api.getDashboardMetrics,
    refetchInterval: 30000,
  });

  const { data: trends } = useQuery({
    queryKey: ['fraud-trends'],
    queryFn: () => api.getFraudTrends(30),
  });

  const { data: volume } = useQuery({
    queryKey: ['volume-by-day'],
    queryFn: api.getVolumeByDay,
  });

  const { data: riskDist } = useQuery({
    queryKey: ['risk-distribution'],
    queryFn: api.getRiskDistribution,
  });

  const { data: insightsData } = useQuery({
    queryKey: ['actionable-insights'],
    queryFn: api.getActionableInsights,
  });

  if (isLoading) return <LoadingSpinner message="Loading dashboard metrics..." />;
  if (error) return <ErrorMessage message="Failed to load dashboard" />;

  const pieData = [
    { name: 'Safe', value: (metrics?.total_transactions_today || 0) - (metrics?.fraudulent_transactions || 0) - (metrics?.review_transactions || 0) },
    { name: 'Review', value: metrics?.review_transactions || 0 },
    { name: 'Fraud', value: metrics?.fraudulent_transactions || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      {/* ─── Actionable Insights ─── */}
      {insightsData && insightsData.insights.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Zap className="text-amber-500" size={20} />
                Actionable Insights
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                AI-generated patterns from {insightsData.summary.total_fraud} detected frauds
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
            {insightsData.insights.slice(0, 3).map((insight) => (
              <div 
                key={insight.id} 
                className={`insight-card insight-severity-${insight.severity} p-5 flex flex-col h-full`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-${insight.color}-100 text-${insight.color}-600`}>
                    {insight.icon === 'shield-alert' && <ShieldAlert size={18} />}
                    {insight.icon === 'trending-up' && <TrendingUp size={18} />}
                    {insight.icon === 'alert-triangle' && <AlertTriangle size={18} />}
                    {insight.icon === 'zap' && <Zap size={18} />}
                    {insight.icon === 'bar-chart-2' && <BarChart2 size={18} />}
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold text-${insight.color}-600`}>{insight.stat}</span>
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">{insight.stat_label}</p>
                  </div>
                </div>
                
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">{insight.title}</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mb-4 flex-grow">{insight.description}</p>
                
                <div className="mt-auto pt-3 border-t border-[var(--color-border)]">
                  <p className="text-[11px] font-medium text-[var(--color-text-primary)]">
                    <span className="text-[var(--color-text-muted)] mr-1">Recommended Action:</span> 
                    {insight.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Metric Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 stagger-children">
        <MetricCard
          title="Total Transactions"
          value={metrics?.total_transactions_today?.toLocaleString() || '0'}
          icon={<ArrowLeftRight size={20} />}
          color="blue"
          trend={12}
          trendLabel="vs last period"
        />
        <MetricCard
          title="Fraudulent"
          value={metrics?.fraudulent_transactions?.toLocaleString() || '0'}
          icon={<ShieldAlert size={20} />}
          color="red"
          trend={-8}
          trendLabel="reduced"
        />
        <MetricCard
          title="Avg Risk Score"
          value={metrics?.average_risk_score?.toFixed(1) || '0'}
          icon={<Gauge size={20} />}
          color="amber"
        />
        <MetricCard
          title="Revenue Processed"
          value={`$${((metrics?.total_revenue_processed || 0) / 1e6).toFixed(1)}M`}
          icon={<DollarSign size={20} />}
          color="green"
          trend={15}
          trendLabel="growth"
        />
        <MetricCard
          title="Model Precision"
          value={`${metrics?.model_precision?.toFixed(1) || 0}%`}
          icon={<Target size={20} />}
          color="purple"
        />
      </div>

      {/* ─── Charts Row 1 ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fraud Trends */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Fraud Trends
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Daily fraud vs total transactions (30 days)
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Total
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Fraud
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trends || []}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradFraud" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Area type="monotone" dataKey="total_count" stroke="#3b82f6" strokeWidth={2} fill="url(#gradTotal)" />
              <Area type="monotone" dataKey="fraud_count" stroke="#ef4444" strokeWidth={2} fill="url(#gradFraud)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
            Status Distribution
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            Transaction classification breakdown
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-5 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[i] }}
                />
                <span className="text-[var(--color-text-secondary)] font-medium">
                  {d.name} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Charts Row 2 ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume by Day */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
            Transaction Volume
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-6">Daily transaction count</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={volume || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="volume" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
            Risk Score Distribution
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-6">Histogram of risk scores</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={riskDist || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                fill="#f59e0b"
              >
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
      </div>

      {/* ─── Summary Row ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
              <Bell size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Open Alerts</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Requiring attention</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">
            {metrics?.open_alerts || 0}
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
              <Eye size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Under Review</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Awaiting investigation</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">
            {metrics?.review_transactions || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
