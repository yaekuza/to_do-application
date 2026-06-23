import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    Promise.all([
      api.tasks.list({}),
      api.profile.get(),
    ]).then(([t, p]) => {
      setTasks(t ?? []);
      setProfile(p);
    }).catch(console.error);
  }, []);

  const now = new Date();

  const stats = useMemo(() => {
    const open = tasks.filter((t) => t.status === 'open');
    const inProgress = tasks.filter((t) => t.status === 'in_progress');
    const done = tasks.filter((t) => t.status === 'done');
    const overdue = open.filter((t) => {
      const d = t.deadline ? new Date(t.deadline) : null;
      return d && d < now;
    });
    const upcoming = open
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
    return { open: open.length, inProgress: inProgress.length, done: done.length, overdue: overdue.length, upcoming };
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
        <h1 className="dash-greeting">{greeting}, {displayName}</h1>
        <p className="dash-date">{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
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
        {stats.overdue > 0 && (
          <div className="stat-card stat-overdue">
            <div className="stat-num">{stats.overdue}</div>
            <div className="stat-label">Overdue</div>
          </div>
        )}
      </div>

      <section className="dash-section">
        <div className="dash-section-head">
          <h2>This week</h2>
          <Link to="/calendar" className="dash-link">View calendar</Link>
        </div>
        {stats.upcoming.length === 0 ? (
          <p className="dash-empty">No upcoming tasks this week. Enjoy the calm.</p>
        ) : (
          <ul className="dash-tasks">
            {stats.upcoming.slice(0, 8).map((t) => {
              const ref = t.deadline || t.start_time;
              return (
                <li key={t.id} className={`dash-task priority-${t.priority}`}>
                  <div className="dash-task-color" />
                  <div className="dash-task-body">
                    <span className="dash-task-title">{t.title}</span>
                    <span className="dash-task-cat">{t.status.replace('_', ' ')}</span>
                  </div>
                  <span className="dash-task-date">
                    {ref && new Date(ref).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className={`dash-task-priority ${t.priority}`}>{t.priority}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
