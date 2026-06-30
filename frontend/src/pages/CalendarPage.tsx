import { useCallback, useEffect, useMemo, useState } from 'react';
import MiniCalendar from '../components/calendar/MiniCalendar';
import WeekView from '../components/calendar/WeekView';
import Modal from '../components/Modal';
import { api } from '../lib/api';
import {
  addDays,
  fmtWeekRange,
  isoToLocalInput,
  localToISO,
  startOfDay,
  startOfWeek,
} from '../lib/date';

const EMPTY_TASK = {
  title: '',
  description: '',
  priority: 'medium',
  status: 'open',
  deadline: '',
};

function compareUrgency(a, b) {
  if (a.status === 'done' && b.status !== 'done') return 1;
  if (a.status !== 'done' && b.status === 'done') return -1;
  return new Date(a.deadline || a.created_at).getTime() - new Date(b.deadline || b.created_at).getTime();
}

function urgencyLabel(task) {
  if (task.status === 'done') return 'done';
  if (!task.deadline) return 'open';
  const hours = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hours < 0) return 'overdue';
  if (hours <= 24) return 'urgent';
  if (hours <= 72) return 'soon';
  return 'planned';
}

export default function CalendarPage() {
  const [selected, setSelected] = useState(startOfDay(new Date()));
  const weekStart = useMemo(() => startOfWeek(selected), [selected]);

  const [tasks, setTasks] = useState([]);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_TASK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const from = weekStart.toISOString();
    const to = addDays(weekStart, 7).toISOString();
    const t = await api.tasks.list({ from, to });
    setTasks(t ?? []);
  }, [weekStart]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  function openNew(date) {
    const d = date ? new Date(date) : new Date(selected);
    if (date) d.setHours(17, 0, 0, 0);
    setForm({ ...EMPTY_TASK, deadline: isoToLocalInput(d.toISOString()) });
    setEditing('new');
  }

  function openEdit(task) {
    setForm({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      status: task.status ?? 'open',
      deadline: isoToLocalInput(task.deadline),
    });
    setEditing(task);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    const body = {
      ...form,
      deadline: localToISO(form.deadline),
    };
    try {
      if (editing === 'new') {
        await api.tasks.create(body);
      } else {
        await api.tasks.update(editing.id, body);
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.message || 'Could not save task');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (editing && editing !== 'new') {
      try {
        await api.tasks.remove(editing.id);
        setEditing(null);
        await load();
      } catch (err) {
        setError(err.message || 'Could not delete task');
      }
    }
  }

  const weekLoad = useMemo(() => [...tasks].sort(compareUrgency), [tasks]);

  return (
    <div className="calendar-page">
      <aside className="calendar-aside">
        <MiniCalendar />

        <div className="aside-section">
          <h4>Week load</h4>
          {weekLoad.length === 0 ? (
            <p className="aside-empty">No planned items in view.</p>
          ) : (
            <div className="week-load-list">
              {weekLoad.slice(0, 8).map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className={`week-load-item load-${urgencyLabel(task)}`}
                  onClick={() => openEdit(task)}
                >
                  <span>{task.title}</span>
                  <em>
                    {task.deadline
                      ? new Date(task.deadline).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
                      : 'no deadline'}
                  </em>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <section className="calendar-main">
        <header className="calendar-toolbar">
          <h1>{fmtWeekRange(weekStart)}</h1>
          <div className="toolbar-actions">
            <button
              className="btn-ghost"
              onClick={() => setSelected(addDays(selected, -7))}
            >
              ‹ prev
            </button>
            <button
              className="btn-ghost"
              onClick={() => setSelected(startOfDay(new Date()))}
            >
              today
            </button>
            <button
              className="btn-ghost"
              onClick={() => setSelected(addDays(selected, 7))}
            >
              next ›
            </button>
            <button className="btn-accent" onClick={() => openNew(null)}>
              + new task
            </button>
          </div>
        </header>

        <WeekView
          weekStart={weekStart}
          tasks={tasks}
          onSelectTask={openEdit}
          onCreateAt={openNew}
        />
      </section>

      {editing && (
        <Modal open={true} title={editing === 'new' ? 'New task' : 'Edit task'} onClose={() => setEditing(null)}>
          <div className="modal-body">
            {error && <div className="form-error">{error}</div>}
            <label className="field">
              <span>Title</span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>

            <div className="form-grid">
              <label className="field">
                <span>Priority</span>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </label>
              <label className="field">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="open">open</option>
                  <option value="in_progress">in progress</option>
                  <option value="done">done</option>
                </select>
              </label>
            </div>

            <label className="field">
              <span>Deadline</span>
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </label>
          </div>

          <div className="modal-foot">
            {editing !== 'new' && (
              <button className="btn-danger" onClick={handleDelete}>
                delete
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button className="btn-ghost" onClick={() => setEditing(null)}>
              cancel
            </button>
            <button className="btn-accent" onClick={handleSave} disabled={saving || !form.title.trim() || !form.deadline}>
              {saving ? 'saving...' : 'save'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
