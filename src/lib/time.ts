export type YMD = { y: number; m: number; d: number };
export type Period = "today" | "yesterday" | "week" | "month" | "lastmonth";

const cache = new Map<string, Intl.DateTimeFormat>();
function dtf(tz: string) {
  let f = cache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit",
      day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    cache.set(tz, f);
  }
  return f;
}

export function tzOffsetMinutes(date: Date, tz: string): number {
  const parts = dtf(tz).formatToParts(date);
  const g = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUTC = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"), g("second"));
  return Math.round((asUTC - date.getTime()) / 60000);
}

export function ymdOf(date: Date, tz: string): YMD {
  const parts = dtf(tz).formatToParts(date);
  const g = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return { y: g("year"), m: g("month"), d: g("day") };
}

export function addDays(a: YMD, n: number): YMD {
  const dt = new Date(Date.UTC(a.y, a.m - 1, a.d + n));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

export function dow(a: YMD): number {
  return new Date(Date.UTC(a.y, a.m - 1, a.d)).getUTCDay();
}

export function sameDay(a: YMD, b: YMD) {
  return a.y === b.y && a.m === b.m && a.d === b.d;
}

/** UTC instant of local midnight for the given calendar day in tz. */
export function startOf(a: YMD, tz: string): Date {
  const guess = Date.UTC(a.y, a.m - 1, a.d);
  let t = guess - tzOffsetMinutes(new Date(guess), tz) * 60000;
  t = guess - tzOffsetMinutes(new Date(t), tz) * 60000;
  return new Date(t);
}

export function isValidYMD(a: YMD): boolean {
  const dt = new Date(Date.UTC(a.y, a.m - 1, a.d));
  return dt.getUTCFullYear() === a.y && dt.getUTCMonth() === a.m - 1 && dt.getUTCDate() === a.d;
}

export function dayKey(a: YMD) {
  return `${a.y}-${String(a.m).padStart(2, "0")}-${String(a.d).padStart(2, "0")}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function dateLabel(a: YMD) {
  return `${a.d} ${MONTHS[a.m - 1]}`;
}

export function periodRange(p: Period, now: Date, tz: string) {
  const today = ymdOf(now, tz);
  const tomorrow = addDays(today, 1);
  let first: YMD, endExclusive: YMD;
  switch (p) {
    case "today": first = today; endExclusive = tomorrow; break;
    case "yesterday": first = addDays(today, -1); endExclusive = today; break;
    case "week": first = addDays(today, -6); endExclusive = tomorrow; break;
    case "month": first = { y: today.y, m: today.m, d: 1 }; endExclusive = tomorrow; break;
    case "lastmonth": {
      const pm = today.m === 1 ? { y: today.y - 1, m: 12 } : { y: today.y, m: today.m - 1 };
      first = { ...pm, d: 1 };
      endExclusive = { y: today.y, m: today.m, d: 1 };
      break;
    }
  }
  const days: YMD[] = [];
  for (let c = first, i = 0; !sameDay(c, endExclusive) && i < 40; c = addDays(c, 1), i++) days.push(c);
  return { from: startOf(first, tz), to: startOf(endExclusive, tz), days, first, last: addDays(endExclusive, -1) };
}

/** When should an entry be stamped? Now for today, local noon for a backdated day. */
export function occurredAt(date: YMD | null | undefined, now: Date, tz: string): Date {
  if (!date) return now;
  if (sameDay(date, ymdOf(now, tz))) return now;
  return new Date(startOf(date, tz).getTime() + 12 * 3600 * 1000);
}
