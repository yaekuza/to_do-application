import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences } from '../lib/preferences.js';

const GearIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 00-.1-1l2-1.6-2-3.5-2.4 1a7 7 0 00-1.7-1L14.5 3h-5l-.4 2.9a7 7 0 00-1.7 1L5 5.9l-2 3.5L5.1 11a7 7 0 000 2L3 14.6l2 3.5 2.4-1a7 7 0 001.7 1l.4 2.9h5l.4-2.9a7 7 0 001.7-1l2.4 1 2-3.5-2-1.6c.1-.3.1-.7.1-1z" />
  </svg>
);
const PaintIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 3a9 9 0 000 18h1.5a1.5 1.5 0 000-3H12a6 6 0 110-12 6 6 0 016 6v1.5a1.5 1.5 0 003 0V12a9 9 0 00-9-9z" />
    <circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7.5" r="1" /><circle cx="14" cy="7.5" r="1" />
  </svg>
);
const BellIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M9.5 20a3 3 0 005 0" />
  </svg>
);
const DataIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
  </svg>
);
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const TABS = [
  { id: 'preferences', label: 'preferences', icon: GearIcon },
  { id: 'appearance', label: 'appearance', icon: PaintIcon },
  { id: 'notifications', label: 'notifications', icon: BellIcon },
  { id: 'data', label: 'data', icon: DataIcon },
  { id: 'account', label: 'account', icon: ShieldIcon },
];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'preferences';
  const [prefs, setPrefs] = useState(DEFAULT_PREFERENCES);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(loadPreferences());
  }, []);

  function updatePref(key, value) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    savePreferences(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  function resetPreferences() {
    setPrefs(DEFAULT_PREFERENCES);
    savePreferences(DEFAULT_PREFERENCES);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  return (
    <div className="st-layout">
      <aside className="st-sidebar">
        <h2 className="st-sidebar-title">Settings</h2>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`st-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: id })}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
        <div className="st-sidebar-spacer" />
      </aside>

      <div className="st-content">
        {saved && <div className="st-toast">Saved</div>}

        {activeTab === 'preferences' && (
          <section className="st-panel">
            <h1 className="st-panel-title">Preferences</h1>
            <div className="setting-row">
              <div>
                <h3>Daily task goal</h3>
                <p>Used by your profile pace graph.</p>
              </div>
              <input
                className="setting-number"
                type="number"
                min="1"
                max="24"
                value={prefs.dailyGoal}
                onChange={(e) => updatePref('dailyGoal', Number(e.target.value) || 1)}
              />
            </div>
            <div className="setting-row">
              <div>
                <h3>Week starts on</h3>
                <p>Calendar currently renders school weeks Monday-first.</p>
              </div>
              <select value={prefs.weekStartsOn} onChange={(e) => updatePref('weekStartsOn', e.target.value)}>
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
          </section>
        )}

        {activeTab === 'appearance' && (
          <section className="st-panel">
            <h1 className="st-panel-title">Appearance</h1>
            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={prefs.compactCalendar}
                onChange={(e) => updatePref('compactCalendar', e.target.checked)}
              />
              <span>Compact calendar density</span>
            </label>
            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={prefs.reduceMotion}
                onChange={(e) => updatePref('reduceMotion', e.target.checked)}
              />
              <span>Reduce decorative motion</span>
            </label>
          </section>
        )}

        {activeTab === 'notifications' && (
          <section className="st-panel">
            <h1 className="st-panel-title">Notifications</h1>
            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={prefs.emailReminders}
                onChange={(e) => updatePref('emailReminders', e.target.checked)}
              />
              <span>Email reminder preference</span>
            </label>
            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={prefs.overdueWarnings}
                onChange={(e) => updatePref('overdueWarnings', e.target.checked)}
              />
              <span>Show overdue warnings</span>
            </label>
            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={prefs.weeklyDigest}
                onChange={(e) => updatePref('weeklyDigest', e.target.checked)}
              />
              <span>Weekly digest preference</span>
            </label>
          </section>
        )}

        {activeTab === 'data' && (
          <section className="st-panel">
            <h1 className="st-panel-title">Data</h1>
            <div className="setting-row">
              <div>
                <h3>Local preferences</h3>
                <p>Reset browser-only settings such as goals and display preferences.</p>
              </div>
              <button className="btn-ghost" onClick={resetPreferences}>Reset</button>
            </div>
          </section>
        )}

        {activeTab === 'account' && (
          <section className="st-panel">
            <h1 className="st-panel-title">Account</h1>
            <div className="st-info-row">
              <span className="st-info-label">Email</span>
              <span>{user?.email}</span>
            </div>
            <div className="st-danger-section">
              <h3>Session</h3>
              <p>Sign out of your account on this device.</p>
              <button className="btn-danger" onClick={() => signOut()}>Sign out</button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
