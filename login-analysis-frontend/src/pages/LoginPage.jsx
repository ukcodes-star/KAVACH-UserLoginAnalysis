import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Alert, KavachLogo } from '../components/ui';
import { staggerEntrance } from '../utils/animations';

export const LoginPage = () => {
  const { login, register, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const formRef = useRef(null);

  const from = location.state?.from?.pathname || (isAdmin ? '/dashboard' : '/anomalies');

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? '/dashboard' : '/anomalies', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (formRef.current) {
      staggerEntrance('.auth-animate-item', { y: 20, duration: 0.5, stagger: 0.08 });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!username.trim() || !password.trim()) {
      setError('Please provide all required fields');
      return;
    }

    if (activeTab === 'register') {
      if (!email.trim()) {
        setError('Email address is required');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);
    try {
      if (activeTab === 'login') {
        await login(username, password);
        navigate(from, { replace: true });
      } else {
        await register(username, email, password);
        setSuccessMsg('Registration successful! You can now log in.');
        setActiveTab('login');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.message || 'Operation failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto flex items-center justify-center p-4">
      <div ref={formRef} className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="auth-animate-item flex items-center justify-center gap-3 mb-6">
          <KavachLogo size={36} variant="mark" />
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white uppercase">
            Kavach
          </h1>
        </div>

        {/* Auth Card */}
        <Card className="auth-animate-item p-6 border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/80 shadow-2xl backdrop-blur-xl">
          {/* Mode Switcher */}
          <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-900 p-1 mb-6 border border-zinc-200 dark:border-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all duration-150 ${
                activeTab === 'login'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-cyan-400 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all duration-150 ${
                activeTab === 'register'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-cyan-400 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback messages */}
          {error && (
            <Alert type="danger" onDismiss={() => setError(null)} className="mb-4">
              {error}
            </Alert>
          )}

          {successMsg && (
            <Alert type="success" onDismiss={() => setSuccessMsg(null)} className="mb-4">
              {successMsg}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              icon={User}
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            {activeTab === 'register' && (
              <Input
                label="Email Address"
                icon={Mail}
                type="email"
                placeholder="analyst@domain.security"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            )}

            <Input
              label="Password"
              icon={Lock}
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {activeTab === 'register' && (
              <Input
                label="Confirm Password"
                icon={Lock}
                type="password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2 font-medium"
            >
              {activeTab === 'login' ? 'Authenticate Session' : 'Register New Analyst'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
