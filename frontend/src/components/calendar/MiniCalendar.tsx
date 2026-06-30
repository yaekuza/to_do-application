import { useMemo } from 'react';
import {
  addDays,
  fmtMonthYear,
  sameDay,
  startOfDay,
  startOfWeek,
} from '../../lib/date';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function MiniCalendar() {
  const today = startOfDay(new Date());
  const month = new Date(today.getFullYear(), today.getMonth(), 1);
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const gridStart = startOfWeek(first);
    const out = [];
    for (let i = 0; i < 42; i++) out.push(addDays(gridStart, i));
    return out;
  }, [month]);

  const weekStart = startOfWeek(today);

  return (
    <div className="mini-cal">
      <div className="mini-cal-head">
        <div className="mini-cal-title">{fmtMonthYear(month)}</div>
      </div>

      <div className="mini-cal-grid">
        {DOW.map((d, i) => (
          <div key={i} className="dow">{d}</div>
        ))}
        {cells.map((d, i) => {
          const isOtherMonth = d.getMonth() !== month.getMonth();
          const isToday = sameDay(d, today);
          const inWeek = d >= weekStart && d < addDays(weekStart, 7);
          const cls = [
            'mini-cal-day',
            isOtherMonth && 'muted',
            isToday && 'today',
            inWeek && 'in-week',
            isToday && 'selected',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <div key={i} className={cls} aria-current={isToday ? 'date' : undefined}>
              <span>{d.getDate()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
