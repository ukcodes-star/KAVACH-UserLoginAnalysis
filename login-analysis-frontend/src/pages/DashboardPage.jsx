import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldAlert,
  Activity,
  AlertTriangle,
  Flame,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { dashboardApi, grokAiApi } from '../api';
import logger from '../utils/logger';
import { useTheme } from '../context/ThemeContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  Badge,
  Button,
  Modal,
  Skeleton,
  AiStatusBadge,
} from '../components/ui';
import { staggerEntrance } from '../utils/animations';

const SEVERITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#eab308',
  LOW:      '#06b6d4',
};

export const DashboardPage = () => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [riskyUsers, setRiskyUsers] = useState([]);
  const [criticalAnomalies, setCriticalAnomalies] = useState([]);

  // AI Modal
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    logger.info('Fetching SOC security dashboard metrics');
    try {
      const [secRes, riskyRes, critRes] = await Promise.all([
        dashboardApi.getSecurity(),
        dashboardApi.getTopRiskyUsers(),
        dashboardApi.getRecentCriticalAnomalies(),
      ]);

      setData(secRes);
      setRiskyUsers(riskyRes || []);
      setCriticalAnomalies(critRes || []);
      logger.info('SOC dashboard metrics successfully synchronized');
    } catch (err) {
      logger.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        staggerEntrance('.dash-kpi-card', { y: 15, duration: 0.4, stagger: 0.06 });
      }, 50);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleRunAiOnAnomaly = async (anomalyId) => {
    setAiLoading(true);
    setAiModalOpen(true);
    setAiAnalysis(null);
    logger.info(`Invoking AI threat inspection for anomaly ID: ${anomalyId}`);
    try {
      const res = await grokAiApi.analyzeAnomaly(anomalyId);
      setAiAnalysis(res);
      logger.info(`AI threat inspection completed for anomaly ID: ${anomalyId}`);
    } catch (err) {
      logger.error(`AI threat inspection failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRunAiOnUser = async (userId) => {
    setAiLoading(true);
    setAiModalOpen(true);
    setAiAnalysis(null);
    logger.info(`Invoking AI behavioral risk analysis for user ID: ${userId}`);
    try {
      const res = await grokAiApi.analyzeUser(userId);
      setAiAnalysis(res);
      logger.info(`AI user analysis completed for user ID: ${userId}`);
    } catch (err) {
      logger.error(`AI user analysis failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Prepare chart data
  const chartData = (data?.last7Days || []).map((d) => ({
    date: d.date,
    Successful: d.successfulLogins,
    Failed: d.failedLogins,
    Total: d.totalLogins,
  }));

  const pieData = [
    { name: 'Critical', value: data?.criticalAnomalies || 0, color: SEVERITY_COLORS.CRITICAL },
    { name: 'High',     value: data?.highAnomalies || 0,     color: SEVERITY_COLORS.HIGH },
    { name: 'Medium',   value: data?.mediumAnomalies || 0,   color: SEVERITY_COLORS.MEDIUM },
    { name: 'Low',      value: data?.lowAnomalies || 0,      color: SEVERITY_COLORS.LOW },
  ].filter((d) => d.value > 0);

  const failedRate = data?.totalLogins > 0
    ? ((data.failedLogins / data.totalLogins) * 100).toFixed(1)
    : (data?.failedLoginRate != null
        ? (data.failedLoginRate > 1 ? Number(data.failedLoginRate).toFixed(1) : (data.failedLoginRate * 100).toFixed(1))
        : '0.0');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            Security Operations Dashboard
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time behavioral telemetry & AI neural authentication analysis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadDashboard}
            icon={RefreshCw}
            loading={loading}
          >
            Refresh Feed
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="dash-kpi-card">
          <StatCard
            title="Monitored Users"
            value={loading ? '...' : (data?.totalUsers ?? 0)}
            subtitle="Directory principals under surveillance"
            icon={Users}
            color="cyan"
          />
        </div>

        <div className="dash-kpi-card">
          <StatCard
            title="Risky Accounts"
            value={loading ? '...' : (data?.riskyUsers ?? 0)}
            subtitle="Risk threshold ≥ 60/100"
            icon={Flame}
            color="rose"
            glow={data?.riskyUsers > 0}
            trend={data?.riskyUsers > 0 ? `${data.riskyUsers} elevated` : 'None'}
            trendDirection={data?.riskyUsers > 0 ? 'up' : 'neutral'}
          />
        </div>

        <div className="dash-kpi-card">
          <StatCard
            title="Failed Login Rate"
            value={loading ? '...' : `${failedRate}%`}
            subtitle={`${data?.failedLogins ?? 0} / ${data?.totalLogins ?? 0} sessions failed`}
            icon={Activity}
            color="amber"
            trend={parseFloat(failedRate) > 20 ? 'Elevated failure rate' : 'Normal range'}
            trendDirection={parseFloat(failedRate) > 20 ? 'up' : 'down'}
          />
        </div>

        <div className="dash-kpi-card">
          <StatCard
            title="Total Anomalies"
            value={loading ? '...' : (data?.totalAnomalies ?? 0)}
            subtitle={`${data?.criticalAnomalies ?? 0} Critical • ${data?.highAnomalies ?? 0} High`}
            icon={ShieldAlert}
            color="violet"
          />
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Login Trends Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>7-Day Authentication Trajectory</CardTitle>
              <CardDescription>
                Temporal breakdown of successful vs anomalous failed sessions
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="w-full h-full" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-zinc-400 text-sm">
                No telemetry recorded for the past 7 days
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e4e4e7'} />
                    <XAxis
                      dataKey="date"
                      stroke={isDark ? '#71717a' : '#a1a1aa'}
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={isDark ? '#71717a' : '#a1a1aa'}
                      fontSize={11}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#09090b' : '#ffffff',
                        borderColor: isDark ? '#27272a' : '#e4e4e7',
                        borderRadius: '10px',
                        fontSize: '12px',
                        color: isDark ? '#fafafa' : '#09090b',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Successful"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSuccess)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Failed"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorFailed)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Severity Distribution Donut Chart */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Anomaly Severity Matrix</CardTitle>
              <CardDescription>Incident distribution categorized by threat score</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="w-full h-full" />
              </div>
            ) : pieData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-zinc-400 text-sm gap-2">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
                <p>Zero active security anomalies</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke={isDark ? '#09090b' : '#ffffff'} strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#09090b' : '#ffffff',
                        borderColor: isDark ? '#27272a' : '#e4e4e7',
                        borderRadius: '10px',
                        fontSize: '12px',
                        color: isDark ? '#fafafa' : '#09090b',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(val) => <span className="text-xs text-zinc-600 dark:text-zinc-300">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grid: Top Risky Users & Critical Anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Risky Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle>
                  <Flame className="w-4 h-4 text-rose-500" />
                  Priority Threat Accounts
                </CardTitle>
                <CardDescription>Users displaying elevated composite anomaly risk</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : riskyUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                No high-risk accounts identified in current monitoring window.
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                {riskyUsers.map((u) => (
                  <div
                    key={u.userId}
                    className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm text-zinc-900 dark:text-zinc-200">
                          {u.username}
                        </span>
                        <Badge variant={u.riskLevel} size="sm">
                          {u.riskLevel}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {u.anomalyCount} anomalies • User ID: #{u.userId}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                          {u.riskScore}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">/ 100 Risk</span>
                      </div>

                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleRunAiOnUser(u.userId)}
                        icon={Sparkles}
                      >
                        AI Profile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Critical Anomalies */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Recent High-Priority Anomalies
                </CardTitle>
                <CardDescription>Latest heuristic exceptions requiring containment</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : criticalAnomalies.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                No recent critical or high anomalies recorded.
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                {criticalAnomalies.map((anomaly) => (
                  <div
                    key={anomaly.id}
                    className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="space-y-1 max-w-[65%]">
                      <div className="flex items-center gap-2">
                        <Badge variant={anomaly.severity} size="sm" dot>
                          {anomaly.severity}
                        </Badge>
                        <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                          {anomaly.anomalyType}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        User: <span className="text-zinc-800 dark:text-zinc-300 font-medium">@{anomaly.username}</span> • {anomaly.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleRunAiOnAnomaly(anomaly.id)}
                        icon={Sparkles}
                      >
                        AI Inspect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Threat Analysis Modal */}
      <Modal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        size="lg"
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            AI Threat Intelligence Dossier
          </span>
        }
        subtitle="Autonomous SOC Security Assessment & Mitigation Plan"
      >
        {aiLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-600 dark:text-violet-400 animate-spin">
              <RefreshCw className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
              Querying Neural Threat Engine...
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
              Correlating anomaly telemetry, MITRE ATT&CK vectors, and generating containment playbook.
            </p>
          </div>
        ) : aiAnalysis ? (
          <div className="space-y-4 text-zinc-800 dark:text-zinc-200 text-xs">
            {/* Header info */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Badge variant={aiAnalysis.threatLevel || 'HIGH'}>
                  {aiAnalysis.threatLevel || 'HIGH'} THREAT
                </Badge>
                {aiAnalysis.confidence && (
                  <Badge variant={`CONFIDENCE_${aiAnalysis.confidence.toUpperCase()}`} size="sm">
                    {aiAnalysis.confidence} CONFIDENCE
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-950/60 px-2.5 py-0.5 rounded border border-violet-200 dark:border-violet-500/30">
                  Engine: Active Core
                </span>
                <AiStatusBadge live={true} />
              </div>
            </div>

            {/* Summary */}
            {aiAnalysis.summary && (
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[11px] font-mono uppercase text-violet-700 dark:text-violet-400 font-semibold block mb-1">
                  Incident Brief:
                </span>
                <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed">
                  {aiAnalysis.summary}
                </p>
              </div>
            )}

            {/* Risk Explanation */}
            {(aiAnalysis.riskExplanation || aiAnalysis.detailedAnalysis) && (
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <span className="text-[11px] font-mono uppercase text-cyan-700 dark:text-cyan-400 font-semibold block">
                  Threat Rationale & Behavioral Deviation:
                </span>
                <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line font-sans">
                  {aiAnalysis.riskExplanation || aiAnalysis.detailedAnalysis}
                </p>
              </div>
            )}

            {/* Suspicious Indicators */}
            {aiAnalysis.suspiciousIndicators && aiAnalysis.suspiciousIndicators.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-zinc-500 uppercase">Suspicious Indicators:</span>
                <div className="flex flex-wrap gap-1.5">
                  {aiAnalysis.suspiciousIndicators.map((ind, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-500/30 text-[11px] font-mono dark:text-amber-300"
                    >
                      • {ind}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Potential Implications */}
            {aiAnalysis.potentialSecurityImplications && aiAnalysis.potentialSecurityImplications.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 space-y-1">
                <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">Potential Security Implications:</span>
                <ul className="text-xs text-zinc-700 dark:text-zinc-300 list-disc list-inside space-y-0.5">
                  {aiAnalysis.potentialSecurityImplications.map((imp, i) => (
                    <li key={i}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Containment Actions */}
            {(aiAnalysis.recommendations || aiAnalysis.recommendedActions) && (
              <div className="p-3.5 rounded-xl bg-cyan-50/80 dark:bg-cyan-950/25 border border-cyan-200 dark:border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Recommended Incident Playbook:
                  </h4>
                  <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400/80 bg-cyan-100 dark:bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-500/20">
                    Advisory • Requires Admin Review
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                  {(aiAnalysis.recommendations || aiAnalysis.recommendedActions).map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Advisory Note */}
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
              {aiAnalysis.disclaimer || 'AI analysis is advisory only. Consequential security actions require administrator approval.'}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-400 text-sm">
            No analysis returned.
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DashboardPage;
