import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShieldAlert,
  ShieldX,
  BarChart3,
  ScrollText,
  Shield,
  Bell,
  ChevronRight,
  User,
  LogOut,
  BrainCircuit,
} from 'lucide-react';
import AIChatPanel from './AIChatPanel';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/admin/flagged', icon: ShieldX, label: 'Flagged (AI)' },
  { to: '/admin/alerts', icon: ShieldAlert, label: 'Fraud Alerts' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/audit-logs', icon: ScrollText, label: 'Audit Logs' },
];

export default function Layout() {
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);

  // Derive page title from the route
  const currentNav = navItems.find((n) => n.to === location.pathname);
  const pageTitle = currentNav?.label || 'Transaction Details';

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-elevated)]">
      {/* ─── Sidebar ─── */}
      <aside className="w-[260px] flex-shrink-0 flex flex-col bg-[var(--color-navy-950)] text-white">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">FinProtector</h1>
            <p className="text-[11px] text-[var(--color-navy-400)] font-medium tracking-wide uppercase">
              Fraud Detection
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-navy-500)]">
            Main Menu
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/10 text-white shadow-sm'
                    : 'text-[var(--color-navy-300)] hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={18}
                    className={
                      isActive
                        ? 'text-blue-400'
                        : 'text-[var(--color-navy-500)] group-hover:text-[var(--color-navy-300)]'
                    }
                  />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <ChevronRight size={14} className="text-blue-400 opacity-60" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* AI Chat Button */}
        <div className="px-3 py-3 border-t border-white/10">
          <button
            onClick={() => setChatOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600/20 to-blue-600/20 border border-indigo-500/30 text-white hover:from-indigo-600/30 hover:to-blue-600/30 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
              <BrainCircuit size={16} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">AI Analyst</p>
              <p className="text-[10px] text-indigo-300">Gemini + RAG</p>
            </div>
            <Sparkle />
          </button>
        </div>

        {/* User Profile */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-xs font-bold">
              RA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Risk Admin</p>
              <p className="text-[11px] text-[var(--color-navy-500)]">admin@finprotector.ai</p>
            </div>
            <LogOut size={14} className="text-[var(--color-navy-500)] hover:text-white" />
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-8 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {pageTitle}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">System Online</span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-[var(--color-surface-muted)] transition-colors">
              <Bell size={18} className="text-[var(--color-text-secondary)]" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-2 pl-4 border-l border-[var(--color-border)]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* AI Chat Panel */}
      <AIChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}

// Tiny sparkle indicator
function Sparkle() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
    </span>
  );
}
