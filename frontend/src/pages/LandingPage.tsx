import { Link } from 'react-router-dom';
import { Shield, Building2, Lock, Zap, ArrowRight, Activity } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-navy-950)] text-white overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="absolute top-0 w-full p-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">FinShield AI</h1>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-[var(--color-navy-200)] hover:text-white transition-colors">Features</a>
          <a href="#demo" className="text-sm font-medium text-[var(--color-navy-200)] hover:text-white transition-colors">Demo</a>
          <Link 
            to="/admin"
            className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-bold border border-white/10 transition-colors"
          >
            Analyst Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4 pt-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-widest mb-8 animate-fade-in">
          <Activity size={14} />
          <span>Real-time Fraud Detection</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl leading-tight animate-slide-in">
          Protecting the Future of <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Digital Transactions
          </span>
        </h1>

        <p className="text-lg md:text-xl text-[var(--color-navy-200)] max-w-2xl mb-12 leading-relaxed animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Experience our XGBoost-powered fraud engine in action. Simulate real transactions and watch our AI instantly analyze, score, and classify risk.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Link
            to="/banking/login"
            className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-white text-[var(--color-navy-950)] text-base font-bold hover:shadow-xl hover:shadow-white/10 transition-all hover:-translate-y-0.5"
          >
            <Building2 size={20} />
            <span>Enter Customer Portal</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            to="/admin"
            className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-blue-600/20 border border-blue-500/30 text-white text-base font-bold hover:bg-blue-600/30 transition-all hover:-translate-y-0.5"
          >
            <Shield size={20} className="text-blue-400" />
            <span>Enter Risk Dashboard</span>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto w-full text-left animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-5">
              <Zap size={24} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Sub-millisecond Scoring</h3>
            <p className="text-sm text-[var(--color-navy-300)] leading-relaxed">
              Every transaction is evaluated instantly before authorization, preventing money from ever leaving the system.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-5">
              <Lock size={24} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Pattern Recognition</h3>
            <p className="text-sm text-[var(--color-navy-300)] leading-relaxed">
              Detects complex laundering patterns like account draining, rapid transfers, and abnormal balances.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-5">
              <Shield size={24} className="text-purple-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Explainable AI</h3>
            <p className="text-sm text-[var(--color-navy-300)] leading-relaxed">
              Actionable insights clearly explain exactly why a transaction was flagged, accelerating analyst review.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
