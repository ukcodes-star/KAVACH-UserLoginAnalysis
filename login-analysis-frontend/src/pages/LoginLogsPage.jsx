import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  RefreshCw,
  Laptop,
  Globe,
  Copy,
  Check,
} from 'lucide-react';
import { loginLogsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';
import {
  Card,
  Table,
  Badge,
  Button,
  Select,
  Input,
  Modal,
} from '../components/ui';
import { staggerEntrance } from '../utils/animations';

export const LoginLogsPage = () => {
  const { user, isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'FAILED' | 'RECENT'
  const [copiedIp, setCopiedIp] = useState(null);

  // Simulation modal
  const [modalOpen, setModalOpen] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [simUserId, setSimUserId] = useState(user?.id || '1');
  const [simIp, setSimIp] = useState('192.168.1.100');
  const [simDevice, setSimDevice] = useState('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0');
  const [simLocation, setSimLocation] = useState('New York, USA');
  const [simStatus, setSimStatus] = useState('SUCCESS');

  const fetchLogs = async () => {
    setLoading(true);
    logger.info(`Fetching login logs (Mode: ${activeFilter})`);
    try {
      let data = [];
      if (!isAdmin) {
        data = await loginLogsApi.getUserLogs(user.id);
      } else if (activeFilter === 'FAILED') {
        data = await loginLogsApi.getFailed();
      } else if (activeFilter === 'RECENT') {
        data = await loginLogsApi.getRecent(24);
      } else {
        data = await loginLogsApi.getAll();
      }
      setLogs(data || []);
      logger.info(`Loaded ${data?.length || 0} login telemetry events`);
    } catch (err) {
      logger.error('Failed to load login logs:', err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        staggerEntrance('.logs-table-anim', { y: 15, duration: 0.35, stagger: 0.04 });
      }, 50);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeFilter]);

  const handleSimulateLogin = async (e) => {
    e.preventDefault();
    setSimLoading(true);
    logger.info(`Simulating authentication event for user ID ${simUserId} (Status: ${simStatus})`);
    try {
      await loginLogsApi.create({
        userId: Number(simUserId),
        ipAddress: simIp,
        device: simDevice,
        location: simLocation,
        status: simStatus,
      });
      logger.info('Authentication simulation event generated and ingested');
      setModalOpen(false);
      fetchLogs();
    } catch (err) {
      logger.error(`Failed to simulate login: ${err.message}`);
      alert(err.message || 'Simulation failed');
    } finally {
      setSimLoading(false);
    }
  };

  const copyIp = (ip) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 1500);
  };

  const columns = [
    {
      key: 'status',
      label: 'Result',
      render: (val) => <Badge variant={val} size="sm" dot>{val}</Badge>,
    },
    {
      key: 'username',
      label: 'Principal Account',
      render: (val, row) => (
        <div>
          <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-200">@{val}</span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">UID: #{row.userId}</span>
        </div>
      ),
    },
    {
      key: 'ipAddress',
      label: 'Originating IP',
      render: (val) => (
        <div className="flex items-center gap-1.5 font-mono text-xs text-cyan-600 dark:text-cyan-400">
          <span>{val}</span>
          <button
            onClick={() => copyIp(val)}
            className="p-1 hover:text-zinc-900 dark:hover:text-white rounded opacity-60 hover:opacity-100 transition-opacity"
            title="Copy IP"
          >
            {copiedIp === val ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      ),
    },
    {
      key: 'device',
      label: 'Client Fingerprint',
      render: (val) => (
        <div className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 max-w-xs truncate" title={val}>
          <Laptop className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
          <span className="truncate">{val || 'Standard Web Client'}</span>
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Estimated Location',
      render: (val) => (
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <Globe className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
          <span>{val || 'Unknown / VPN'}</span>
        </div>
      ),
    },
    {
      key: 'loginTime',
      label: 'Timestamp',
      render: (val) => (
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {val ? new Date(val).toLocaleString() : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            Authentication Telemetry Log
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Ingested audit trail of access requests, geolocation headers, and device signatures
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setModalOpen(true)}
              icon={Plus}
            >
              Simulate Login Event
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={fetchLogs}
            icon={RefreshCw}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs (Admin) */}
      {isAdmin && (
        <div className="flex items-center gap-2">
          {[
            { id: 'ALL', label: 'All Telemetry' },
            { id: 'FAILED', label: 'Failed Attempts Only' },
            { id: 'RECENT', label: 'Past 24 Hours' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeFilter === tab.id
                  ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-cyan-400 border border-zinc-900 dark:border-cyan-500/30'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Telemetry Table */}
      <Card className="logs-table-anim overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/40">
        <Table
          columns={columns}
          data={logs}
          loading={loading}
          emptyMessage="No login telemetry recorded for selected criteria"
          emptyIcon={FileText}
        />
      </Card>

      {/* Simulate Login Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        size="md"
        title="Simulate Authentication Telemetry"
        subtitle="Emit a simulated login event to test heuristics & AI anomaly detection"
      >
        <form onSubmit={handleSimulateLogin} className="space-y-4">
          <Input
            label="User ID"
            type="number"
            value={simUserId}
            onChange={(e) => setSimUserId(e.target.value)}
            required
            helperText="Target account ID to simulate"
          />

          <Input
            label="IP Address"
            value={simIp}
            onChange={(e) => setSimIp(e.target.value)}
            placeholder="e.g. 203.0.113.195 (use a new IP to trigger NEW_IP)"
            required
          />

          <Input
            label="Device / User Agent Fingerprint"
            value={simDevice}
            onChange={(e) => setSimDevice(e.target.value)}
            placeholder="e.g. iPhone iOS 17 (Safari)"
            required
          />

          <Input
            label="Geolocation"
            value={simLocation}
            onChange={(e) => setSimLocation(e.target.value)}
            placeholder="e.g. Tokyo, Japan"
          />

          <Select
            label="Authentication Outcome"
            value={simStatus}
            onChange={(e) => setSimStatus(e.target.value)}
            options={[
              { label: 'SUCCESS - Granted', value: 'SUCCESS' },
              { label: 'FAILED - Bad Credentials', value: 'FAILED' },
            ]}
          />

          <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/30 text-xs text-cyan-800 dark:text-cyan-300">
            Tip: Submitting 5 consecutive FAILED logins within 10 minutes will trigger the <strong className="font-mono">BRUTE_FORCE</strong> anomaly rule!
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={simLoading}
            >
              Emit Telemetry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LoginLogsPage;
