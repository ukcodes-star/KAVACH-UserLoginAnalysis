import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  FileText,
  Key,
  Flame,
  History,
  Eye,
  Info,
  Layers,
  Terminal,
  Cpu,
  Wrench,
  ChevronDown,
  ChevronUp,
  Zap,
  Activity,
  Radio,
  Plus,
  Trash2,
  Lock,
  Unlock,
  ShieldAlert,
  Play,
} from 'lucide-react';
import { grokAiApi } from '../api';
import logger from '../utils/logger';
import {
  Card,
  CardHeader,
  Badge,
  Button,
  AiStatusBadge,
  Table,
  Modal,
  Pagination,
  MarkdownRenderer,
  AiAgentLoader,
} from '../components/ui';
import { staggerEntrance } from '../utils/animations';

export const GrokAiPage = () => {
  const [activeTab, setActiveTab] = useState('copilot'); // 'copilot' | 'summary' | 'history'
  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Two-Loop Agent configuration
  const [agentRole, setAgentRole] = useState('DUAL_COLLABORATIVE'); // 'DUAL_COLLABORATIVE' | 'THREAT_INVESTIGATOR' | 'CONTAINMENT_OPERATOR'
  const [agentTools, setAgentTools] = useState([]);
  const [toolsModalOpen, setToolsModalOpen] = useState(false);
  const [toolsLoading, setToolsLoading] = useState(false);

  // Steering & Follow-up queue controls
  const [steeringList, setSteeringList] = useState([]);
  const [steeringInput, setSteeringInput] = useState('');
  const [showSteeringPanel, setShowSteeringPanel] = useState(false);

  const [followUpList, setFollowUpList] = useState([]);
  const [followUpInput, setFollowUpInput] = useState('');

  // Chat message stream
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `### Autonomous Cyber Operations Center Copilot Active
I am configured as a **Two-Loop Autonomous Agent** equipped with **13 real-time application security tools** to discover, analyze, and remediate cybersecurity threats.

- **Threat Investigator Agent**: Forensics, behavioral risk scoring, and MITRE ATT&CK correlation.
- **Containment Operator Agent**: Policy enforcement, account quarantine/restoration, and attack simulation.
- **Two-Loop Cycle**: Executes internal tool loops while accepting mid-flight steering and outer-loop follow-up tasks.

Select an operational agent role below or trigger one of the incident investigation playbooks to begin.`,
      timestamp: new Date().toLocaleTimeString(),
      mode: 'Ready',
      steps: [],
      toolsExecuted: [],
      outerLoopCycles: 0,
      innerLoopIterations: 0,
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [expandedTraceIdx, setExpandedTraceIdx] = useState(null);

  // Executive Summary states
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // History states
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotalElements, setHistoryTotalElements] = useState(0);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  const messagesEndRef = useRef(null);

  // Fetch status and tools on mount
  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await grokAiApi.getStatus();
      setStatus(res);
      logger.info(`AI engine status verified: Live=${res.live}, Model=${res.model}`);
    } catch (err) {
      logger.error('Failed to query AI status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchAgentTools = async () => {
    setToolsLoading(true);
    try {
      const res = await grokAiApi.getAgentTools();
      setAgentTools(res || []);
      logger.info(`Loaded ${res?.length || 0} application agent tools`);
    } catch (err) {
      logger.error('Failed to fetch agent tools:', err);
    } finally {
      setToolsLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    logger.info('Requesting AI executive SOC threat posture briefing');
    try {
      const res = await grokAiApi.getSummary();
      setSummary(res);
      logger.info('Executive threat briefing generated');
    } catch (err) {
      logger.error(`Failed to generate executive summary: ${err.message}`);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    logger.info(`Fetching AI analysis history page ${historyPage}`);
    try {
      const res = await grokAiApi.getHistory({ page: historyPage, size: 10 });
      setHistoryList(res.content || []);
      setHistoryTotalPages(res.totalPages || 1);
      setHistoryTotalElements(res.totalElements || 0);
      logger.info(`Loaded ${res.content?.length || 0} AI analysis history records`);
    } catch (err) {
      logger.error('Failed to load AI analysis history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchAgentTools();
    staggerEntrance('.ai-page-anim', { y: 15, duration: 0.4, stagger: 0.06 });
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, historyPage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Handle Two-Loop Agent execution
  const handleSendMessage = async (customPrompt) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend.trim() || chatLoading) return;

    const currentSteering = [...steeringList];
    const currentFollowUp = [...followUpList];

    const userMsg = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString(),
      steering: currentSteering.length > 0 ? currentSteering : null,
      followUp: currentFollowUp.length > 0 ? currentFollowUp : null,
      roleRequested: agentRole,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setSteeringList([]);
    setFollowUpList([]);
    setChatLoading(true);
    logger.info(`Executing Two-Loop Agent (${agentRole}): "${textToSend.substring(0, 45)}..."`);

    try {
      const payload = {
        prompt: textToSend,
        agentRole: agentRole,
        steeringMessages: currentSteering,
        followUpMessages: currentFollowUp,
      };

      const res = await grokAiApi.runAgentLoop(payload);

      const aiMsg = {
        role: 'assistant',
        content: res.finalResponse,
        timestamp: new Date().toLocaleTimeString(),
        model: res.model,
        mode: res.mode,
        activeRole: res.activeRole,
        steps: res.steps || [],
        toolsExecuted: res.toolsExecuted || [],
        outerLoopCycles: res.outerLoopCycles || 1,
        innerLoopIterations: res.innerLoopIterations || 1,
      };

      setMessages((prev) => [...prev, aiMsg]);
      // Expand the latest execution trace automatically
      setExpandedTraceIdx(messages.length + 1);
      logger.info(`Two-Loop Agent completed: ${res.toolsExecuted?.length || 0} tools executed in ${res.outerLoopCycles} outer cycles.`);
    } catch (err) {
      logger.error('Two-Loop Agent invocation failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Security Engine Notice:** Failed to execute Two-Loop Agent (${err.message}). Application telemetry and deterministic fallback rules remain operational.`,
          timestamp: new Date().toLocaleTimeString(),
          mode: 'Error',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const addSteeringMessage = () => {
    if (steeringInput.trim()) {
      setSteeringList((prev) => [...prev, steeringInput.trim()]);
      setSteeringInput('');
    }
  };

  const removeSteeringMessage = (idx) => {
    setSteeringList((prev) => prev.filter((_, i) => i !== idx));
  };

  const addFollowUpMessage = () => {
    if (followUpInput.trim()) {
      setFollowUpList((prev) => [...prev, followUpInput.trim()]);
      setFollowUpInput('');
    }
  };

  const removeFollowUpMessage = (idx) => {
    setFollowUpList((prev) => prev.filter((_, i) => i !== idx));
  };

  const historyColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (val, row) => <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">#{row.id}</span>,
    },
    {
      key: 'anomalyId',
      label: 'Anomaly Ref',
      render: (val, row) =>
        row.anomalyId ? (
          <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400 font-semibold">Anomaly #{row.anomalyId}</span>
        ) : (
          <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">System Wide</span>
        ),
    },
    {
      key: 'summary',
      label: 'Incident Summary',
      render: (val, row) => (
        <span className="text-xs text-zinc-800 dark:text-zinc-200 line-clamp-1 max-w-xs">{row.summary || 'AI Assessment'}</span>
      ),
    },
    {
      key: 'threatLevel',
      label: 'Threat Level',
      render: (val, row) => (
        <Badge variant={row.threatLevel || 'HIGH'} size="sm">
          {row.threatLevel || 'HIGH'}
        </Badge>
      ),
    },
    {
      key: 'confidence',
      label: 'Confidence',
      render: (val, row) => (
        <Badge variant={`CONFIDENCE_${(row.confidence || 'HIGH').toUpperCase()}`} size="sm">
          {row.confidence || 'HIGH'}
        </Badge>
      ),
    },
    {
      key: 'model',
      label: 'Agent Engine',
      render: (val, row) => (
        <span className="font-mono text-[11px] text-zinc-800 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
          {row.model || 'two-loop-core'}
        </span>
      ),
    },
    {
      key: 'generatedAt',
      label: 'Timestamp',
      render: (val, row) => (
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          {row.generatedAt ? new Date(row.generatedAt).toLocaleString() : 'Recent'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      className: 'text-right',
      render: (val, row) => (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setSelectedHistoryItem(row)}
          icon={Eye}
          className="text-zinc-600 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400"
        >
          View Dossier
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="ai-page-anim flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
              <Bot className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
              Autonomous Threat Copilot & Multi-Agent Operations
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border border-zinc-800 dark:border-zinc-200">
              <Layers className="w-3.5 h-3.5" />
              Two-Loop Agent Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Autonomous multi-turn agent system with outer-loop task continuation, inner-loop tool orchestration, and real-time application control.
          </p>
        </div>

        {/* Status & Tool Registry Trigger */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setToolsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 transition-colors shadow-sm"
          >
            <Wrench className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
            <span>{agentTools.length || 13} App Tools Active</span>
          </button>

          <AiStatusBadge live={status?.live} />

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchStatus}
            loading={statusLoading}
            icon={RefreshCw}
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="ai-page-anim flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('copilot')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'copilot'
              ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <Bot className="w-4 h-4" />
          Two-Loop Agent Console
        </button>

        <button
          onClick={() => {
            setActiveTab('summary');
            if (!summary) handleGenerateSummary();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'summary'
              ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Executive Threat Posture
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
        >
          <History className="w-4 h-4" />
          Analysis Vault
          {historyTotalElements > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 font-mono">
              {historyTotalElements}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TWO-LOOP AGENT COPILOT                                            */}
      {/* ========================================================================= */}
      {activeTab === 'copilot' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Agent Chat Stream */}
          <div className="lg:col-span-3 space-y-4">
            {/* Agent Mode Selector Toolbar */}
            <div className="p-3 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider font-semibold mr-1">
                  Active Agent Role:
                </span>
                <button
                  type="button"
                  onClick={() => setAgentRole('DUAL_COLLABORATIVE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                    agentRole === 'DUAL_COLLABORATIVE'
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm font-semibold'
                      : 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Dual Collaborative Loop
                </button>

                <button
                  type="button"
                  onClick={() => setAgentRole('THREAT_INVESTIGATOR')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                    agentRole === 'THREAT_INVESTIGATOR'
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm font-semibold'
                      : 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Threat Investigator
                </button>

                <button
                  type="button"
                  onClick={() => setAgentRole('CONTAINMENT_OPERATOR')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                    agentRole === 'CONTAINMENT_OPERATOR'
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm font-semibold'
                      : 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Containment Operator
                </button>
              </div>

              {/* Steering Panel Toggle */}
              <button
                type="button"
                onClick={() => setShowSteeringPanel((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors ${
                  showSteeringPanel || steeringList.length > 0 || followUpList.length > 0
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Steering & Follow-ups</span>
                {(steeringList.length > 0 || followUpList.length > 0) && (
                  <span className="w-4 h-4 rounded-full bg-cyan-500 text-black text-[10px] flex items-center justify-center font-bold">
                    {steeringList.length + followUpList.length}
                  </span>
                )}
                {showSteeringPanel ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
              </button>
            </div>

            {/* Collapsible Steering & Follow-up Queue Drawer */}
            {showSteeringPanel && (
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mid-Task Steering Queue (Inner Loop) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        Mid-Flight Steering Queue (Inner Loop)
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">Drained before tool calls</span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={steeringInput}
                        onChange={(e) => setSteeringInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSteeringMessage())}
                        placeholder="e.g. Also record reason as brute force attempt"
                        className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                      />
                      <Button variant="secondary" size="xs" onClick={addSteeringMessage} icon={Plus}>
                        Add
                      </Button>
                    </div>

                    {steeringList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {steeringList.map((st, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                          >
                            <span>#{idx + 1}: {st}</span>
                            <button
                              onClick={() => removeSteeringMessage(idx)}
                              className="text-cyan-600 hover:text-cyan-900 dark:hover:text-cyan-100"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-500 italic">No mid-task steering overrides queued.</p>
                    )}
                  </div>

                  {/* Multi-Turn Follow-up Queue (Outer Loop) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        Multi-Turn Follow-Up Queue (Outer Loop)
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">Triggers cycle continuation</span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={followUpInput}
                        onChange={(e) => setFollowUpInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFollowUpMessage())}
                        placeholder="e.g. Verify that user is disabled in the directory"
                        className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                      />
                      <Button variant="secondary" size="xs" onClick={addFollowUpMessage} icon={Plus}>
                        Add
                      </Button>
                    </div>

                    {followUpList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {followUpList.map((fu, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          >
                            <span>Cycle #{idx + 2}: {fu}</span>
                            <button
                              onClick={() => removeFollowUpMessage(idx)}
                              className="text-amber-600 hover:text-amber-900 dark:hover:text-amber-100"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-500 italic">No outer-loop follow-up tasks queued.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Chat Conversation Console */}
            <Card className="h-[650px] flex flex-col bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <CardHeader className="py-2.5 px-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                    TWO-LOOP ORCHESTRATION CONSOLE
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                    Role: <strong className="text-zinc-900 dark:text-zinc-200">{agentRole}</strong>
                  </span>
                </div>
              </CardHeader>

              {/* Chat Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => {
                  const isUser = msg.role === 'user';
                  const hasTrace = msg.steps && msg.steps.length > 0;
                  const isTraceExpanded = expandedTraceIdx === i;

                  return (
                    <div key={i} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser && (
                        <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[88%] rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                          isUser
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                            : 'bg-zinc-50 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 shadow-sm'
                        }`}
                      >
                        {/* Message Metadata Header */}
                        <div
                          className={`flex items-center justify-between gap-4 text-[10px] font-mono pb-1 border-b ${
                            isUser
                              ? 'border-zinc-700/60 dark:border-zinc-300/60 text-zinc-300 dark:text-zinc-600'
                              : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                          }`}
                        >
                          <span className="font-semibold">{isUser ? 'SOC Analyst' : 'Autonomous Agent Core'}</span>
                          <span>{msg.timestamp}</span>
                        </div>

                        {/* Queued Steering / Follow-up pill displays on user message */}
                        {isUser && (msg.steering || msg.followUp) && (
                          <div className="space-y-1 pt-0.5">
                            {msg.steering && (
                              <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300 dark:text-cyan-700">
                                <Terminal className="w-3 h-3" />
                                <span>Steering attached: {msg.steering.join(' | ')}</span>
                              </div>
                            )}
                            {msg.followUp && (
                              <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-300 dark:text-amber-700">
                                <Layers className="w-3 h-3" />
                                <span>Follow-up attached: {msg.followUp.join(' | ')}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Message Content */}
                        {isUser ? (
                          <div className="whitespace-pre-line font-sans font-normal leading-relaxed">
                            {msg.content}
                          </div>
                        ) : (
                          <MarkdownRenderer content={msg.content} />
                        )}

                        {/* Assistant Two-Loop Execution Step Ribbon & Inspector */}
                        {!isUser && hasTrace && (
                          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                            {/* Execution Summary Ribbon */}
                            <div className="flex items-center justify-between flex-wrap gap-2 p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold border border-zinc-200 dark:border-zinc-700">
                                  {msg.outerLoopCycles} Outer Cycle{msg.outerLoopCycles > 1 ? 's' : ''}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold border border-zinc-200 dark:border-zinc-700">
                                  {msg.innerLoopIterations} Inner Iteration{msg.innerLoopIterations > 1 ? 's' : ''}
                                </span>
                                <span className="text-zinc-500">
                                  Tools ({msg.toolsExecuted?.length || 0}):
                                </span>
                                {msg.toolsExecuted && msg.toolsExecuted.map((t, tidx) => (
                                  <span key={tidx} className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px]">
                                    {t}
                                  </span>
                                ))}
                              </div>

                              <button
                                type="button"
                                onClick={() => setExpandedTraceIdx(isTraceExpanded ? null : i)}
                                className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
                              >
                                <span>{isTraceExpanded ? 'Hide Trace' : `Trace (${msg.steps.length} Steps)`}</span>
                                {isTraceExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            {/* Detailed Step Timeline Accordion */}
                            {isTraceExpanded && (
                              <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2.5 max-h-72 overflow-y-auto">
                                <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold block">
                                  Step Execution Timeline:
                                </span>
                                {msg.steps.map((st, stepIdx) => (
                                  <div
                                    key={stepIdx}
                                    className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-zinc-700 dark:text-zinc-300">
                                          [Cycle {st.loopCycle} • Step {st.stepIndex}]
                                        </span>
                                        <span
                                          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase ${
                                            st.actionType === 'TOOL_INVOCATION'
                                              ? 'bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-300'
                                              : st.actionType === 'TOOL_COMPLETED'
                                              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300'
                                              : st.actionType === 'STEERING_INJECTED'
                                              ? 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-300'
                                              : st.actionType === 'FOLLOW_UP_INJECTED'
                                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300'
                                              : 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                                          }`}
                                        >
                                          {st.actionType}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-zinc-500">
                                        Agent: {st.agentRole}
                                      </span>
                                    </div>

                                    {st.thought && (
                                      <p className="text-zinc-700 dark:text-zinc-300 font-sans">
                                        {st.thought}
                                      </p>
                                    )}

                                    {st.toolName && (
                                      <div className="flex items-center gap-2 text-[10px]">
                                        <span className="text-zinc-500">Tool:</span>
                                        <strong className="text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                          {st.toolName}
                                        </strong>
                                      </div>
                                    )}

                                    {st.toolArguments && Object.keys(st.toolArguments).length > 0 && (
                                      <div className="p-2 rounded bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-[10px] overflow-x-auto">
                                        <span className="text-zinc-500 block mb-1">Arguments:</span>
                                        <pre>{JSON.stringify(st.toolArguments, null, 2)}</pre>
                                      </div>
                                    )}

                                    {st.toolResult && st.toolResult.details && (
                                      <details className="mt-1">
                                        <summary className="cursor-pointer text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">
                                          View Structured Tool Details Payload
                                        </summary>
                                        <div className="mt-1.5 p-2 rounded bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[10px] max-h-48 overflow-y-auto">
                                          <pre>{JSON.stringify(st.toolResult.details, null, 2)}</pre>
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Copy Footer for Assistant */}
                        {!isUser && (
                          <div className="pt-2 flex items-center justify-between text-[10px] text-zinc-500">
                            <span className="font-mono">Autonomous Execution • Advisory Playbook</span>
                            <button
                              onClick={() => copyToClipboard(msg.content, i)}
                              className="hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 font-mono transition-colors"
                            >
                              {copiedIdx === i ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> Copy
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {chatLoading && (
                  <AiAgentLoader activeRole={agentRole} />
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    placeholder="Direct the agents (e.g., 'Check risky watchlist and quarantine user 6 if anomalous')..."
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                    disabled={chatLoading}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={!inputPrompt.trim() || chatLoading}
                    loading={chatLoading}
                    icon={Send}
                  >
                    Execute
                  </Button>
                </form>
              </div>
            </Card>
          </div>

          {/* Quick Action Playbooks & Tool Inspector Sidebar */}
          <div className="space-y-4">
            <Card className="p-4 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 space-y-3 shadow-xs">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Play className="w-4 h-4 text-emerald-500" />
                Operational Playbooks
              </span>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Execute end-to-end multi-agent playbooks using real application tools:
              </p>

              <div className="space-y-2">
                {[
                  {
                    title: 'Investigate Risky Watchlist',
                    desc: 'Query top risky users and evaluate dashboard posture',
                    prompt: 'Investigate top risky accounts and check current dashboard security posture.',
                    role: 'THREAT_INVESTIGATOR',
                  },
                  {
                    title: 'Filter Critical Anomalies',
                    desc: 'List detected anomalies filtered by CRITICAL severity',
                    prompt: 'List all critical login anomalies and perform deep forensic analysis on the top one.',
                    role: 'THREAT_INVESTIGATOR',
                  },
                  {
                    title: 'Quarantine Suspect Account #6',
                    desc: 'Operator isolates compromised user account in directory',
                    prompt: 'Inspect user directory and quarantine account with user id 6.',
                    role: 'CONTAINMENT_OPERATOR',
                  },
                  {
                    title: 'Restore Account #6 to Active',
                    desc: 'Operator restores user 6 back to active status',
                    prompt: 'Please unlock and restore user 6 account status to active.',
                    role: 'CONTAINMENT_OPERATOR',
                  },
                  {
                    title: 'Simulate Brute Force Attack',
                    desc: 'Emit failed login vectors from Moscow to test heuristic alarms',
                    prompt: 'Simulate a brute force attack event against user 6 from Moscow IP 198.51.100.45.',
                    role: 'CONTAINMENT_OPERATOR',
                  },
                  {
                    title: 'Audit Trail Compliance Ledger',
                    desc: 'Inspect immutable records for quarantine and access events',
                    prompt: 'Query immutable audit logs for recent account quarantine actions and access denials.',
                    role: 'THREAT_INVESTIGATOR',
                  },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setAgentRole(item.role);
                      handleSendMessage(item.prompt);
                    }}
                    disabled={chatLoading}
                    className="w-full text-left p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/70 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                        {item.role === 'THREAT_INVESTIGATOR' ? 'Investigator' : 'Operator'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-4 bg-white/70 dark:bg-zinc-950/70 border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 space-y-2.5">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold font-mono">
                <Cpu className="w-4 h-4 text-emerald-500" />
                recodeLearning Architecture
              </div>
              <p className="text-[11px] leading-relaxed">
                Adheres directly to <code>lesson17-two-loop-agent.ts</code> and <code>lesson14-agent-tool.ts</code>. Outer loop handles multi-turn continuation; inner loop drains steering directives before every tool invocation.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXECUTIVE THREAT POSTURE (FEATURE C)                               */}
      {/* ========================================================================= */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
                  Executive Security Incident Summary
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Synthesizes system-wide login anomalies into an executive posture assessment for SOC administrators.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateSummary}
                loading={summaryLoading}
                icon={Sparkles}
              >
                Regenerate Briefing
              </Button>
            </div>

            {summaryLoading && (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 tracking-wider uppercase">
                  Synthesizing incident streams & behavioral telemetry...
                </span>
              </div>
            )}

            {!summaryLoading && summary && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Meta Badges */}
                <div className="flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Badge variant={summary.threatLevel || 'HIGH'}>
                      {summary.threatLevel || 'HIGH'} EXPOSURE
                    </Badge>
                    <Badge variant={`CONFIDENCE_${(summary.confidence || 'HIGH').toUpperCase()}`} size="sm">
                      {summary.confidence || 'HIGH'} CONFIDENCE
                    </Badge>
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      Evaluated {summary.totalAnomaliesAnalyzed} Incident Signals
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-zinc-800 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700">
                      Engine: {summary.model || 'two-loop-agent'}
                    </span>
                    <AiStatusBadge live={true} />
                  </div>
                </div>

                {/* Overall Security Situation */}
                {summary.overallSecuritySituation && (
                  <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide font-mono">
                      Overall Security Posture:
                    </span>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
                      {summary.overallSecuritySituation}
                    </p>
                  </div>
                )}

                {/* Executive Summary */}
                {summary.summary && (
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide font-mono">
                      Executive Incident Synthesis:
                    </span>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                      {summary.summary}
                    </p>
                  </div>
                )}

                {/* Threat Vectors & Patterns Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Most Important Threats */}
                  {summary.mostImportantThreats && summary.mostImportantThreats.length > 0 && (
                    <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 space-y-2">
                      <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1.5 font-mono">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        Most Critical Threats:
                      </span>
                      <ul className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1.5">
                        {summary.mostImportantThreats.map((threat, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-rose-500 font-bold">•</span>
                            <span>{threat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Common Suspicious Patterns */}
                  {summary.commonSuspiciousPatterns && summary.commonSuspiciousPatterns.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 space-y-2">
                      <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 font-mono">
                        <Flame className="w-4 h-4 text-amber-500" />
                        Common Threat Patterns:
                      </span>
                      <ul className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1.5">
                        {summary.commonSuspiciousPatterns.map((pattern, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{pattern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Priorities & Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Investigation Priorities */}
                  {summary.investigationPriorities && summary.investigationPriorities.length > 0 && (
                    <div className="p-4 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/30 space-y-2">
                      <span className="text-xs font-semibold text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5 font-mono">
                        <Key className="w-4 h-4 text-cyan-500" />
                        Investigation Priorities:
                      </span>
                      <ul className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1.5">
                        {summary.investigationPriorities.map((prio, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-cyan-500 font-bold">{i + 1}.</span>
                            <span>{prio}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Actions */}
                  {summary.recommendedActions && summary.recommendedActions.length > 0 && (
                    <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-mono">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          Recommended Mitigation:
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                          Advisory Playbook
                        </span>
                      </div>
                      <ul className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1.5">
                        {summary.recommendedActions.map((act, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Advisory Disclaimer */}
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <Info className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>
                    {summary.disclaimer || 'AI-generated cybersecurity summary is advisory only. Consequential security actions require administrator approval.'}
                  </span>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AI ANALYSIS HISTORY (FEATURE D)                                    */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Persistent AI evaluation records stored with full threat metadata.
            </p>
            <Button
              variant="secondary"
              size="xs"
              onClick={fetchHistory}
              loading={historyLoading}
              icon={RefreshCw}
            >
              Refresh Vault
            </Button>
          </div>

          <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <Table
              columns={historyColumns}
              data={historyList}
              loading={historyLoading}
              emptyMessage="No AI analysis history recorded yet. Analyze anomalies or generate summaries to build the vault."
            />

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <Pagination
                currentPage={historyPage}
                totalPages={historyTotalPages}
                totalElements={historyTotalElements}
                pageSize={10}
                onPageChange={(p) => setHistoryPage(p)}
              />
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* APPLICATION TOOLS CATALOG MODAL                                           */}
      {/* ========================================================================= */}
      <Modal
        isOpen={toolsModalOpen}
        onClose={() => setToolsModalOpen(false)}
        size="lg"
        title={
          <span className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
            Registered Application Agent Tools ({agentTools.length})
          </span>
        }
        subtitle="Full suite of real cybersecurity operations tools executable by the Two-Loop Agent."
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {agentTools.map((t, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {t.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      t.assignedRole === 'THREAT_INVESTIGATOR'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {t.assignedRole}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-500">
                    {t.parallelSafe ? 'Parallel Safe' : 'Sequential Mutation'}
                  </span>
                </div>
              </div>

              <p className="text-zinc-600 dark:text-zinc-300 font-sans leading-relaxed">
                {t.description}
              </p>

              {t.parameters && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-[10px] font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
                    Parameter Schema
                  </summary>
                  <pre className="mt-1 p-2 rounded bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[10px] overflow-x-auto">
                    {JSON.stringify(t.parameters, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* HISTORY DOSSIER INSPECTION MODAL                                          */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!selectedHistoryItem}
        onClose={() => setSelectedHistoryItem(null)}
        size="lg"
        title={
          <span className="flex items-center gap-2">
            <History className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
            Threat Dossier #{selectedHistoryItem?.id}
          </span>
        }
        subtitle={`Recorded at ${selectedHistoryItem?.generatedAt ? new Date(selectedHistoryItem.generatedAt).toLocaleString() : 'N/A'}`}
      >
        {selectedHistoryItem && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Badge variant={selectedHistoryItem.threatLevel || 'HIGH'}>
                  {selectedHistoryItem.threatLevel || 'HIGH'} THREAT
                </Badge>
                {selectedHistoryItem.confidence && (
                  <Badge variant={`CONFIDENCE_${selectedHistoryItem.confidence.toUpperCase()}`} size="sm">
                    {selectedHistoryItem.confidence} CONFIDENCE
                  </Badge>
                )}
              </div>
              <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                Engine: {selectedHistoryItem.model || 'two-loop-agent'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="text-xs font-mono uppercase text-zinc-700 dark:text-zinc-300 font-semibold block">Summary</span>
              <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">{selectedHistoryItem.summary}</p>
            </div>

            {selectedHistoryItem.riskExplanation && (
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <span className="text-xs font-mono uppercase text-zinc-700 dark:text-zinc-300 font-semibold block">Risk Explanation</span>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                  {selectedHistoryItem.riskExplanation}
                </p>
              </div>
            )}

            {selectedHistoryItem.suspiciousIndicators && selectedHistoryItem.suspiciousIndicators.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-zinc-500 uppercase">Suspicious Indicators:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedHistoryItem.suspiciousIndicators.map((ind, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-500/30 text-[11px] font-mono dark:text-amber-300">
                      • {ind}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedHistoryItem.recommendations && selectedHistoryItem.recommendations.length > 0 && (
              <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 space-y-2">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Recorded Playbook Recommendations:
                </span>
                <ul className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
                  {selectedHistoryItem.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-zinc-500 shrink-0" />
              <span>{selectedHistoryItem.disclaimer || 'Advisory assessment archived for security audit compliance.'}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GrokAiPage;
