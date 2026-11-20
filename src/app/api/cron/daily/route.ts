import { pingDb, usersForCron } from "@/lib/db";
import { L } from "@/lib/i18n";
import { buildSummary } from "@/lib/reports";
import { dow, periodRange, ymdOf } from "@/lib/time";
import { sendImage, sendText } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Runs once a day (vercel.json: 17:00 UTC = 22:00 Karachi).
// Daily summary every day, weekly report on Sundays, monthly report on the 1st.
// Free-form WhatsApp messages only work within 24h of the user's last message, so we only
// message users who wrote in the last 23 hours.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  await pingDb(); // also keeps the free Supabase project from pausing

  const now = new Date();
  const users = await usersForCron(new Date(now.getTime() - 23 * 3600 * 1000));
  let sent = 0;

  for (const user of users) {
    try {
      const lang = user.lang ?? "en";
      const T = L[lang];
      const today = ymdOf(now, user.timezone);
      const daily = await buildSummary(user, lang, "today", now);

      if (!daily.agg.expense && !daily.agg.income && !daily.agg.saving) {
        await sendText(user.phone, T.nudge);
      } else {
        await sendText(user.phone, daily.text);
        for (const u of daily.charts) await sendImage(user.phone, u);
      }
      if (dow(today) === 0) {
        const w = await buildSummary(user, lang, "week", now);
        await sendText(user.phone, w.text);
        for (const u of w.charts) await sendImage(user.phone, u);
      }
      if (today.d === 1) {
        const m = await buildSummary(user, lang, "lastmonth", now);
        await sendText(user.phone, m.text);
        for (const u of m.charts) await sendImage(user.phone, u);
      }
      sent++;
    } catch (e) {
      console.error("cron user failed", e instanceof Error ? e.message : "unknown");
    }
  }
  return Response.json({ users: users.length, sent });
}
