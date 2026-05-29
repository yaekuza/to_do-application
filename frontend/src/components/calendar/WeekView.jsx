import { useMemo } from 'react';
import { addDays, sameDay, startOfDay } from '../../lib/date.js';

const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am–8pm
const SLOT_H = 56;
const START_HOUR = HOURS[0];

function bucketByDay(tasks, weekStart) {
  const buckets = Array.from({ length: 5 }, () => []);
  for (const t of tasks) {
    const ref = t.start_time ?? t.deadline;
    if (!ref) continue;
    const d = new Date(ref);
    for (let i = 0; i < 5; i++) {
      if (sameDay(d, addDays(weekStart, i))) {
        buckets[i].push(t);
        break;
      }
    }
  }
  return buckets;
}

function positionFor(task) {
  const start = task.start_time ? new Date(task.start_time) : new Date(task.deadline);
  const end = task.end_time
    ? new Date(task.end_time)
    : new Date(start.getTime() + 60 * 60 * 1000);
  const startHours = start.getHours() + start.getMinutes() / 60;
  const endHours = end.getHours() + end.getMinutes() / 60;
  const top = (startHours - START_HOUR) * SLOT_H;
  const height = Math.max(24, (endHours - startHours) * SLOT_H);
  return { top, height };
}

export default function WeekView({ weekStart, tasks, categoryMap, onSelectTask, onCreateAt }) {
  const buckets = useMemo(() => bucketByDay(tasks, weekStart), [tasks, weekStart]);
  const today = startOfDay(new Date());

  return (
    <div className="week">
      <div className="week-head">
        <div />
        {DAY_NAMES.map((name, i) => {
          const d = addDays(weekStart, i);
          const isToday = sameDay(d, today);
          return (
            <div key={i} className={`day ${isToday ? 'today' : ''}`}>
              <div className="num">{d.getDate()}</div>
              <div className="name">{name}</div>
            </div>
          );
        })}
      </div>

      <div className="week-grid">
        <div className="gutter">
          {HOURS.map((h) => (
            <div key={h} className="h-slot">
              {h === 12 ? '12 pm' : h > 12 ? `${h - 12} pm` : `${h} am`}
            </div>
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

            {buckets[dayIdx].map((t) => {
              const { top, height } = positionFor(t);
              const color = (t.category_id && categoryMap[t.category_id]?.color) || null;
              const style = color
                ? {
                    top,
                    height,
                    background: hexToSoft(color),
                    borderColor: hexToLine(color),
                    borderLeftColor: color,
                  }
                : { top, height };
              return (
                <div
                  key={t.id}
                  className={`event priority-${t.priority} ${t.status === 'done' ? 'done' : ''}`}
                  style={style}
                  onClick={() => onSelectTask?.(t)}
                  title={t.title}
                >
                  <div className="title">{t.title}</div>
                  {t.category_id && categoryMap[t.category_id] && (
                    <div className="meta">{categoryMap[t.category_id].name}</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function hexToSoft(hex) {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, 0.14)`;
}
function hexToLine(hex) {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, 0.38)`;
}
function parseHex(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
