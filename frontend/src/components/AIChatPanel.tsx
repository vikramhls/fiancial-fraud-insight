import { useState, useRef, useEffect } from 'react';
import { BrainCircuit, Send, X, Sparkles, MessageSquare, ShieldAlert, BarChart2, Globe, Bell, TrendingUp } from 'lucide-react';
import { api } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'shield-alert': <ShieldAlert size={14} />,
  'bar-chart': <BarChart2 size={14} />,
  'globe': <Globe size={14} />,
  'bell': <Bell size={14} />,
  'brain': <BrainCircuit size={14} />,
  'trending-up': <TrendingUp size={14} />,
};

export default function AIChatPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ text: string; icon: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      api.getChatSuggestions()
        .then((data) => setSuggestions(data.suggestions))
        .catch(() => {});
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.sendChatMessage(text.trim());
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ Sorry, I encountered an error. Please check that the Gemini API key is configured correctly.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Simple markdown renderer
  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-gray-100 text-xs font-mono">$1</code>')
      .replace(/^- (.*)/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
      .replace(/^### (.*)/gm, '<h4 class="font-bold text-sm mt-3 mb-1">$1</h4>')
      .replace(/^## (.*)/gm, '<h3 class="font-bold text-base mt-3 mb-1">$1</h3>')
      .replace(/\n/g, '<br/>');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in" style={{ animationDuration: '0.25s' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold">FinShield AI Analyst</h2>
              <p className="text-[11px] text-blue-100">Powered by Gemini · RAG-enabled</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ minHeight: 0 }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-indigo-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Ask me anything about fraud</h3>
              <p className="text-xs text-gray-500 max-w-xs mb-6">
                I analyze your real transaction data using RAG to give accurate, data-backed insights.
              </p>

              {/* Suggestion chips */}
              <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.text)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 text-left text-xs text-gray-700 font-medium transition-all group"
                  >
                    <span className="text-gray-400 group-hover:text-indigo-500 transition-colors">
                      {ICON_MAP[s.icon] || <MessageSquare size={14} />}
                    </span>
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm border border-gray-200'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div
                    className="ai-response-content prose-sm"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-gray-500">Analyzing data...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about fraud patterns, transactions..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 disabled:opacity-60 transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
