import crypto from "crypto";

const secret = () => process.env.EXPORT_SECRET || process.env.CRON_SECRET || "";

export function signExport(userId: string, period: string, exp: number): string {
  return crypto.createHmac("sha256", secret()).update(`${userId}.${period}.${exp}`).digest("hex");
}

export function exportUrl(userId: string, period: "month" | "lastmonth"): string {
  const exp = Date.now() + 24 * 3600 * 1000;
  const base = (process.env.APP_URL || "").replace(/\/$/, "");
  return `${base}/api/export?u=${userId}&p=${period}&e=${exp}&s=${signExport(userId, period, exp)}`;
}

export function verifyExport(userId: string, period: string, exp: number, sig: string): boolean {
  if (!secret() || !Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = signExport(userId, period, exp);
  const a = Buffer.from(expected), b = Buffer.from(sig);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
