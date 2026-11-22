import axios from 'axios';
import logger from '../utils/logger';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() };
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    logger.http(`API Request: [${config.method?.toUpperCase()}] ${config.url}`, {
      params: config.params,
    });
    return config;
  },
  (error) => {
    logger.error('API Request Error:', { message: error.message });
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    const duration = response.config?.metadata ? Date.now() - response.config.metadata.startTime : 0;
    logger.http(`API Response: [${response.status}] ${response.config.url} (${duration}ms)`);
    return response;
  },
  (error) => {
    const status = error.response ? error.response.status : null;
    const errorData = error.response?.data;
    const message = errorData?.error || errorData?.message || error.message || 'Unknown network error';

    logger.error(`API Error [${status || 'NET'}]: ${message}`, {
      url: error.config?.url,
      status,
      data: errorData,
    });

    if (status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      if (!isAuthEndpoint) {
        logger.warn('Authentication expired or invalid. Clearing session state.');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.dispatchEvent(new CustomEvent('auth-unauthorized'));
      }
    }

    return Promise.reject({
      status,
      message,
      data: errorData,
      raw: error,
    });
  }
);

export default apiClient;
