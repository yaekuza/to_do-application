// Tiny date helpers — Monday-first week, no external deps.

export const DAY = 24 * 60 * 60 * 1000;

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function startOfWeek(d) {
  const x = startOfDay(d);
  const dow = (x.getDay() + 6) % 7; // 0 = Monday
  x.setDate(x.getDate() - dow);
  return x;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMonths(d, n) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

export function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function fmtMonthYear(d) {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function fmtWeekRange(start) {
  const end = addDays(start, 4);
  const sameMonth = start.getMonth() === end.getMonth();
  const left = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const right = sameMonth
    ? end.toLocaleDateString(undefined, { day: 'numeric', year: 'numeric' })
    : end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${left} – ${right}`;
}

export function fmtTime(d) {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

// "2026-05-28T09:30" → ISO string in local timezone
export function localToISO(str) {
  if (!str) return null;
  return new Date(str).toISOString();
}

// ISO string → "2026-05-28T09:30" for <input type="datetime-local">
export function isoToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
