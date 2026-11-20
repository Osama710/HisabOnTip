import { db, fetchTx } from "@/lib/db";
import { verifyExport } from "@/lib/export-link";
import { periodRange, dayKey, ymdOf } from "@/lib/time";

export const dynamic = "force-dynamic";

const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;

// Signed, expiring link that WhatsApp fetches when we send a CSV document.
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const u = p.get("u") ?? "", period = p.get("p") ?? "month", exp = Number(p.get("e")), sig = p.get("s") ?? "";
  if (!verifyExport(u, period, exp, sig) || (period !== "month" && period !== "lastmonth")) {
    return new Response("Link expired or invalid", { status: 403 });
  }
  const { data: user } = await db().from("users").select("id,timezone").eq("id", u).maybeSingle();
  if (!user) return new Response("Not found", { status: 404 });

  const r = periodRange(period, new Date(), user.timezone);
  const rows = await fetchTx(user.id, r.from, r.to);
  const lines = ["Date,Type,Category,Note,Account,Amount"];
  for (const t of rows) {
    lines.push([dayKey(ymdOf(new Date(t.occurred_at), user.timezone)), t.type, esc(t.category ?? ""), esc(t.note ?? ""), esc(t.account ?? ""), t.amount].join(","));
  }
  return new Response("\uFEFF" + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="expenses-${period}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
