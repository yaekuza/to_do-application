import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
  </svg>
);
const NoteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="12" y2="17" />
  </svg>
);
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001.08 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1.08H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z" />
  </svg>
);
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 17l-5-5 5-5M5 12h12" />
  </svg>
);
const MenuIcon = ({ collapsed }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 6h16M4 12h16M4 18h16" />
    <path d={collapsed ? 'M14 9l3 3-3 3' : 'M10 9l-3 3 3 3'} />
  </svg>
);

export default function AppShell() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('rail-collapsed') === 'true');
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    api.profile.get().then(setProfile).catch(() => {});
  }, []);

  const avatarUrl = profile?.avatar_url;
  const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0] || '';
  const initials = displayName.charAt(0).toUpperCase();

  function toggleCollapsed() {
    setCollapsed((value) => {
      localStorage.setItem('rail-collapsed', String(!value));
      return !value;
    });
  }

  async function handleSignOut() {
    setSigningOut(true);
    await gsap.to('.main', { opacity: 0, scale: 0.985, duration: 0.24, ease: 'power2.in' });
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className={`shell ${collapsed ? 'rail-collapsed' : ''}`}>
      <nav className="rail">
        <button className="rail-toggle" type="button" onClick={toggleCollapsed} title={collapsed ? 'Open sidebar' : 'Close sidebar'}>
          <MenuIcon collapsed={collapsed} />
        </button>

        <NavLink to="/profile" className={({ isActive }) => `rail-profile ${isActive ? 'active' : ''}`}>
          <div className="rail-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <span className="rail-username">{displayName}</span>
          <div className="rail-profile-popout">
            <strong>{displayName || 'Student'}</strong>
            <span>{user?.email}</span>
            <p>{profile?.bio || 'No bio yet. Add one on your profile page.'}</p>
          </div>
        </NavLink>

        <NavLink to="/dashboard" className={({ isActive }) => `rail-item ${isActive ? 'active' : ''}`}>
          <DashboardIcon />
          <span>overview</span>
        </NavLink>
        <NavLink to="/calendar" className={({ isActive }) => `rail-item ${isActive ? 'active' : ''}`}>
          <CalendarIcon />
          <span>calendar</span>
        </NavLink>
        <NavLink to="/notes" className={({ isActive }) => `rail-item ${isActive ? 'active' : ''}`}>
          <NoteIcon />
          <span>notes</span>
        </NavLink>

        <div className="rail-spacer" />

        <NavLink to="/settings" className={({ isActive }) => `rail-item ${isActive ? 'active' : ''}`}>
          <SettingsIcon />
          <span>settings</span>
        </NavLink>
        <button className="rail-item" onClick={handleSignOut} title="Sign out" disabled={signingOut}>
          <LogoutIcon />
          <span>{signingOut ? 'leaving...' : 'sign out'}</span>
        </button>
      </nav>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
