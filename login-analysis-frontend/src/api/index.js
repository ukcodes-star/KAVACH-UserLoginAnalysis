import apiClient from './client';

export const authApi = {
  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },
  register: async (userData) => {
    const res = await apiClient.post('/auth/register', userData);
    return res.data;
  },
};

export const dashboardApi = {
  getSecurity: async () => {
    const res = await apiClient.get('/dashboard/security');
    return res.data;
  },
  getTopRiskyUsers: async () => {
    const res = await apiClient.get('/dashboard/top-risky-users');
    return res.data;
  },
  getRecentCriticalAnomalies: async () => {
    const res = await apiClient.get('/dashboard/recent-critical-anomalies');
    return res.data;
  },
};

export const anomaliesApi = {
  getAll: async (params = {}) => {
    const res = await apiClient.get('/anomalies', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await apiClient.get(`/anomalies/${id}`);
    return res.data;
  },
  getByUser: async (userId) => {
    const res = await apiClient.get(`/anomalies/user/${userId}`);
    return res.data;
  },
  getUserPaginated: async (userId, params = {}) => {
    const res = await apiClient.get(`/anomalies/user/${userId}/paginated`, { params });
    return res.data;
  },
  getBySeverity: async (severity) => {
    const res = await apiClient.get(`/anomalies/severity/${severity}`);
    return res.data;
  },
  getByType: async (type) => {
    const res = await apiClient.get(`/anomalies/type/${type}`);
    return res.data;
  },
};

export const riskApi = {
  getDashboardSummary: async () => {
    const res = await apiClient.get('/risk/dashboard');
    return res.data;
  },
  getUserRisk: async (userId) => {
    const res = await apiClient.get(`/risk/user/${userId}`);
    return res.data;
  },
};

export const loginLogsApi = {
  getAll: async () => {
    const res = await apiClient.get('/login-logs');
    return res.data;
  },
  getUserLogs: async (userId) => {
    const res = await apiClient.get(`/login-logs/user/${userId}`);
    return res.data;
  },
  getFailed: async () => {
    const res = await apiClient.get('/login-logs/failed');
    return res.data;
  },
  getRecent: async (hours = 24) => {
    const res = await apiClient.get('/login-logs/recent', { params: { hours } });
    return res.data;
  },
  create: async (payload) => {
    const res = await apiClient.post('/login-logs', payload);
    return res.data;
  },
};

export const analyticsApi = {
  getLoginAnalytics: async () => {
    const res = await apiClient.get('/analytics/logins');
    return res.data;
  },
};

export const usersApi = {
  getAll: async () => {
    const res = await apiClient.get('/users');
    return res.data;
  },
  getById: async (id) => {
    const res = await apiClient.get(`/users/${id}`);
    return res.data;
  },
  create: async (userData) => {
    const res = await apiClient.post('/users', userData);
    return res.data;
  },
  update: async (id, userData) => {
    const res = await apiClient.put(`/users/${id}`, userData);
    return res.data;
  },
  updateStatus: async (id, active) => {
    const res = await apiClient.patch(`/users/${id}/status`, null, { params: { active } });
    return res.data;
  },
  delete: async (id) => {
    const res = await apiClient.delete(`/users/${id}`);
    return res.data;
  },
};

export const auditLogsApi = {
  getAll: async () => {
    const res = await apiClient.get('/audit-logs');
    return res.data;
  },
  getByUser: async (username) => {
    const res = await apiClient.get(`/audit-logs/user/${username}`);
    return res.data;
  },
  getByAction: async (action) => {
    const res = await apiClient.get(`/audit-logs/action/${action}`);
    return res.data;
  },
};

export const grokAiApi = {
  getStatus: async () => {
    const res = await apiClient.get('/ai/status');
    return res.data;
  },
  getSummary: async () => {
    const res = await apiClient.post('/ai/analyze/security-summary');
    return res.data;
  },
  analyzeAnomaly: async (anomalyId) => {
    const res = await apiClient.post(`/ai/analyze/anomaly/${anomalyId}`);
    return res.data;
  },
  getHistory: async (params = {}) => {
    const res = await apiClient.get('/ai/history', { params });
    return res.data;
  },
  getHistoryById: async (id) => {
    const res = await apiClient.get(`/ai/history/${id}`);
    return res.data;
  },
  analyzeUser: async (userId) => {
    const res = await apiClient.post(`/ai/analyze-user/${userId}`);
    return res.data;
  },
  chat: async (prompt, context = '') => {
    const res = await apiClient.post('/ai/chat', { prompt, context });
    return res.data;
  },
  runAgentLoop: async (payload) => {
    const res = await apiClient.post('/ai/agent-loop', payload);
    return res.data;
  },
  getAgentTools: async () => {
    const res = await apiClient.get('/ai/agent-tools');
    return res.data;
  },
};

export const aiApi = grokAiApi;
