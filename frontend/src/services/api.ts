const API_BASE = '/api';

export interface TransactionCreate {
  user_id: string;
  amount: number;
  currency?: string;
  country: string;
  device_id?: string;
  transaction_type: string;
  old_balance_org: number;
  new_balance_org: number;
  old_balance_dest: number;
  new_balance_dest: number;
  step?: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  country: string;
  device_id: string | null;
  transaction_type: string;
  timestamp: string;
  risk_score: number;
  raw_risk_score: number | null;
  status: 'safe' | 'review' | 'fraud' | 'pending';
  old_balance_org: number;
  new_balance_org: number;
  old_balance_dest: number;
  new_balance_dest: number;
}

export interface InsightItem {
  id: string;
  label: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
  category: string;
}

export interface TransactionDetail extends Transaction {
  fraud_probability: number | null;
  model_version: string | null;
  insights: InsightItem[];
  alerts: Alert[];
}

export interface Alert {
  id: string;
  transaction_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  status: 'open' | 'resolved' | 'escalated';
  notes: string | null;
  created_at: string;
  amount?: number;
  user_id?: string;
  risk_score?: number;
  country?: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  details: string | null;
  ip_address: string | null;
  timestamp: string;
}

export interface DashboardMetrics {
  total_transactions_today: number;
  fraudulent_transactions: number;
  review_transactions: number;
  average_risk_score: number;
  total_revenue_processed: number;
  model_precision: number;
  open_alerts: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface FraudTrend {
  date: string;
  total_count: number;
  fraud_count: number;
}

export interface RiskBucket {
  bucket: string;
  count: number;
}

export interface VolumeDay {
  date: string;
  volume: number;
  amount: number;
}

export interface CountryFraud {
  country: string;
  total_count: number;
  fraud_count: number;
  fraud_rate: number;
}

export interface ActionableInsight {
  id: string;
  icon: string;
  title: string;
  stat: string;
  stat_label: string;
  description: string;
  action: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
  color: string;
}

export interface ActionableInsightsResponse {
  insights: ActionableInsight[];
  summary: {
    total_transactions: number;
    total_fraud: number;
    fraud_rate: number;
  };
}

// ─── Fetch helpers ──────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, { headers });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function patchJson<T>(url: string, body: object): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function postJson<T>(url: string, body: object): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ─── API Functions ──────────────────────────────────────────────────────

export const api = {
  // Auth
  login: (data: any) => postJson<any>('/auth/login', data),
  signup: (data: any) => postJson<any>('/auth/signup', data),

  // Dashboard
  getDashboardMetrics: () => fetchJson<DashboardMetrics>('/analytics/dashboard'),

  // Transactions
  createTransaction: (data: TransactionCreate) => postJson<Transaction>('/transactions', data),

  getTransactions: (params: Record<string, string | number>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) query.set(k, String(v));
    });
    return fetchJson<PaginatedResponse<Transaction>>(`/transactions?${query}`);
  },

  getTransaction: (id: string) => fetchJson<TransactionDetail>(`/transactions/${id}`),

  // Alerts
  getAlerts: (params: Record<string, string | number>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) query.set(k, String(v));
    });
    return fetchJson<PaginatedResponse<Alert>>(`/alerts?${query}`);
  },

  updateAlert: (id: string, body: { status?: string; notes?: string }) =>
    patchJson(`/alerts/${id}`, body),

  // Analytics
  getFraudTrends: (days?: number) =>
    fetchJson<FraudTrend[]>(`/analytics/fraud-trends${days ? `?days=${days}` : ''}`),
  getRiskDistribution: () => fetchJson<RiskBucket[]>('/analytics/risk-distribution'),
  getVolumeByDay: () => fetchJson<VolumeDay[]>('/analytics/volume-by-day'),
  getCountryFraud: () => fetchJson<CountryFraud[]>('/analytics/country-fraud'),
  getActionableInsights: () => fetchJson<ActionableInsightsResponse>('/analytics/actionable-insights'),

  // Audit Logs
  getAuditLogs: (params: Record<string, string | number>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) query.set(k, String(v));
    });
    return fetchJson<PaginatedResponse<AuditLog>>(`/audit-logs?${query}`);
  },

  // AI Chat (RAG)
  sendChatMessage: (message: string) => postJson<{ reply: string }>('/chat', { message }),
  explainTransaction: (transaction_id: string) =>
    postJson<{ reply: string }>('/chat/explain', { transaction_id }),
  getChatSuggestions: () => fetchJson<{ suggestions: Array<{ text: string; icon: string }> }>('/chat/suggestions'),

  // Flagged Transactions
  getFlaggedTransactions: (params: Record<string, string | number>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) query.set(k, String(v));
    });
    return fetchJson<any>(`/flagged?${query}`);
  },
};
