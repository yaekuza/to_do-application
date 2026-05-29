import { useMemo } from 'react';
import {
  addDays,
  addMonths,
  fmtMonthYear,
  sameDay,
  startOfDay,
  startOfWeek,
} from '../../lib/date.js';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function MiniCalendar({ month, onMonthChange, selected, onSelect }) {
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const gridStart = startOfWeek(first);
    const out = [];
    for (let i = 0; i < 42; i++) out.push(addDays(gridStart, i));
    return out;
  }, [month]);

  const weekStart = startOfWeek(selected);
  const today = startOfDay(new Date());

  return (
    <div className="mini-cal">
      <div className="mini-cal-head">
        <div className="mini-cal-title">{fmtMonthYear(month)}</div>
        <div className="mini-cal-nav">
          <button onClick={() => onMonthChange(addMonths(month, -1))} aria-label="previous month">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button onClick={() => onMonthChange(addMonths(month, 1))} aria-label="next month">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mini-cal-grid">
        {DOW.map((d, i) => (
          <div key={i} className="dow">{d}</div>
        ))}
        {cells.map((d, i) => {
          const isOtherMonth = d.getMonth() !== month.getMonth();
          const isToday = sameDay(d, today);
          const isSelected = sameDay(d, selected);
          const inWeek = d >= weekStart && d < addDays(weekStart, 5);
          const cls = [
            'mini-cal-day',
            isOtherMonth && 'muted',
            isToday && 'today',
            inWeek && 'in-week',
            isSelected && 'selected',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button key={i} className={cls} onClick={() => onSelect(d)}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
