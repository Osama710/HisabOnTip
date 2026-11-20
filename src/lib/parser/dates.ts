import { YMD, addDays, dow, isValidYMD, ymdOf } from "../time";

const TODAY = new Set(["today", "aaj", "aj", "آج"]);
const YESTERDAY = new Set(["yesterday", "kal", "kl", "کل"]);
const PARSO = new Set(["parso", "parson", "parsoon", "پرسوں"]);
const DAYW = new Set(["days", "day", "din", "dino", "دن"]);
const AGO = new Set(["ago", "pehle", "qabl", "پہلے"]);
const LAST = new Set(["last", "pichle", "pichla", "pichhle", "پچھلے", "پچھلا"]);

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6,
  jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12,
};
const WEEKDAYS: Record<string, number> = {
  sunday: 0, sun: 0, itwar: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2, mangal: 2,
  wednesday: 3, wed: 3, budh: 3, thursday: 4, thu: 4, thur: 4, thurs: 4, jumerat: 4, jumeraat: 4,
  friday: 5, fri: 5, juma: 5, jumma: 5, saturday: 6, sat: 6, hafta_: 6,
};

export type DateResult = { rest: string[]; date: YMD | null; leading: boolean };

function resolve(day: number, month: number, year: number | null, today: YMD): YMD | null {
  let y = year ?? today.y;
  if (y < 100) y += 2000;
  const cand = { y, m: month, d: day };
  if (!isValidYMD(cand)) return null;
  if (year === null) {
    const cmp = (a: YMD, b: YMD) => a.y * 10000 + a.m * 100 + a.d - (b.y * 10000 + b.m * 100 + b.d);
    if (cmp(cand, today) > 0) cand.y -= 1;
  }
  return cand;
}

export function extractDate(tokens: string[], now: Date, tz: string): DateResult {
  const today = ymdOf(now, tz);
  const out: string[] = [];
  let date: YMD | null = null;
  let leading = false;
  const set = (d: YMD | null, idx: number) => {
    if (d && !date) {
      date = d;
      leading = idx === 0;
    }
    return !!d;
  };
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const n1 = tokens[i + 1];
    const n2 = tokens[i + 2];
    if (!date) {
      if (t === "day" && n1 === "before" && n2 === "yesterday") { set(addDays(today, -2), i); i += 2; continue; }
      if (TODAY.has(t)) { set(today, i); continue; }
      if (YESTERDAY.has(t)) { set(addDays(today, -1), i); continue; }
      if (PARSO.has(t)) { set(addDays(today, -2), i); continue; }
      if (/^\d{1,2}$/.test(t) && n1 && DAYW.has(n1) && n2 && AGO.has(n2)) {
        set(addDays(today, -Number(t)), i); i += 2; continue;
      }
      let m = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/.exec(t) ?? /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/.exec(t);
      if (m) {
        const d = resolve(Number(m[1]), Number(m[2]), m[3] ? Number(m[3]) : null, today);
        if (set(d, i)) continue;
      }
      if (/^\d{1,2}$/.test(t) && n1 && MONTHS[n1] && Number(t) >= 1 && Number(t) <= 31) {
        const yr = n2 && /^20\d{2}$/.test(n2) ? Number(n2) : null;
        const d = resolve(Number(t), MONTHS[n1], yr, today);
        if (set(d, i)) { i += yr ? 2 : 1; continue; }
      }
      if (MONTHS[t] && n1 && /^\d{1,2}$/.test(n1) && Number(n1) >= 1 && Number(n1) <= 31) {
        const yr = n2 && /^20\d{2}$/.test(n2) ? Number(n2) : null;
        const d = resolve(Number(n1), MONTHS[t], yr, today);
        if (set(d, i)) { i += yr ? 2 : 1; continue; }
      }
      if (WEEKDAYS[t] !== undefined && t !== "sat" && t !== "mar") {
        const hadLast = out.length > 0 && LAST.has(out[out.length - 1]);
        if (hadLast) out.pop();
        let diff = (dow(today) - WEEKDAYS[t] + 7) % 7;
        if (diff === 0 && hadLast) diff = 7;
        set(addDays(today, -diff), hadLast ? Math.max(0, out.length - 1) : i);
        continue;
      }
    }
    out.push(t);
  }
  return { rest: out, date, leading };
}
