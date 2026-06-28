import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import TransactionDetailPage from './pages/TransactionDetailPage';
import AlertsPage from './pages/AlertsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import FlaggedTransactionsPage from './pages/FlaggedTransactionsPage';

// New Public / Banking Pages
import LandingPage from './pages/LandingPage';
import BankingLogin from './pages/BankingLogin';
import BankingSignup from './pages/BankingSignup';
import BankingDashboard from './pages/BankingDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public End-User Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/banking/login" element={<BankingLogin />} />
          <Route path="/banking/signup" element={<BankingSignup />} />
          <Route path="/banking/dashboard" element={<BankingDashboard />} />

          {/* Admin Risk Dashboard Routes */}
          <Route path="/admin" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="transactions/:id" element={<TransactionDetailPage />} />
            <Route path="flagged" element={<FlaggedTransactionsPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
