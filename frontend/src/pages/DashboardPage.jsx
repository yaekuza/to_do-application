import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(() => {
    setLoading(true);
    return Promise.all([api.tasks.list({}), api.profile.get()])
      .then(([t, p]) => {
      setTasks(t ?? []);
      setProfile(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDashboard();

    function refreshIfVisible() {
      if (document.visibilityState !== 'hidden') loadDashboard();
    }

    window.addEventListener('focus', refreshIfVisible);
    document.addEventListener('visibilitychange', refreshIfVisible);
    return () => {
      window.removeEventListener('focus', refreshIfVisible);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [loadDashboard]);

  const now = useMemo(() => new Date(), [tasks]);

  const stats = useMemo(() => {
    const unfinished = tasks.filter((t) => t.status !== 'done');
    const open = tasks.filter((t) => t.status === 'open');
    const inProgress = tasks.filter((t) => t.status === 'in_progress');
    const done = tasks.filter((t) => t.status === 'done');
    const overdue = unfinished.filter((t) => {
      const d = t.deadline ? new Date(t.deadline) : null;
      return d && d < now;
    });
    const upcoming = unfinished
      .filter((t) => {
        const ref = t.deadline || t.start_time;
        if (!ref) return false;
        const d = new Date(ref);
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return d >= now && d <= weekFromNow;
      })
      .sort((a, b) => {
        const da = new Date(a.deadline || a.start_time);
        const db = new Date(b.deadline || b.start_time);
        return da - db;
      });
    const dueToday = unfinished.filter((t) => t.deadline && sameDay(new Date(t.deadline), now));
    const highPriority = unfinished.filter((t) => t.priority === 'high')
      .sort((a, b) => new Date(a.deadline || a.created_at) - new Date(b.deadline || b.created_at));
    const completionRate = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
    return {
      total: tasks.length,
      open: open.length,
      inProgress: inProgress.length,
      done: done.length,
      overdue,
      upcoming,
      dueToday,
      highPriority,
      completionRate,
    };
  }, [tasks, now]);

  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0] || '';

  return (
    <div className="dash-page">
      <header className="dash-header">
        <div>
          <h1 className="dash-greeting">{greeting}, {displayName}</h1>
          <p className="dash-date">{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <Link to="/calendar" className="dash-primary-link">Open planner</Link>
      </header>

      <div className="dash-stats">
        <div className="stat-card">
          <div className="stat-num">{stats.open}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.inProgress}</div>
          <div className="stat-label">In progress</div>
        </div>
        <div className="stat-card stat-done">
          <div className="stat-num">{stats.done}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card stat-overdue">
          <div className="stat-num">{stats.overdue.length}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div className="dash-grid">
        <section className="dash-section dash-main-panel">
          <div className="dash-section-head">
            <h2>This week</h2>
            <button className="dash-link" type="button" onClick={loadDashboard}>{loading ? 'Syncing' : 'Refresh'}</button>
          </div>
          {stats.upcoming.length === 0 ? (
            <p className="dash-empty">No upcoming tasks this week.</p>
          ) : (
            <ul className="dash-tasks">
              {stats.upcoming.slice(0, 10).map((t) => <TaskRow key={t.id} task={t} />)}
            </ul>
          )}
        </section>

        <aside className="dash-side-stack">
          <section className="dash-section dash-mini-panel">
            <div className="dash-section-head">
              <h2>Today</h2>
              <span className="dash-count">{stats.dueToday.length}</span>
            </div>
            {stats.dueToday.length ? (
              <ul className="dash-compact-list">
                {stats.dueToday.slice(0, 4).map((t) => <TaskRow key={t.id} task={t} compact />)}
              </ul>
            ) : <p className="dash-empty">Nothing due today.</p>}
          </section>

          <section className="dash-section dash-mini-panel">
            <div className="dash-section-head">
              <h2>Progress</h2>
              <span className="dash-count">{stats.completionRate}%</span>
            </div>
            <div className="dash-progress">
              <span style={{ width: `${stats.completionRate}%` }} />
            </div>
            <p className="dash-progress-copy">{stats.done} of {stats.total} tasks completed.</p>
          </section>

          <section className="dash-section dash-mini-panel">
            <div className="dash-section-head">
              <h2>High priority</h2>
              <span className="dash-count">{stats.highPriority.length}</span>
            </div>
            {stats.highPriority.length ? (
              <ul className="dash-compact-list">
                {stats.highPriority.slice(0, 4).map((t) => <TaskRow key={t.id} task={t} compact />)}
              </ul>
            ) : <p className="dash-empty">No urgent tasks.</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}

function TaskRow({ task, compact = false }) {
  const ref = task.deadline || task.start_time;
  return (
    <li className={`dash-task priority-${task.priority} ${compact ? 'compact' : ''}`}>
      <div className="dash-task-color" />
      <div className="dash-task-body">
        <span className="dash-task-title">{task.title}</span>
        <span className="dash-task-cat">{task.status.replace('_', ' ')}</span>
      </div>
      {ref && (
        <span className="dash-task-date">
          {new Date(ref).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      )}
      {!compact && <span className={`dash-task-priority ${task.priority}`}>{task.priority}</span>}
    </li>
  );
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}
