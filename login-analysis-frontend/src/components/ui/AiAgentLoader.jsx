import React, { useState, useEffect } from 'react';
import { Bot, Cpu, Terminal, Wrench, Layers, Activity, ShieldCheck, Zap } from 'lucide-react';

const STEPS = [
  { text: 'Initializing Two-Loop Agent context & draining steering directives...', icon: Terminal },
  { text: 'Inner Loop Cycle: Evaluating behavioral baselines & MITRE heuristics...', icon: Cpu },
  { text: 'Executing application tools: Correlating telemetry & risk vectors...', icon: Wrench },
  { text: 'Synthesizing forensic observations & verifying containment directives...', icon: ShieldCheck },
  { text: 'Finalizing multi-turn outer loop & formatting security report...', icon: Layers },
];

export const AiAgentLoader = ({ activeRole = 'DUAL_COLLABORATIVE' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setElapsed((prev) => +(prev + 0.1).toFixed(1));
    }, 100);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);

    return () => {
      clearInterval(timerInterval);
      clearInterval(stepInterval);
    };
  }, []);

  const StepIcon = STEPS[currentStep].icon;

  return (
    <div className="flex gap-3 justify-start animate-in fade-in duration-300">
      {/* Animated Hex / Cyber Bot Avatar */}
      <div className="relative w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
        <Bot className="w-4 h-4 animate-pulse text-zinc-900 dark:text-zinc-100" />
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>

      {/* Cyber Loader Card */}
      <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] font-mono pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-bold text-zinc-900 dark:text-zinc-100">
              <Activity className="w-3.5 h-3.5 text-cyan-500 animate-spin" />
              <span>Two-Loop Agent Working</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
              {activeRole}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-500">
            <span>Elapsed:</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{elapsed}s</span>
          </div>
        </div>

        {/* Dynamic Status Progression */}
        <div className="flex items-center gap-2.5 text-xs text-zinc-800 dark:text-zinc-200 font-medium">
          <div className="w-5 h-5 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-cyan-600 dark:text-cyan-400">
            <StepIcon className="w-3 h-3 animate-pulse" />
          </div>
          <span className="leading-snug">{STEPS[currentStep].text}</span>
        </div>

        {/* Shimmer / Skeleton Telemetry Preview */}
        <div className="space-y-1.5 pt-1">
          <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-2 w-4/5 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse delay-75" />
          <div className="h-2 w-3/5 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse delay-150" />
        </div>

        {/* Footer Info */}
        <div className="pt-1 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
          <span>Executing real-time application functions</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Live Inference
          </span>
        </div>
      </div>
    </div>
  );
};

export default AiAgentLoader;
