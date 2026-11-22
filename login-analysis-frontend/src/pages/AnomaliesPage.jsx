import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  X,
  AlertTriangle,
  ShieldCheck,
  Check,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { anomaliesApi, grokAiApi } from '../api';
import logger from '../utils/logger';
import {
  Card,
  Table,
  Badge,
  Button,
  Select,
  Modal,
  Pagination,
  AiStatusBadge,
} from '../components/ui';
import { staggerEntrance } from '../utils/animations';

export const AnomaliesPage = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('detectedAt');
  const [direction, setDirection] = useState('desc');

  // Selected anomaly modal
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const fetchAnomalies = async () => {
    setLoading(true);
    logger.info(`Fetching anomalies: page=${page}, size=${size}, severity=${severityFilter || 'ALL'}, type=${typeFilter || 'ALL'}, role=${isAdmin ? 'ADMIN' : 'USER'}`);
    try {
      const params = {
        page,
        size,
        sortBy,
        direction,
      };
      if (severityFilter) params.severity = severityFilter;
      if (typeFilter) params.type = typeFilter;

      let res;
      if (isAdmin) {
        res = await anomaliesApi.getAll(params);
      } else if (user?.id) {
        res = await anomaliesApi.getUserPaginated(user.id, params);
      } else {
        res = { content: [], totalPages: 1, totalElements: 0 };
      }

      setAnomalies(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
      logger.info(`Retrieved ${res.numberOfElements || res.content?.length || 0} anomaly records`);
    } catch (err) {
      logger.error('Failed to load anomalies:', err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        staggerEntrance('.anomaly-table-anim', { y: 15, duration: 0.35, stagger: 0.04 });
      }, 50);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [page, size, severityFilter, typeFilter, sortBy, direction]);

  const handleInspect = (anomaly) => {
    setSelectedAnomaly(anomaly);
    setAiAnalysis(null);
  };

  const handleRunAi = async (anomalyId) => {
    setAiLoading(true);
    logger.info(`Invoking AI analysis for anomaly ID: ${anomalyId}`);
    try {
      const res = await grokAiApi.analyzeAnomaly(anomalyId);
      setAiAnalysis(res);
      logger.info(`AI successfully analyzed anomaly ID: ${anomalyId}`);
    } catch (err) {
      logger.error(`AI analysis failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const clearFilters = () => {
    setSeverityFilter('');
    setTypeFilter('');
    setSortBy('detectedAt');
    setDirection('desc');
    setPage(0);
  };

  const hasActiveFilters = severityFilter || typeFilter || sortBy !== 'detectedAt' || direction !== 'desc';

  const columns = [
    {
      key: 'id',
      label: 'Anomaly ID',
      render: (val, row) => (
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">#{row.id}</span>
      ),
    },
    {
      key: 'username',
      label: 'Account',
      render: (val, row) => (
        <span className="font-semibold text-zinc-900 dark:text-zinc-200">@{row.username}</span>
      ),
    },
    {
      key: 'anomalyType',
      label: 'Anomaly Vector',
      render: (val, row) => (
        <Badge variant={row.severity} size="sm">
          {row.anomalyType}
        </Badge>
      ),
    },
    {
      key: 'severity',
      label: 'Severity',
      render: (val, row) => (
        <Badge variant={row.severity} size="sm" dot>
          {row.severity}
        </Badge>
      ),
    },
    {
      key: 'riskScore',
      label: 'Risk Score',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-200">
            {row.riskScore}/100
          </span>
          <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                row.riskScore >= 70
                  ? 'bg-rose-500'
                  : row.riskScore >= 40
                  ? 'bg-amber-400'
                  : 'bg-cyan-500'
              }`}
              style={{ width: `${Math.min(row.riskScore, 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'detectedAt',
      label: 'Detected Timestamp',
      render: (val, row) => (
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          {new Date(row.detectedAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      className: 'text-right',
      render: (val, row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              handleInspect(row);
            }}
            icon={Eye}
            className="text-zinc-600 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400"
          >
            Inspect
          </Button>
          <Button
            variant="secondary"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              handleInspect(row);
              handleRunAi(row.id);
            }}
            icon={Sparkles}
          >
            AI Analysis
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-500" />
              Anomaly Intelligence
            </h1>
            <Badge variant="CRITICAL" size="sm">
              {totalElements} Events
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time behavioral anomaly detection combined with AI neural threat intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchAnomalies}
            loading={loading}
            icon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <Card className="p-4 bg-white/80 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 backdrop-blur-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select
            label="Severity Filter"
            placeholder="All Severities"
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setPage(0);
            }}
            options={[
              { value: 'CRITICAL', label: 'CRITICAL' },
              { value: 'HIGH', label: 'HIGH' },
              { value: 'MEDIUM', label: 'MEDIUM' },
              { value: 'LOW', label: 'LOW' },
            ]}
          />

          <Select
            label="Anomaly Vector"
            placeholder="All Vectors"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(0);
            }}
            options={[
              { value: 'UNUSUAL_TIME', label: 'Unusual Time' },
              { value: 'GEOGRAPHIC_ANOMALY', label: 'Geographic Distance' },
              { value: 'BRUTE_FORCE', label: 'Brute Force Attempts' },
              { value: 'RAPID_LOCATION_CHANGE', label: 'Rapid Location Jump' },
              { value: 'NEW_DEVICE', label: 'New Device / User-Agent' },
              { value: 'FAILED_ATTEMPTS_SPIKE', label: 'Failed Attempts Spike' },
            ]}
          />

          <Select
            label="Sort Field"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'detectedAt', label: 'Detection Timestamp' },
              { value: 'riskScore', label: 'Risk Score' },
              { value: 'severity', label: 'Severity Level' },
            ]}
          />

          <Select
            label="Sort Order"
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            options={[
              { value: 'desc', label: 'Descending (Highest/Newest)' },
              { value: 'asc', label: 'Ascending (Lowest/Oldest)' },
            ]}
          />
        </div>

        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-500 flex items-center gap-1.5 font-medium">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-500" />
              Active custom filters applied
            </span>
            <button
              onClick={clearFilters}
              className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-mono text-xs"
            >
              <X className="w-3.5 h-3.5" /> Reset Filters
            </button>
          </div>
        )}
      </Card>

      {/* Main Anomalies Table */}
      <Card className="anomaly-table-anim overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/40">
        <Table
          columns={columns}
          data={anomalies}
          loading={loading}
          emptyMessage="No anomalies found for the selected query filters."
          onRowClick={handleInspect}
        />

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={size}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </Card>

      {/* Inspection & AI Threat Modal */}
      <Modal
        isOpen={!!selectedAnomaly}
        onClose={() => setSelectedAnomaly(null)}
        size="lg"
        title={
          <span className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Anomaly Telemetry & Forensics #{selectedAnomaly?.id}
          </span>
        }
        subtitle={`Detected on account @${selectedAnomaly?.username}`}
      >
        {selectedAnomaly && (
          <div className="space-y-6">
            {/* Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] uppercase font-mono text-zinc-500 block">Severity</span>
                <Badge variant={selectedAnomaly.severity} size="sm" className="mt-1">
                  {selectedAnomaly.severity}
                </Badge>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] uppercase font-mono text-zinc-500 block">Risk Score</span>
                <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400 mt-1 block">
                  {selectedAnomaly.riskScore} / 100
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] uppercase font-mono text-zinc-500 block">Type</span>
                <span className="text-xs font-bold font-mono text-zinc-800 dark:text-zinc-200 mt-1 block">
                  {selectedAnomaly.anomalyType}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] uppercase font-mono text-zinc-500 block">Detected</span>
                <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300 mt-1 block">
                  {new Date(selectedAnomaly.detectedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                System Observation
              </span>
              <p className="text-sm text-zinc-800 dark:text-zinc-200">{selectedAnomaly.description}</p>
            </div>

            {/* AI Action Box */}
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/80 border border-violet-200 dark:border-violet-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      AI Neural Threat Intelligence Analysis
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Evaluates suspicion level, indicators of compromise, security impact, and administrator action playbook.
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleRunAi(selectedAnomaly.id)}
                  loading={aiLoading}
                  icon={Sparkles}
                >
                  Analyze with AI Engine
                </Button>
              </div>

              {/* AI Analysis Result */}
              {aiAnalysis && (
                <div className="mt-4 pt-4 border-t border-violet-200 dark:border-violet-500/20 space-y-4 animate-in fade-in duration-200">
                  {/* Status header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={aiAnalysis.threatLevel || selectedAnomaly.severity}>
                        {aiAnalysis.threatLevel || selectedAnomaly.severity} THREAT
                      </Badge>
                      {aiAnalysis.confidence && (
                        <Badge variant={`CONFIDENCE_${aiAnalysis.confidence.toUpperCase()}`} size="sm">
                          {aiAnalysis.confidence} CONFIDENCE
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-950/60 px-2 py-0.5 rounded border border-violet-200 dark:border-violet-500/30">
                        Engine: Active Core
                      </span>
                      <AiStatusBadge live={true} />
                    </div>
                  </div>

                  {/* Summary */}
                  {aiAnalysis.summary && (
                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
                      <span className="text-[11px] font-mono uppercase text-violet-700 dark:text-violet-400 font-semibold block mb-1">
                        Incident Summary:
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
                        Why this activity is suspicious:
                      </span>
                      <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 font-sans whitespace-pre-line">
                        {aiAnalysis.riskExplanation || aiAnalysis.detailedAnalysis}
                      </p>
                    </div>
                  )}

                  {/* Suspicious Indicators */}
                  {aiAnalysis.suspiciousIndicators && aiAnalysis.suspiciousIndicators.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        Suspicious Indicators:
                      </span>
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

                  {/* Potential Security Implications */}
                  {aiAnalysis.potentialSecurityImplications && aiAnalysis.potentialSecurityImplications.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 space-y-1.5">
                      <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        Potential Security Implications:
                      </span>
                      <ul className="text-xs text-zinc-700 dark:text-zinc-300 list-disc list-inside space-y-1">
                        {aiAnalysis.potentialSecurityImplications.map((imp, i) => (
                          <li key={i}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Actions */}
                  {(aiAnalysis.recommendations || aiAnalysis.recommendedActions) && (
                    <div className="p-3.5 rounded-xl bg-cyan-50/80 dark:bg-cyan-950/25 border border-cyan-200 dark:border-cyan-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                          Recommended Security Playbook:
                        </span>
                        <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400/80 bg-cyan-100 dark:bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-500/20">
                          Requires Admin Approval
                        </span>
                      </div>
                      <ul className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1.5">
                        {(aiAnalysis.recommendations || aiAnalysis.recommendedActions).map((act, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Advisory Disclaimer */}
                  <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                    <Info className="w-4 h-4 text-violet-500 shrink-0" />
                    <span>
                      {aiAnalysis.disclaimer || 'AI-generated analysis is advisory only. Consequential security actions require administrator approval.'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AnomaliesPage;
