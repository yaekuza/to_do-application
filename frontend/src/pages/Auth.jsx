import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.6 3.1 14.5 2 12 2 6.9 2 2.7 6.2 2.7 11.4S6.9 20.8 12 20.8c6.9 0 9.5-4.8 9.5-7.3 0-.5 0-.9-.1-1.3H12z" />
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
    <path d="M20.3 4.5A17.5 17.5 0 0016 3.2l-.2.4a13.3 13.3 0 00-3.8 0L11.8 3.2c-1.5.2-3 .6-4.3 1.3C4.7 8.6 4 12.5 4.3 16.4a17.6 17.6 0 005.4 2.7l.4-.6a12.4 12.4 0 01-2-1l.5-.3a12.5 12.5 0 0010.8 0l.5.3a12.4 12.4 0 01-2 1l.4.6a17.6 17.6 0 005.4-2.7c.4-4.6-.7-8.5-3-11.9zM9.5 14.2c-1 0-1.9-1-1.9-2.2s.8-2.2 1.9-2.2 1.9 1 1.9 2.2-.8 2.2-1.9 2.2zm5 0c-1 0-1.9-1-1.9-2.2s.8-2.2 1.9-2.2 1.9 1 1.9 2.2-.9 2.2-1.9 2.2z" />
  </svg>
);

export default function Auth({ mode }) {
  const navigate = useNavigate();
  const { session, signInWithPassword, signUpWithPassword, signInWithOAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);

  if (session) {
    return <Navigate to="/calendar" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error: err } = await signUpWithPassword(email, password);
        if (err) throw err;
        setInfo('Check your email to confirm — or sign in directly if confirmations are off.');
      } else {
        const { error: err } = await signInWithPassword(email, password);
        if (err) throw err;
        navigate('/calendar', { replace: true });
      }
    } catch (err) {
      setError(err.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (provider) => {
    setError(null);
    try {
      const { error: err } = await signInWithOAuth(provider);
      if (err) throw err;
    } catch (err) {
      setError(err.message ?? String(err));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="mark">T</div>
          <div className="name">takenhandelaar</div>
        </div>

        <div className="auth-tabs">
          <Link to="/login" className={`auth-tab ${mode === 'login' ? 'active' : ''}`}>
            log in
          </Link>
          <Link to="/signup" className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}>
            sign up
          </Link>
        </div>

        <div className="auth-providers">
          <button type="button" className="provider-btn" onClick={() => oauth('google')}>
            <span className="icon"><GoogleIcon /></span>
            continue with google
          </button>
          <button type="button" className="provider-btn" onClick={() => oauth('discord')}>
            <span className="icon"><DiscordIcon /></span>
            continue with discord
          </button>
        </div>

        <div className="auth-divider"><span>or</span></div>

        <form className="auth-form" onSubmit={submit}>
          <input
            className="auth-input"
            type="email"
            placeholder="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="auth-input"
            type="password"
            placeholder="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && <div className="auth-error">{error}</div>}
          {info && <div className="auth-info">{info}</div>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? '…' : mode === 'signup' ? 'sign up' : 'log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
