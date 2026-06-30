import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabaseConfig } from '../lib/supabase';

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

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

function authErrorMessage(err) {
  const raw = err?.message ?? String(err);
  if (!supabaseConfig.isConfigured) {
    return 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to frontend/.env, then restart the dev server.';
  }
  if (/failed to fetch|fetch failed|networkerror/i.test(raw)) {
    return 'Cannot reach Supabase Auth. Check that VITE_SUPABASE_URL points to an active Supabase project, your internet/DNS works, and then restart the dev server.';
  }
  return raw;
}

export default function Auth() {
  const navigate = useNavigate();
  const { session, signInWithPassword, signUpWithPassword, signInWithOAuth } = useAuth();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const nicknameRef = useRef(null);

  useLayoutEffect(() => {
    if (!nicknameRef.current) return;
    if (mode === 'signup') {
      gsap.fromTo(
        nicknameRef.current,
        { height: 0, opacity: 0, y: -8 },
        { height: 'auto', opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' },
      );
    } else {
      gsap.to(nicknameRef.current, { height: 0, opacity: 0, y: -8, duration: 0.22, ease: 'power2.in' });
    }
  }, [mode]);

  if (session && !leaving) {
    return <Navigate to="/calendar" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error: err } = await signUpWithPassword(email, password, nickname.trim());
        if (err) throw err;
        setInfo('Check your email to confirm — or sign in directly if confirmations are off.');
        setBusy(false);
      } else {
        const { error: err } = await signInWithPassword(email, password);
        if (err) throw err;
        setLeaving(true);
        setTimeout(() => navigate('/calendar', { replace: true }), 180);
      }
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  const oauth = async (provider) => {
    setError(null);
    try {
      const { error: err } = await signInWithOAuth(provider);
      if (err) throw err;
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError(null);
    setInfo(null);
  };

  return (
    <div className={`auth-split ${leaving ? 'auth-leaving' : ''}`}>
      <div className="auth-left">
        <div className="auth-left-inner">
          <div className="auth-hero">
            <h1 className="auth-title">GET STARTED</h1>
            <p className="auth-subtitle">
              Plan your school work. Stay on track.
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Sign up
            </button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            <div ref={nicknameRef} className="auth-field auth-nickname" aria-hidden={mode !== 'signup'}>
              <label className="auth-label">Nickname</label>
              <input
                className="auth-input"
                type="text"
                placeholder="what should we call you?"
                autoComplete="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required={mode === 'signup'}
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                type="password"
                placeholder="min. 6 characters"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && <div className="auth-error">{error}</div>}
            {!supabaseConfig.isConfigured && (
              <div className="auth-error">
                Supabase env values are missing. Fill in frontend/.env with your Project URL and Publishable key, then restart Vite.
              </div>
            )}
            {info && <div className="auth-info">{info}</div>}

            <button type="submit" className="auth-submit" disabled={busy || leaving}>
              {busy ? <span className="auth-spinner" /> : <span>{mode === 'signup' ? 'Create account' : 'Sign in'}</span>}
              {!busy && <ArrowIcon />}
            </button>
          </form>

          <div className="auth-divider"><span>or continue with</span></div>

          <div className="auth-providers">
            <button type="button" className="provider-btn" onClick={() => oauth('google')}>
              <GoogleIcon />
              <span>Google</span>
            </button>
            <button type="button" className="provider-btn" onClick={() => oauth('discord')}>
              <DiscordIcon />
              <span>Discord</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
