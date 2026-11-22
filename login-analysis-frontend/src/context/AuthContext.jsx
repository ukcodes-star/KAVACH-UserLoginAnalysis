import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';
import logger from '../utils/logger';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for unauthorized 401 events from axios interceptor
    const handleUnauthorized = () => {
      logger.warn('Session expired. Logging out user.');
      logout();
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    setLoading(false);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  const login = async (username, password) => {
    logger.info(`Authenticating user: ${username}`);
    try {
      const res = await authApi.login({ username, password });
      const { accessToken, id, email, role, active } = res;

      const userData = { id, username, email, role, active };
      setToken(accessToken);
      setUser(userData);

      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('auth_user', JSON.stringify(userData));

      logger.info(`Login successful for ${username} (Role: ${role})`);
      return { success: true, user: userData };
    } catch (err) {
      logger.error(`Login failed for ${username}: ${err.message}`);
      throw err;
    }
  };

  const register = async (username, email, password) => {
    logger.info(`Registering new user account: ${username} (${email})`);
    try {
      const res = await authApi.register({ username, email, password });
      logger.info(`Registration successful for ${username}`);
      return { success: true, data: res };
    } catch (err) {
      logger.error(`Registration failed for ${username}: ${err.message}`);
      throw err;
    }
  };

  const logout = () => {
    logger.info(`User logged out: ${user?.username || 'Unknown'}`);
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
