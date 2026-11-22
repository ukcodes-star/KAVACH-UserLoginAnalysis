import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  RefreshCw,
  Power,
  Trash2,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { usersApi } from '../api';
import logger from '../utils/logger';
import {
  Card,
  Table,
  Badge,
  Button,
  Input,
  Modal,
} from '../components/ui';
import { staggerEntrance } from '../utils/animations';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create User Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [createError, setCreateError] = useState(null);

  // Delete User Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    logger.info('Fetching identity directory accounts');
    try {
      const data = await usersApi.getAll();
      setUsers(data || []);
      logger.info(`Loaded ${data?.length || 0} user directory accounts`);
    } catch (err) {
      logger.error('Failed to load users:', err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        staggerEntrance('.users-table-anim', { y: 15, duration: 0.35, stagger: 0.04 });
      }, 50);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    logger.info(`Creating directory account: ${newUsername}`);
    try {
      await usersApi.create({
        username: newUsername,
        email: newEmail,
        password: newPassword,
      });
      logger.info(`Directory account created: ${newUsername}`);
      setCreateOpen(false);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      fetchUsers();
    } catch (err) {
      setCreateError(err.message || 'Failed to create user');
      logger.error(`Failed to create user: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = !user.active;
    logger.info(`Toggling account status for @${user.username} (ID: ${user.id}) -> ${nextStatus ? 'ACTIVE' : 'DISABLED'}`);
    try {
      await usersApi.updateStatus(user.id, nextStatus);
      logger.info(`Account status updated for @${user.username}`);
      fetchUsers();
    } catch (err) {
      logger.error(`Status update error for user ${user.id}: ${err.message}`);
      alert(err.message || 'Status toggle failed');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    logger.info(`Deleting user account ID: ${deleteTarget.id} (@${deleteTarget.username})`);
    try {
      await usersApi.delete(deleteTarget.id);
      logger.info(`User account ID ${deleteTarget.id} deleted`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      logger.error(`Failed to delete user: ${err.message}`);
      alert(err.message || 'Delete operation failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (val) => <span className="font-mono text-xs text-zinc-500">#{val}</span>,
    },
    {
      key: 'username',
      label: 'Username',
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-cyan-600 dark:text-cyan-400">@{val}</span>
      ),
    },
    {
      key: 'email',
      label: 'Email Address',
      render: (val) => <span className="text-xs text-zinc-700 dark:text-zinc-300">{val}</span>,
    },
    {
      key: 'active',
      label: 'Account Status',
      render: (val) => (
        <Badge variant={val ? 'ACTIVE' : 'INACTIVE'} size="sm" dot>
          {val ? 'ACTIVE' : 'DISABLED'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Registered On',
      render: (val) => (
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {val ? new Date(val).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Directory Controls',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant={row.active ? 'secondary' : 'primary'}
            size="xs"
            onClick={() => handleToggleStatus(row)}
            icon={Power}
            title={row.active ? 'Deactivate user' : 'Activate user'}
          >
            {row.active ? 'Deactivate' : 'Activate'}
          </Button>

          <Button
            variant="ghost"
            size="xs"
            onClick={() => setDeleteTarget(row)}
            icon={Trash2}
            className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400"
            title="Delete user"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            Identity & Access Management (IAM)
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Directory user lifecycle, account locking, and access governance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateOpen(true)}
            icon={UserPlus}
          >
            Provision User
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={fetchUsers}
            icon={RefreshCw}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* IAM Table */}
      <Card className="users-table-anim overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/40">
        <Table
          columns={columns}
          data={users}
          loading={loading}
          emptyMessage="No directory accounts registered"
          emptyIcon={Users}
        />
      </Card>

      {/* Provision User Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        size="md"
        title="Provision Identity Account"
        subtitle="Register a new principal into the security directory"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs dark:text-rose-300">
              {createError}
            </div>
          )}

          <Input
            label="Username"
            icon={User}
            placeholder="e.g. sec_analyst"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            icon={Mail}
            type="email"
            placeholder="analyst@domain.security"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />

          <Input
            label="Initial Password"
            icon={Lock}
            type="password"
            placeholder="Minimum 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={createLoading}
            >
              Provision Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        size="sm"
        title="Confirm Account Deletion"
        subtitle="This action permanently purges the user principal."
      >
        <div className="space-y-4 text-xs text-zinc-700 dark:text-zinc-300">
          <p>
            Are you sure you want to delete account <strong className="text-zinc-900 dark:text-white">@{deleteTarget?.username}</strong>?
          </p>
          <p className="text-zinc-500 dark:text-zinc-400">
            Associated historical login logs and anomaly records will be affected.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteUser}
              loading={deleteLoading}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;
