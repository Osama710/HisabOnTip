import { Budget, Tx, User, fetchTx, listBudgets } from "./db";
import { L, money } from "./i18n";
import type { Lang } from "./parser";
import { Period, YMD, dateLabel, dayKey, ymdOf, periodRange } from "./time";

export type Agg = {
  income: number; expense: number; saving: number;
  byCategory: Array<{ category: string; amount: number }>;
  byDay: Record<string, number>;
  byAccount: Array<{ account: string; amount: number }>;
};

export function aggregate(rows: Tx[], tz: string): Agg {
  const a: Agg = { income: 0, expense: 0, saving: 0, byCategory: [], byDay: {}, byAccount: [] };
  const cats: Record<string, number> = {};
  const accs: Record<string, number> = {};
  for (const r of rows) {
    if (r.type === "income") a.income += r.amount;
    else if (r.type === "saving") a.saving += r.amount;
    else {
      a.expense += r.amount;
      const c = r.category || "Other";
      cats[c] = (cats[c] ?? 0) + r.amount;
      if (r.account) accs[r.account] = (accs[r.account] ?? 0) + r.amount;
      const k = dayKey(ymdOf(new Date(r.occurred_at), tz));
      a.byDay[k] = (a.byDay[k] ?? 0) + r.amount;
    }
  }
  a.byAccount = Object.entries(accs).map(([account, amount]) => ({ account, amount })).sort((x, y) => y.amount - x.amount);
  a.byCategory = Object.entries(cats).map(([category, amount]) => ({ category, amount })).sort((x, y) => y.amount - x.amount);
  return a;
}

export function budgetLines(lang: Lang, budgets: Budget[], agg: Agg): string[] {
  const T = L[lang];
  return budgets.map((b) => {
    const spent = agg.byCategory.find((c) => c.category === b.category)?.amount ?? 0;
    const p = Math.round((spent / b.monthly_limit) * 100);
    const icon = p >= 100 ? "🚨" : p >= 80 ? "⚠️" : "✅";
    return `${icon} ${b.category}: ${money(spent)} / ${money(b.monthly_limit)} (${p}%)`;
  });
}

const PALETTE = ["#2ecc71", "#3498db", "#e67e22", "#9b59b6", "#e74c3c", "#1abc9c", "#f1c40f", "#34495e", "#fd79a8", "#95a5a6"];

async function chartUrl(config: object): Promise<string | null> {
  try {
    const r = await fetch("https://quickchart.io/chart/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chart: config, width: 700, height: 450, backgroundColor: "white", format: "png", version: "4" }),
    });
    if (!r.ok) return null;
    const j: any = await r.json();
    return j?.success ? (j.url as string) : null;
  } catch {
    return null;
  }
}

export async function categoryChart(title: string, agg: Agg): Promise<string | null> {
  if (!agg.byCategory.length) return null;
  const top = agg.byCategory.slice(0, 9);
  const rest = agg.byCategory.slice(9).reduce((s, c) => s + c.amount, 0);
  if (rest > 0) top.push({ category: "Other", amount: rest });
  return chartUrl({
    type: "doughnut",
    data: {
      labels: top.map((c) => `${c.category}: ${Math.round(c.amount).toLocaleString("en-US")}`),
      datasets: [{ data: top.map((c) => c.amount), backgroundColor: PALETTE }],
    },
    options: {
      plugins: {
        title: { display: true, text: title, font: { size: 22 } },
        legend: { position: "right", labels: { font: { size: 16 } } },
      },
    },
  });
}

export async function dailyChart(title: string, days: YMD[], agg: Agg): Promise<string | null> {
  if (!agg.expense) return null;
  return chartUrl({
    type: "bar",
    data: {
      labels: days.map((d) => (days.length > 8 ? String(d.d) : dateLabel(d))),
      datasets: [{ label: "Expenses", data: days.map((d) => agg.byDay[dayKey(d)] ?? 0), backgroundColor: "#e74c3c" }],
    },
    options: {
      plugins: { title: { display: true, text: title, font: { size: 22 } }, legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

export type Summary = { text: string; charts: string[]; agg: Agg };

export async function buildSummary(user: User, lang: Lang, period: Period, now: Date, withCharts = true): Promise<Summary> {
  const T = L[lang];
  const tz = user.timezone;
  const r = periodRange(period, now, tz);
  const rows = await fetchTx(user.id, r.from, r.to);
  const agg = aggregate(rows, tz);
  const label = T.periods[period];
  const range = r.days.length > 1 ? ` (${dateLabel(r.first)} – ${dateLabel(r.last)})` : ` (${dateLabel(r.first)})`;

  if (!rows.length) return { text: `📊 ${label}${range}\n\n${T.noData}`, charts: [], agg };

  const lines = [`📊 *${label}*${range}`, ""];
  lines.push(`💰 ${T.income}: ${money(agg.income)}`);
  lines.push(`💸 ${T.expenses}: ${money(agg.expense)}`);
  if (agg.saving) lines.push(`🏦 ${T.saved}: ${money(agg.saving)}`);
  lines.push(`🧮 ${T.left}: ${money(agg.income - agg.expense - agg.saving)}`);
  if (agg.byCategory.length) {
    lines.push("", `*${T.topCats}*`);
    for (const c of agg.byCategory.slice(0, 6)) {
      const p = agg.expense ? Math.round((c.amount / agg.expense) * 100) : 0;
      lines.push(`• ${c.category}: ${money(c.amount)} (${p}%)`);
    }
  }
  if (agg.byAccount.length) {
    lines.push("", `*${T.byAccount}*`);
    for (const a of agg.byAccount) lines.push(`• ${a.account}: ${money(a.amount)}`);
  }
  if (period === "month") {
    const budgets = await listBudgets(user.id);
    if (budgets.length) lines.push("", `*${T.budgetHeader}*`, ...budgetLines(lang, budgets, agg));
  }

  const charts: string[] = [];
  if (withCharts && agg.expense > 0) {
    const title = `${label} ${range.trim()}`;
    const jobs = [categoryChart(title, agg)];
    if (period !== "today" && period !== "yesterday") jobs.push(dailyChart(`${T.expenses}: ${title}`, r.days, agg));
    for (const u of await Promise.all(jobs)) if (u) charts.push(u);
  }
  return { text: lines.join("\n"), charts, agg };
}
