/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  AlertTriangle, 
  Info, 
  ExternalLink, 
  History,
  Trash2,
  Lock,
  Unlock,
  Terminal
} from 'lucide-react';
import { analyzeUrl, AnalysisResult } from './lib/urlAnalyzer';

export default function App() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    setIsAnalyzing(true);
    
    // Simulate a brief analysis delay for "professional" feel
    setTimeout(() => {
      const result = analyzeUrl(input);
      setCurrentResult(result);
      setHistory(prev => {
        // Avoid duplicates in history
        const filtered = prev.filter(item => item.url !== result.url);
        return [result, ...filtered.slice(0, 9)];
      });
      setIsAnalyzing(false);
    }, 800);
  };

  const clearHistory = () => setHistory([]);

  const getRiskColor = (score: number) => {
    if (score < 20) return 'text-emerald-500';
    if (score < 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getRiskBg = (score: number) => {
    if (score < 20) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score < 50) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Background Grid Effect */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20" />

      <div className="relative max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12 text-center">
         
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4"
          >
            PhishGuard <span className="text-indigo-500">Analyzer</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 max-w-2xl mx-auto"
          >
            Advanced URL inspection for suspicious patterns, typosquatting, and malicious redirection tactics.
          </motion.p>
        </header>

        {/* Main Analyzer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#151518] border border-slate-800 rounded-2xl p-6 shadow-xl"
            >
              <form onSubmit={handleAnalyze} className="relative">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                    <Search size={20} />
                  </div>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter URL to analyze (e.g., paypa1-secure.com)"
                    className="w-full bg-[#1C1C21] border border-slate-800 rounded-xl py-4 pl-12 pr-32 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isAnalyzing || !input.trim()}
                    className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-lg transition-all flex items-center gap-2"
                  >
                    {isAnalyzing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Analyze'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>

            <AnimatePresence mode="wait">
              {currentResult ? (
                <motion.div
                  key={currentResult.url}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`border rounded-2xl p-8 shadow-2xl ${getRiskBg(currentResult.score)}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl bg-black/20 ${getRiskColor(currentResult.score)}`}>
                        {currentResult.score < 30 ? <ShieldCheck size={40} /> : <ShieldAlert size={40} />}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          {currentResult.score < 30 ? 'Safe' : currentResult.score < 60 ? 'Suspicious' : 'High Risk'}
                        </h2>
                        <p className="text-slate-400 font-mono text-sm truncate max-w-xs md:max-w-md">
                          {currentResult.url}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-4xl font-black font-mono ${getRiskColor(currentResult.score)}`}>
                        {currentResult.score}%
                      </div>
                      <div className="text-xs uppercase tracking-widest font-bold opacity-50">Risk Score</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      Detected Flags ({currentResult.flags.length})
                    </h3>
                    
                    {currentResult.flags.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentResult.flags.map((flag) => (
                          <div key={flag.id} className="bg-black/20 border border-white/5 rounded-xl p-4 flex gap-3">
                            <div className={`mt-1 ${
                              flag.severity === 'high' ? 'text-rose-500' : 
                              flag.severity === 'medium' ? 'text-amber-500' : 'text-blue-500'
                            }`}>
                              <Info size={18} />
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{flag.label}</div>
                              <div className="text-xs text-slate-400 leading-relaxed mt-1">{flag.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-6 text-center">
                        <p className="text-emerald-400 text-sm">No suspicious patterns detected in this URL.</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                      {currentResult.url.startsWith('https') ? (
                        <span className="flex items-center gap-1 text-emerald-500"><Lock size={12} /> Encrypted</span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-500"><Unlock size={12} /> Unencrypted</span>
                      )}
                    </div>
                    <a 
                      href={currentResult.url.startsWith('http') ? currentResult.url : `https://${currentResult.url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                    >
                      Visit URL (Caution) <ExternalLink size={12} />
                    </a>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-[#151518] border border-slate-800 border-dashed rounded-2xl p-12 text-center"
                >
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                    <ShieldAlert size={32} />
                  </div>
                  <h3 className="text-white font-bold mb-2">Ready for Analysis</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">
                    Enter a URL above to perform a multi-vector security scan.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar: History & Stats */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#151518] border border-slate-800 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <History size={18} className="text-indigo-500" />
                  Recent Scans
                </h3>
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="text-slate-500 hover:text-rose-500 transition-colors"
                    title="Clear History"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {history.length > 0 ? (
                  history.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentResult(item);
                        setInput(item.url);
                      }}
                      className="w-full text-left p-3 rounded-xl bg-[#1C1C21] border border-slate-800 hover:border-indigo-500/50 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${getRiskColor(item.score)}`}>
                          {item.score}% Risk
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-sm text-slate-300 truncate group-hover:text-white transition-colors">
                        {item.url}
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-center py-8 text-slate-600 text-sm italic">No recent scans</p>
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-indigo-600 rounded-2xl p-6 text-white overflow-hidden relative"
            >
              <div className="relative z-10">
                <h3 className="font-bold mb-2">Did you know?</h3>
                <p className="text-indigo-100 text-sm leading-relaxed">
                  Over 90% of cyber attacks start with a phishing URL. Always check the domain carefully before entering credentials.
                </p>
              </div>
              <ShieldAlert className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-500 opacity-20 rotate-12" />
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-800 text-center">
         
        </footer>
      </div>
    </div>
  );
}
