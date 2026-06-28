import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRightLeft, CreditCard, PieChart, Bell, User, Send, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, ArrowLeft } from 'lucide-react';
import { api, type TransactionCreate } from '../services/api';

export default function BankingDashboard() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(54320.50);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  
  // Submission State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'safe' | 'review' | 'fraud' | null>(null);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [rawRiskScore, setRawRiskScore] = useState<number | null>(null);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setLoading(true);
    setResult(null);
    setRiskScore(null);
    setRawRiskScore(null);

    const randomOldBalanceDest = Math.floor(Math.random() * 50000);
    const mockCountries = ["United States", "United Kingdom", "Germany", "France", "India", "Brazil", "Nigeria"];
    const randomCountry = mockCountries[Math.floor(Math.random() * mockCountries.length)];
    const randomUserId = `USR-${Math.floor(Math.random() * 200).toString().padStart(5, '0')}`;
    const randomDeviceId = `DEV-${Math.floor(Math.random() * 50).toString().padStart(4, '0')}`;

    const payload: TransactionCreate = {
      user_id: randomUserId,
      amount: numAmount,
      currency: 'USD',
      country: randomCountry,
      device_id: randomDeviceId,
      transaction_type: 'TRANSFER',
      old_balance_org: balance,
      new_balance_org: Math.max(0, balance - numAmount),
      old_balance_dest: randomOldBalanceDest,
      new_balance_dest: randomOldBalanceDest + numAmount,
    };

    try {
      // Hit the FastAPI backend -> XGBoost Model
      const res = await api.createTransaction(payload);
      
      setResult(res.status as any);
      setRiskScore(res.risk_score);
      setRawRiskScore(res.raw_risk_score);
      
      if (res.status === 'safe') {
        setBalance(prev => prev - numAmount);
        setAmount('');
        setRecipient('');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to banking server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ─── Top Navigation ─── */}
      <header className="bg-emerald-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center">
                <Building2 size={20} className="text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">Apex Bank</span>
            </div>
            
            <div className="hidden md:flex space-x-8">
              <span onClick={() => alert('UI Mockup: Navigation disabled in demo')} className="text-emerald-100 hover:text-white font-medium cursor-pointer border-b-2 border-white px-1 py-5">Accounts</span>
              <span onClick={() => alert('UI Mockup: Navigation disabled in demo')} className="text-emerald-200 hover:text-white font-medium cursor-pointer px-1 py-5">Transfers</span>
              <span onClick={() => alert('UI Mockup: Navigation disabled in demo')} className="text-emerald-200 hover:text-white font-medium cursor-pointer px-1 py-5">Cards</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button onClick={() => alert('UI Mockup: Notifications disabled')} className="text-emerald-200 hover:text-white relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
              </button>
              <div className="flex items-center gap-2 pl-4 border-l border-emerald-700">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center border border-emerald-500">
                  <User size={16} />
                </div>
                <span className="text-sm font-medium">Hello, John</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Development Helper Ribbon */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 text-blue-800">
            <ShieldAlert size={18} />
            <span className="text-sm font-medium">FinShield AI Demo Mode Active. Transactions sent from this page are routed through the ML Fraud Pipeline.</span>
          </div>
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1 text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
          >
            Open Admin Dashboard <ArrowRightLeft size={12} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ─── Left Column: Accounts ─── */}
          <div className="lg:col-span-1 space-y-6">
            {/* Balance Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-emerald-600 to-teal-800 text-white">
                <p className="text-emerald-100 text-sm font-medium mb-1">Available Balance</p>
                <h2 className="text-4xl font-bold tracking-tight">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
                <p className="text-emerald-200 text-xs mt-4">Premium Checking ...4928</p>
              </div>
              <div className="bg-white p-4 grid grid-cols-2 gap-4 divide-x divide-gray-100">
                <button onClick={() => alert('UI Mockup: Use the form on the right to transfer')} className="flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors py-2">
                  <ArrowRightLeft size={20} />
                  <span className="text-xs font-medium">Transfer</span>
                </button>
                <button onClick={() => navigate('/admin')} className="flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors py-2">
                  <PieChart size={20} />
                  <span className="text-xs font-medium">Analytics</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button onClick={() => alert('UI Mockup: Quick actions disabled in demo')} className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-gray-100 group-hover:bg-white text-gray-600 group-hover:text-emerald-600">
                      <CreditCard size={18} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Pay Credit Card</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* ─── Right Column: Transfer Form ─── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Send size={20} className="text-emerald-600" />
                Transfer Funds
              </h2>

              {/* Status Banner */}
              {result === 'safe' && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 animate-slide-in">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-emerald-800 font-bold">Transfer Successful</h4>
                    <div className="text-emerald-600 text-sm mt-1">
                      <p>Your funds have been sent instantly.</p>
                      <div className="mt-2 text-xs bg-emerald-100/50 p-2 rounded">
                        Raw ML Score: {rawRiskScore?.toFixed(2)} <br/>
                        <span className="text-red-600 font-semibold">Final Risk Score: {riskScore?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {result === 'review' && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 animate-slide-in">
                  <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-amber-800 font-bold">Transfer Pending Review</h4>
                    <div className="text-amber-700 text-sm mt-1">
                      <p>For your security, this transaction requires manual authorization. It has been queued for a risk analyst.</p>
                      <div className="mt-2 text-xs bg-amber-100/50 p-2 rounded">
                        Raw ML Score: {rawRiskScore?.toFixed(2)} <br/>
                        <span className="text-red-600 font-semibold">Final Risk Score: {riskScore?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {result === 'fraud' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-slide-in">
                  <XCircle className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-red-800 font-bold">Transfer Blocked</h4>
                    <div className="text-red-700 text-sm mt-1">
                      <p>This transaction was intercepted by our fraud prevention system due to highly suspicious patterns. Please contact support.</p>
                      <div className="mt-2 text-xs bg-red-100/50 p-2 rounded">
                        Raw ML Score: {rawRiskScore?.toFixed(2)} <br/>
                        <span className="text-red-600 font-semibold">Final Risk Score: {riskScore?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleTransfer} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Account</label>
                    <select className="w-full border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-gray-50 border p-2.5 text-gray-700">
                      <option>Premium Checking (...4928) - ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Recipient</label>
                    <input 
                      type="text" 
                      placeholder="Account Number or Email"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      required
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (USD)</label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-lg">$</span>
                    </div>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-8 pr-12 sm:text-lg border-gray-300 rounded-lg py-3 border font-semibold text-gray-900"
                      placeholder="0.00"
                    />
                  </div>
                  {parseFloat(amount) > balance && (
                    <p className="text-red-500 text-xs mt-2">Amount exceeds available balance. (Tip: Try transferring your entire balance to trigger a fraud alert!)</p>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <button 
                    type="button" 
                    onClick={() => navigate('/')}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <ArrowLeft size={16} /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || parseFloat(amount) <= 0 || isNaN(parseFloat(amount))}
                    className="inline-flex justify-center items-center py-3 px-8 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Authorizing...
                      </span>
                    ) : (
                      'Send Transfer Now'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
