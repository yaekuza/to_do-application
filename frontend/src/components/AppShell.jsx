import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
  </svg>
);
const TagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 12V4h8l10 10-8 8L3 12z" />
    <circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" />
  </svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
  </svg>
);
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 17l-5-5 5-5M5 12h12" />
  </svg>
);

export default function AppShell() {
  const { signOut } = useAuth();

  return (
    <div className="shell">
      <nav className="rail">
        <div className="rail-brand">T</div>

        <NavLink to="/calendar" className={({ isActive }) => `rail-item ${isActive ? 'active' : ''}`}>
          <CalendarIcon />
          <span>calendar</span>
        </NavLink>
        <NavLink to="/categories" className={({ isActive }) => `rail-item ${isActive ? 'active' : ''}`}>
          <TagIcon />
          <span>vakken</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `rail-item ${isActive ? 'active' : ''}`}>
          <UserIcon />
          <span>profile</span>
        </NavLink>

        <div className="rail-spacer" />

        <button className="rail-item" onClick={() => signOut()} title="sign out">
          <LogoutIcon />
          <span>sign out</span>
        </button>
      </nav>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
