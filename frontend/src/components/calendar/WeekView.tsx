import { useMemo } from 'react';
import { addDays, fmtTime, sameDay, startOfDay } from '../../lib/date';

const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SLOT_H = 52;

function bucketByDay(tasks, weekStart) {
  // Split one task list into seven day columns for the week view.
  const buckets = Array.from({ length: DAY_NAMES.length }, () => []);
  for (const task of tasks) {
    const ref = task.deadline || task.start_time;
    if (!ref) continue;
    const d = new Date(ref);
    for (let i = 0; i < DAY_NAMES.length; i += 1) {
      if (sameDay(d, addDays(weekStart, i))) {
        buckets[i].push(task);
        break;
      }
    }
  }
  return buckets.map((items) => [...items].sort(compareUrgency));
}

function compareUrgency(a, b) {
  // Unfinished tasks stay above completed ones, then sort by closest deadline.
  if (a.status === 'done' && b.status !== 'done') return 1;
  if (a.status !== 'done' && b.status === 'done') return -1;
  return new Date(a.deadline || a.created_at).getTime() - new Date(b.deadline || b.created_at).getTime();
}

function positionFor(task) {
  // Convert a deadline time into a vertical position inside the 24-hour grid.
  const d = new Date(task.deadline || task.start_time || task.created_at);
  const top = (d.getHours() + d.getMinutes() / 60) * SLOT_H;
  return { top, height: Math.max(34, SLOT_H * 0.86) };
}

function urgency(task) {
  // CSS classes use this to color overdue/urgent/soon tasks differently.
  if (task.status === 'done') return 'done';
  if (!task.deadline) return 'open';
  const hours = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hours < 0) return 'overdue';
  if (hours <= 24) return 'urgent';
  if (hours <= 72) return 'soon';
  return 'open';
}

function hourLabel(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export default function WeekView({ weekStart, tasks, onSelectTask, onCreateAt }) {
  const buckets = useMemo(() => bucketByDay(tasks, weekStart), [tasks, weekStart]);
  const today = startOfDay(new Date());

  return (
    <div className="week">
      <div className="week-scroll">
        <div className="week-head">
          <div />
          {DAY_NAMES.map((name, i) => {
            const d = addDays(weekStart, i);
            const isToday = sameDay(d, today);
            return (
              <div key={name} className={`day ${isToday ? 'today' : ''}`}>
                <div className="num">{d.getDate()}</div>
                <div className="name">{name}</div>
              </div>
            );
          })}
        </div>

        <div className="week-grid">
          <div className="gutter">
            {HOURS.map((h) => (
              <div key={h} className="h-slot">{hourLabel(h)}</div>
            ))}
          </div>

          {DAY_NAMES.map((_, dayIdx) => (
            <div key={dayIdx} className="day-col">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="h-slot"
                  onDoubleClick={() => {
                    const d = addDays(weekStart, dayIdx);
                    d.setHours(h, 0, 0, 0);
                    onCreateAt?.(d);
                  }}
                />
              ))}

              {buckets[dayIdx].map((task) => {
                const { top, height } = positionFor(task);
                return (
                  <div
                    key={task.id}
                    className={`event priority-${task.priority} urgency-${urgency(task)} ${task.status === 'done' ? 'done' : ''}`}
                    style={{ top, height }}
                    onClick={() => onSelectTask?.(task)}
                    title={task.title}
                  >
                    <div className="title">{task.title}</div>
                    <div className="meta">
                      {task.deadline ? fmtTime(new Date(task.deadline)) : 'no time'}
                      {' · '}
                      {task.status.replace('_', ' ')}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
