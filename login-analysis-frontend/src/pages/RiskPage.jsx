import React, { useState, useEffect } from 'react';
import {
  Activity,
  UserCheck,
  Flame,
  Search,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  AlertOctagon,
  ShieldAlert,
} from 'lucide-react';
import { riskApi, grokAiApi, dashboardApi } from '../api';
import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  Badge,
  Button,
  Input,
  AiStatusBadge,
  Skeleton,
} from '../components/ui';
import { staggerEntrance } from '../utils/animations';

export const RiskPage = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [topRisky, setTopRisky] = useState([]);

  // User inspection state
  const [targetUserId, setTargetUserId] = useState(currentUser?.id || 1);
  const [userRisk, setUserRisk] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState(null);

  // AI Analysis
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const loadRiskOverview = async () => {
    setLoading(true);
    logger.info('Fetching behavioral risk radar metrics');
    try {
      const [sumRes, topRes] = await Promise.all([
        riskApi.getDashboardSummary().catch(() => null),
        dashboardApi.getTopRiskyUsers().catch(() => []),
      ]);
      setSummary(sumRes);
      setTopRisky(topRes || []);
      logger.info('Risk overview metrics synchronized');
    } catch (err) {
      logger.error('Failed to load risk summary:', err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        staggerEntrance('.risk-anim-item', { y: 15, duration: 0.35, stagger: 0.05 });
      }, 50);
    }
  };

  const inspectUserRisk = async (userIdToInspect) => {
    const uid = isAdmin ? (userIdToInspect || targetUserId) : currentUser?.id;
    if (!uid) return;

    setUserLoading(true);
    setUserError(null);
    setAiAnalysis(null);
    logger.info(`Evaluating composite risk score for user ID: ${uid} (Role: ${isAdmin ? 'ADMIN' : 'USER'})`);
    try {
      const res = await riskApi.getUserRisk(uid);
      setUserRisk(res);
      setTargetUserId(uid);
      logger.info(`User ID ${uid} risk evaluated: ${res.riskScore}/100 (${res.riskLevel})`);
    } catch (err) {
      setUserError(err.message || 'Failed to retrieve risk profile for specified user.');
      logger.error(`Risk calculation error for user ${uid}: ${err.message}`);
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    loadRiskOverview();
    if (currentUser?.id) {
      inspectUserRisk(currentUser.id);
    }
  }, []);

  const handleRunAiAnalysis = async () => {
    if (!userRisk?.userId) return;
    setAiLoading(true);
    logger.info(`Generating AI risk profile for user ${userRisk.userId}`);
    try {
      const res = await grokAiApi.analyzeUser(userRisk.userId);
      setAiAnalysis(res);
      logger.info(`AI risk profile generated successfully for user ${userRisk.userId}`);
    } catch (err) {
      logger.error(`AI analysis failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            Behavioral Risk Radar & Threat Scoring
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Continuous Bayesian behavioral baselining and AI identity risk profiling
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            loadRiskOverview();
            inspectUserRisk(targetUserId);
          }}
          icon={RefreshCw}
          loading={loading}
        >
          Refresh Risk Radar
        </Button>
      </div>

      {/* Overview Stat Cards (Admin) */}
      {isAdmin && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="risk-anim-item">
            <StatCard
              title="Total Users Tracked"
              value={summary.totalUsers}
              subtitle="Directory accounts in baseline"
              icon={UserCheck}
              color="cyan"
            />
          </div>
          <div className="risk-anim-item">
            <StatCard
              title="Risky Accounts (≥60)"
              value={summary.riskyUsers}
              subtitle="Accounts requiring quarantine"
              icon={Flame}
              color="rose"
              glow={summary.riskyUsers > 0}
            />
          </div>
          <div className="risk-anim-item">
            <StatCard
              title="Critical Incidents"
              value={summary.criticalAnomalies}
              subtitle="Immediate containment priority"
              icon={AlertOctagon}
              color="rose"
            />
          </div>
          <div className="risk-anim-item">
            <StatCard
              title="Total Anomalies"
              value={summary.totalAnomalies}
              subtitle={`${summary.highAnomalies} High • ${summary.mediumAnomalies} Medium`}
              icon={ShieldAlert}
              color="amber"
            />
          </div>
        </div>
      )}

      {/* Main Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: User Risk Search & Quick Select */}
        <Card className="risk-anim-item lg:col-span-1 space-y-4 p-5 bg-white/80 dark:bg-zinc-950/80 border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              {isAdmin ? 'Account Risk Lookup' : 'Your Personal Account Profile'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {isAdmin
                ? 'Enter target account ID or select from prioritized watchlist'
                : `Viewing individual behavioral score for @${currentUser?.username || 'User'}`}
            </p>
          </div>

          {isAdmin ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                inspectUserRisk();
              }}
              className="flex items-center gap-2"
            >
              <Input
                placeholder="User ID (e.g. 1)"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="font-mono text-xs"
                required
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={userLoading}
                icon={Search}
              >
                Scan
              </Button>
            </form>
          ) : (
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-300 flex items-center justify-between">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">@{currentUser?.username}</span>
              <Badge variant="USER" size="sm">ID #{currentUser?.id}</Badge>
            </div>
          )}

          {/* Quick select priority risky users (ADMIN only) */}
          {isAdmin && topRisky.length > 0 && (
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                Elevated Watchlist
              </span>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {topRisky.map((u) => (
                  <button
                    key={u.userId}
                    onClick={() => inspectUserRisk(u.userId)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                      userRisk?.userId === u.userId
                        ? 'bg-zinc-100 dark:bg-zinc-800 border border-cyan-500/30 text-zinc-900 dark:text-zinc-100'
                        : 'bg-zinc-50 dark:bg-zinc-950/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div>
                      <span className="font-mono font-semibold">@{u.username}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">ID: #{u.userId}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{u.riskScore}</span>
                      <Badge variant={u.riskLevel} size="sm" className="ml-1.5">
                        {u.riskLevel}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Right: Detailed Risk Score & AI Profiler */}
        <Card className="risk-anim-item lg:col-span-2 bg-white/80 dark:bg-zinc-950/80 border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle>Threat Assessment Dossier</CardTitle>
                <CardDescription>
                  {userRisk ? `Profile for @${userRisk.username} (#${userRisk.userId})` : 'Select an account to view risk metrics'}
                </CardDescription>
              </div>
              {userRisk && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunAiAnalysis}
                  loading={aiLoading}
                  icon={Sparkles}
                >
                  AI Risk Profile
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {userLoading ? (
              <div className="py-12 space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : userError ? (
              <div className="p-8 text-center text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-200 dark:border-rose-500/30">
                {userError}
              </div>
            ) : userRisk ? (
              <div className="space-y-6">
                {/* Score Banner */}
                <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center sm:text-left">
                    <span className="text-xs font-mono uppercase text-zinc-500">
                      Calculated Composite Risk Rating
                    </span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-extrabold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
                        {userRisk.riskScore}
                        <span className="text-lg text-zinc-400 dark:text-zinc-500 font-normal">/100</span>
                      </span>
                      <Badge variant={userRisk.riskLevel} size="lg" dot>
                        {userRisk.riskLevel} RISK
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {userRisk.anomalyCount} anomalies attributed to this principal
                    </p>
                  </div>

                  {/* Progress Gauge */}
                  <div className="w-full sm:w-48 space-y-2">
                    <div className="flex justify-between text-xs font-mono text-zinc-500">
                      <span>Baseline</span>
                      <span className="text-rose-600 dark:text-rose-400 font-bold">{userRisk.riskScore}%</span>
                    </div>
                    <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          userRisk.riskScore >= 70
                            ? 'bg-gradient-to-r from-orange-500 to-rose-500'
                            : userRisk.riskScore >= 40
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                            : 'bg-gradient-to-r from-cyan-400 to-emerald-500'
                        }`}
                        style={{ width: `${Math.min(userRisk.riskScore, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                      <span>0 (Safe)</span>
                      <span>60 (Watch)</span>
                      <span>100 (Critical)</span>
                    </div>
                  </div>
                </div>

                {/* AI Analysis Output */}
                {aiAnalysis && (
                  <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-violet-200 dark:border-violet-500/30 space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          AI Neural Threat Profile
                        </span>
                      </div>
                      <AiStatusBadge live={aiAnalysis.status === 'LIVE' || true} />
                    </div>

                    <div className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 font-sans whitespace-pre-line bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      {aiAnalysis.detailedAnalysis}
                    </div>

                    {aiAnalysis.recommendedActions && (
                      <div className="p-3.5 rounded-xl bg-cyan-50/80 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/30 space-y-1.5">
                        <span className="text-xs font-semibold text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                          Recommended Mitigation Actions:
                        </span>
                        <ul className="text-xs text-zinc-700 dark:text-zinc-300 list-disc list-inside space-y-1">
                          {aiAnalysis.recommendedActions.map((act, i) => (
                            <li key={i}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                Select or search for an account to inspect behavioral risk metrics.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RiskPage;
