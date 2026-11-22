import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  RefreshCw,
  Globe,
  X,
  FileCheck,
} from 'lucide-react';
import { auditLogsApi } from '../api';
import logger from '../utils/logger';
import {
  Card,
  Table,
  Badge,
  Button,
  Input,
  Select,
} from '../components/ui';
import { staggerEntrance } from '../utils/animations';

export const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const fetchAuditLogs = async () => {
    setLoading(true);
    logger.info(`Fetching audit trail logs: action=${actionFilter || 'ALL'}, user=${userSearch || 'ALL'}`);
    try {
      let data = [];
      if (userSearch.trim()) {
        data = await auditLogsApi.getByUser(userSearch.trim());
      } else if (actionFilter) {
        data = await auditLogsApi.getByAction(actionFilter);
      } else {
        data = await auditLogsApi.getAll();
      }
      setLogs(data || []);
      logger.info(`Loaded ${data?.length || 0} audit trail events`);
    } catch (err) {
      logger.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        staggerEntrance('.audit-table-anim', { y: 15, duration: 0.35, stagger: 0.04 });
      }, 50);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAuditLogs();
  };

  const clearFilters = () => {
    setActionFilter('');
    setUserSearch('');
    fetchAuditLogs();
  };

  const columns = [
    {
      key: 'action',
      label: 'Security Event',
      render: (val) => {
        const isViolation = val.includes('DENIED') || val.includes('UNAUTHORIZED');
        return (
          <Badge
            variant={isViolation ? 'CRITICAL' : 'DEFAULT'}
            size="sm"
            dot={isViolation}
          >
            {val}
          </Badge>
        );
      },
    },
    {
      key: 'username',
      label: 'Subject Identity',
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-200">
          {val ? `@${val}` : 'ANONYMOUS'}
        </span>
      ),
    },
    {
      key: 'details',
      label: 'Event Telemetry & Scope',
      render: (val) => (
        <span className="text-xs text-zinc-700 dark:text-zinc-300 font-mono max-w-sm truncate block" title={val}>
          {val}
        </span>
      ),
    },
    {
      key: 'ipAddress',
      label: 'Source Network Address',
      render: (val) => (
        <div className="flex items-center gap-1.5 font-mono text-xs text-cyan-600 dark:text-cyan-400">
          <Globe className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
          <span>{val || '0.0.0.0'}</span>
        </div>
      ),
    },
    {
      key: 'timestamp',
      label: 'Audit Timestamp',
      render: (val) => (
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {val ? new Date(val).toLocaleString() : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <History className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            Immutable Audit Trail & Compliance Log
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Ledger of authorization events, access denial alerts, and privilege changes
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchAuditLogs}
          icon={RefreshCw}
          loading={loading}
        >
          Refresh Audit Feed
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white/80 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
            <Input
              placeholder="Search by username..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              icon={Search}
              className="text-xs"
            />
            <Button type="submit" variant="secondary" size="md">
              Filter
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="w-48">
              <Select
                placeholder="All Security Actions"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                options={[
                  { label: 'UNAUTHORIZED_ACCESS', value: 'UNAUTHORIZED_ACCESS' },
                  { label: 'ACCESS_DENIED', value: 'ACCESS_DENIED' },
                  { label: 'USER_CREATED', value: 'USER_CREATED' },
                  { label: 'STATUS_CHANGED', value: 'STATUS_CHANGED' },
                ]}
              />
            </div>

            {(actionFilter || userSearch) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                icon={X}
                className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Audit Table */}
      <Card className="audit-table-anim overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/40">
        <Table
          columns={columns}
          data={logs}
          loading={loading}
          emptyMessage="No security audit events recorded"
          emptyIcon={FileCheck}
        />
      </Card>
    </div>
  );
};

export default AuditPage;
