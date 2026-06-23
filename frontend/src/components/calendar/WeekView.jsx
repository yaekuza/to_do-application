import { useMemo } from 'react';
import { addDays, fmtTime, sameDay, startOfDay } from '../../lib/date.js';

const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function bucketByDay(tasks, weekStart) {
  const buckets = Array.from({ length: DAY_NAMES.length }, () => []);
  for (const task of tasks) {
    const ref = task.deadline || task.start_time;
    if (!ref) continue;
    const deadline = new Date(ref);
    for (let i = 0; i < DAY_NAMES.length; i += 1) {
      if (sameDay(deadline, addDays(weekStart, i))) {
        buckets[i].push(task);
        break;
      }
    }
  }

  return buckets.map((items) => [...items].sort(compareUrgency));
}

function compareUrgency(a, b) {
  if (a.status === 'done' && b.status !== 'done') return 1;
  if (a.status !== 'done' && b.status === 'done') return -1;
  return new Date(a.deadline || a.created_at) - new Date(b.deadline || b.created_at);
}

function urgency(task) {
  if (task.status === 'done') return 'done';
  if (!task.deadline) return 'open';
  const hours = (new Date(task.deadline) - new Date()) / (1000 * 60 * 60);
  if (hours < 0) return 'overdue';
  if (hours <= 24) return 'urgent';
  if (hours <= 72) return 'soon';
  return 'open';
}

export default function WeekView({ weekStart, tasks, onSelectTask, onCreateAt }) {
  const buckets = useMemo(() => bucketByDay(tasks, weekStart), [tasks, weekStart]);
  const today = startOfDay(new Date());

  return (
    <div className="week-board">
      {DAY_NAMES.map((name, i) => {
        const d = addDays(weekStart, i);
        const isToday = sameDay(d, today);
        return (
          <section
            key={name}
            className={`week-day ${isToday ? 'today' : ''}`}
            onDoubleClick={() => onCreateAt?.(d)}
          >
            <header className="week-day-head">
              <div>
                <strong>{d.getDate()}</strong>
                <span>{name}</span>
              </div>
              <em>{buckets[i].length}</em>
            </header>

            <div className="week-day-list">
              {buckets[i].map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className={`deadline-card priority-${task.priority} urgency-${urgency(task)}`}
                  onClick={() => onSelectTask?.(task)}
                >
                  <span className="deadline-title">{task.title}</span>
                  <span className="deadline-meta">
                    {task.deadline ? fmtTime(new Date(task.deadline)) : 'no time'}
                    {' · '}
                    {task.status.replace('_', ' ')}
                  </span>
                </button>
              ))}
              {buckets[i].length === 0 && (
                <button type="button" className="deadline-empty" onClick={() => onCreateAt?.(d)}>
                  Add task
                </button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
