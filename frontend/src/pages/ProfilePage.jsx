import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { loadPreferences, savePreferences } from '../lib/preferences.js';

const DAY = 24 * 60 * 60 * 1000;

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [prefs, setPrefs] = useState(loadPreferences);
  const [form, setForm] = useState({ display_name: '', username: '', bio: '', avatar_url: '' });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const pageRef = useRef(null);

  useEffect(() => {
    Promise.all([api.profile.get(), api.tasks.list({})])
      .then(([p, t]) => {
        setProfile(p);
        setTasks(t ?? []);
        setForm({
          display_name: p?.display_name ?? '',
          username: p?.username ?? '',
          bio: p?.bio ?? '',
          avatar_url: p?.avatar_url ?? '',
        });
      })
      .catch((err) => setError(err.message || 'Could not load profile'));
  }, []);

  useEffect(() => {
    if (!pageRef.current || prefs.reduceMotion) return;
    gsap.fromTo(pageRef.current.querySelectorAll('.profile-anim'), { opacity: 0, y: 10 }, {
      opacity: 1,
      y: 0,
      duration: 0.32,
      stagger: 0.04,
      ease: 'power2.out',
    });
  }, [prefs.reduceMotion]);

  const stats = useMemo(() => makeStats(tasks, prefs.dailyGoal), [tasks, prefs.dailyGoal]);
  const initials = (form.display_name || form.username || user?.email || '?').charAt(0).toUpperCase();

  async function saveProfile(e) {
    e.preventDefault();
    setError('');
    try {
      const updated = await api.profile.update(form);
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } catch (err) {
      setError(err.message || 'Could not save profile');
    }
  }

  function updateGoal(value) {
    const next = { ...prefs, dailyGoal: Number(value) || 1 };
    setPrefs(next);
    savePreferences(next);
  }

  return (
    <div className="profile-page" ref={pageRef}>
      <header className="profile-hero profile-anim">
        <div className="profile-avatar-xl">
          {form.avatar_url ? <img src={form.avatar_url} alt="" /> : <span>{initials}</span>}
        </div>
        <div className="profile-hero-copy">
          <h1>{form.display_name || form.username || 'Student profile'}</h1>
          <p>{form.bio || 'Track your study rhythm, completion pace, and the work you are steadily moving through.'}</p>
        </div>
      </header>

      {error && <div className="form-error profile-anim">{error}</div>}

      <section className="profile-stats profile-anim">
        <Stat label="Completed" value={stats.done} />
        <Stat label="Open" value={stats.open} />
        <Stat label="Overdue" value={stats.overdue} />
        <Stat label="Streak" value={`${stats.streak}d`} />
      </section>

      <section className="profile-grid">
        <div className="profile-panel profile-anim">
          <div className="profile-panel-head">
            <h2>Completion Activity</h2>
            <span>last 35 days</span>
          </div>
          <div className="activity-grid">
            {stats.activity.map((day) => (
              <span
                key={day.key}
                className={`activity-cell level-${Math.min(day.count, 4)}`}
                title={`${day.label}: ${day.count} completed`}
              />
            ))}
          </div>
        </div>

        <div className="profile-panel profile-anim">
          <div className="profile-panel-head">
            <h2>Goal Pace</h2>
            <span>{prefs.dailyGoal}/day</span>
          </div>
          <PaceChart pace={stats.pace} />
          <label className="field profile-goal">
            <span>Daily goal</span>
            <input type="number" min="1" max="24" value={prefs.dailyGoal} onChange={(e) => updateGoal(e.target.value)} />
          </label>
        </div>

        <form className="profile-panel profile-form profile-anim" onSubmit={saveProfile}>
          <div className="profile-panel-head">
            <h2>Profile Details</h2>
            {saved && <span className="save-ok">saved</span>}
          </div>
          <label className="field">
            <span>Display name</span>
            <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
          </label>
          <label className="field">
            <span>Username</span>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </label>
          <label className="field">
            <span>Avatar URL</span>
            <input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} />
          </label>
          <label className="field">
            <span>Bio</span>
            <textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </label>
          <button className="btn-accent" type="submit">Save profile</button>
        </form>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="profile-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function PaceChart({ pace }) {
  const width = 360;
  const height = 150;
  const max = Math.max(1, ...pace.map((p) => p.goal), ...pace.map((p) => p.done));
  const points = (key) => pace.map((p, i) => {
    const x = (i / Math.max(1, pace.length - 1)) * width;
    const y = height - (p[key] / max) * (height - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="pace-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Completion pace chart">
      <polyline className="pace-goal" points={points('goal')} />
      <polyline className="pace-done" points={points('done')} />
    </svg>
  );
}

function makeStats(tasks, dailyGoal) {
  const today = startDay(new Date());
  const doneTasks = tasks.filter((task) => task.status === 'done');
  const open = tasks.filter((task) => task.status !== 'done').length;
  const overdue = tasks.filter((task) => task.status !== 'done' && task.deadline && new Date(task.deadline) < new Date()).length;

  const byDate = new Map();
  for (const task of doneTasks) {
    const d = startDay(new Date(task.deadline || task.start_time || task.created_at));
    const key = d.toISOString().slice(0, 10);
    byDate.set(key, (byDate.get(key) || 0) + 1);
  }

  const activity = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today.getTime() - (34 - i) * DAY);
    const key = d.toISOString().slice(0, 10);
    return {
      key,
      label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count: byDate.get(key) || 0,
    };
  });

  let streak = 0;
  for (let i = activity.length - 1; i >= 0; i -= 1) {
    if (activity[i].count === 0) break;
    streak += 1;
  }

  let cumulative = 0;
  const pace = activity.slice(-14).map((day, i) => {
    cumulative += day.count;
    return { done: cumulative, goal: (i + 1) * dailyGoal };
  });

  return { done: doneTasks.length, open, overdue, streak, activity, pace };
}

function startDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
