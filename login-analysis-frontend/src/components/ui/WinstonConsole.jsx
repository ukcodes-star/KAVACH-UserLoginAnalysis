import React, { useState, useEffect } from 'react';
import { Terminal, X, Trash2, Copy, Download, Check, Filter } from 'lucide-react';
import logger from '../../utils/logger';
import Button from './Button';

export const WinstonConsole = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Initial load
    setLogs(logger.getLogs());

    const handleLog = (e) => {
      setLogs((prev) => [e.detail, ...prev.slice(0, 199)]);
    };

    window.addEventListener('winston-log', handleLog);
    return () => window.removeEventListener('winston-log', handleLog);
  }, []);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ALL') return true;
    return log.level.toUpperCase() === filter;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(filteredLogs, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `winston-logs-${Date.now()}.json`);
    dlAnchor.click();
  };

  const handleClear = () => {
    logger.clearLogs();
    setLogs([]);
  };

  const getLevelBadge = (level) => {
    const lvl = level.toUpperCase();
    const colors = {
      ERROR: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      WARN:  'bg-amber-500/20 text-amber-400 border-amber-500/40',
      INFO:  'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
      HTTP:  'bg-purple-500/20 text-purple-300 border-purple-500/40',
      DEBUG: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
    }[lvl] || 'bg-slate-800 text-slate-300 border-slate-700';

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${colors}`}>
        {lvl}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-3 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[70vh] max-h-[650px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                Winston JS Telemetry Console
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                  {logs.length} events
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Live client-side HTTP, security, and exception telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="xs" onClick={handleCopy} icon={copied ? Check : Copy}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button variant="secondary" size="xs" onClick={handleDownload} icon={Download}>
              Export
            </Button>
            <Button variant="ghost" size="xs" onClick={handleClear} icon={Trash2} title="Clear logs" />
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500 mr-1" />
          {['ALL', 'ERROR', 'WARN', 'INFO', 'HTTP', 'DEBUG'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                filter === lvl
                  ? 'bg-slate-800 text-cyan-400 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Console Log Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs bg-slate-950/90 selection:bg-cyan-500/30">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No {filter !== 'ALL' ? filter : ''} logs recorded in this session</p>
            </div>
          ) : (
            filteredLogs.map((entry, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 hover:border-slate-700/80 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] text-slate-500 shrink-0 select-none">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  {getLevelBadge(entry.level)}
                  <span className="text-slate-200 break-all flex-1">{entry.message}</span>
                </div>
                {entry.meta && Object.keys(entry.meta).length > 0 && (
                  <pre className="mt-2 text-[10px] text-slate-400 bg-slate-950/70 p-2 rounded border border-slate-800/60 overflow-x-auto">
                    {JSON.stringify(entry.meta, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WinstonConsole;
