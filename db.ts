import { q } from "./pg";
import type { Lang } from "./parser";

export type User = {
  id: string; phone: string; name: string | null; lang: Lang | null; timezone: string;
  daily_report: boolean; last_inbound_at: string | null; pending_action: string | null; pending_at: string | null;
};
export type TxType = "expense" | "income" | "saving";
export type Tx = {
  id: string; user_id: string; type: TxType; amount: number; category: string | null; note: string | null;
  occurred_at: string; created_at: string; goal_id: string | null; account: string | null;
};
export type Goal = { id: string; name: string; target: number };
export type Budget = { category: string; monthly_limit: number };

const iso = (v: unknown): string | null => (v == null ? null : new Date(v as string | Date).toISOString());

const toUser = (r: any): User => ({
  id: r.id, phone: r.phone, name: r.name ?? null, lang: r.lang ?? null, timezone: r.timezone,
  daily_report: !!r.daily_report, last_inbound_at: iso(r.last_inbound_at),
  pending_action: r.pending_action ?? null, pending_at: iso(r.pending_at),
});
const toTx = (r: any): Tx => ({
  id: r.id, user_id: r.user_id, type: r.type, amount: Number(r.amount), category: r.category ?? null,
  note: r.note ?? null, occurred_at: iso(r.occurred_at)!, created_at: iso(r.created_at)!,
  goal_id: r.goal_id ?? null, account: r.account ?? null,
});

/** Returns false if this WhatsApp message id was already handled (Meta retries). */
export async function claimMessage(id: string): Promise<boolean> {
  const rows = await q(
    "insert into processed_messages (wa_message_id) values ($1) on conflict do nothing returning wa_message_id",
    [id]
  );
  return rows.length > 0;
}

export async function getOrCreateUser(phone: string, name?: string): Promise<{ user: User; isNew: boolean }> {
  const created = await q(
    "insert into users (phone, name) values ($1, $2) on conflict (phone) do nothing returning *",
    [phone, name ?? null]
  );
  if (created.length) return { user: toUser(created[0]), isNew: true };
  const found = await q("select * from users where phone = $1", [phone]);
  return { user: toUser(found[0]), isNew: false };
}

const USER_COLS = new Set(["name", "lang", "timezone", "daily_report", "last_inbound_at", "pending_action", "pending_at"]);
export async function updateUser(id: string, patch: Partial<Omit<User, "id" | "phone">>) {
  const keys = Object.keys(patch).filter((k) => USER_COLS.has(k));
  if (!keys.length) return;
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  await q(`update users set ${sets} where id = $1`, [id, ...keys.map((k) => (patch as any)[k])]);
}

export async function deleteUser(id: string) {
  await q("delete from users where id = $1", [id]);
}

export async function getUserBasic(id: string): Promise<{ id: string; timezone: string } | null> {
  const rows = await q("select id, timezone from users where id = $1", [id]);
  return rows[0] ?? null;
}

export async function insertTx(rows: Array<Omit<Tx, "id" | "created_at">>): Promise<Tx[]> {
  if (!rows.length) return [];
  const params: unknown[] = [];
  const values = rows.map((r) => {
    const b = params.length;
    params.push(r.user_id, r.type, r.amount, r.category, r.note, r.goal_id, r.account, r.occurred_at);
    return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8}::timestamptz)`;
  });
  const out = await q(
    `insert into transactions (user_id, type, amount, category, note, goal_id, account, occurred_at) values ${values.join(",")} returning *`,
    params
  );
  return out.map(toTx);
}

export async function fetchTx(userId: string, from: Date, to: Date): Promise<Tx[]> {
  const rows = await q(
    `select * from transactions
     where user_id = $1 and deleted_at is null and occurred_at >= $2::timestamptz and occurred_at < $3::timestamptz
     order by occurred_at asc limit 20000`,
    [userId, from.toISOString(), to.toISOString()]
  );
  return rows.map(toTx);
}

export async function lastTx(userId: string, n = 1): Promise<Tx[]> {
  const rows = await q(
    "select * from transactions where user_id = $1 and deleted_at is null order by seq desc limit $2",
    [userId, n]
  );
  return rows.map(toTx);
}

export async function softDelete(id: string) {
  await q("update transactions set deleted_at = now() where id = $1", [id]);
}
export async function updateTxAmount(id: string, amount: number) {
  await q("update transactions set amount = $2 where id = $1", [id, amount]);
}

export async function listGoals(userId: string): Promise<Goal[]> {
  const rows = await q("select id, name, target from savings_goals where user_id = $1 order by created_at", [userId]);
  return rows.map((r: any) => ({ id: r.id, name: r.name, target: Number(r.target) }));
}
export async function upsertGoal(userId: string, name: string, target: number) {
  await q(
    "insert into savings_goals (user_id, name, target) values ($1, $2, $3) on conflict (user_id, name) do update set target = excluded.target",
    [userId, name, target]
  );
}
export async function deleteGoal(userId: string, name: string): Promise<boolean> {
  const rows = await q("delete from savings_goals where user_id = $1 and name = $2 returning id", [userId, name]);
  return rows.length > 0;
}
export async function goalSavedMap(userId: string): Promise<Record<string, number>> {
  const rows = await q(
    `select goal_id, sum(amount) as total from transactions
     where user_id = $1 and deleted_at is null and goal_id is not null group by goal_id`,
    [userId]
  );
  const out: Record<string, number> = {};
  for (const r of rows) out[r.goal_id] = Number(r.total);
  return out;
}

export async function listBudgets(userId: string): Promise<Budget[]> {
  const rows = await q("select category, monthly_limit from budgets where user_id = $1", [userId]);
  return rows.map((r: any) => ({ category: r.category, monthly_limit: Number(r.monthly_limit) }));
}
export async function setBudget(userId: string, category: string, limit: number) {
  await q(
    "insert into budgets (user_id, category, monthly_limit) values ($1, $2, $3) on conflict (user_id, category) do update set monthly_limit = excluded.monthly_limit",
    [userId, category, limit]
  );
}
export async function removeBudget(userId: string, category: string): Promise<boolean> {
  const rows = await q("delete from budgets where user_id = $1 and category = $2 returning id", [userId, category]);
  return rows.length > 0;
}

export async function listRules(userId: string): Promise<Array<{ keyword: string; category: string }>> {
  return q("select keyword, category from category_rules where user_id = $1", [userId]);
}
export async function addRule(userId: string, keyword: string, category: string) {
  await q(
    "insert into category_rules (user_id, keyword, category) values ($1, $2, $3) on conflict (user_id, keyword) do update set category = excluded.category",
    [userId, keyword, category]
  );
}

export async function usersForCron(since: Date): Promise<User[]> {
  const rows = await q(
    "select * from users where daily_report = true and last_inbound_at >= $1::timestamptz",
    [since.toISOString()]
  );
  return rows.map(toUser);
}
export async function pingDb() {
  await q("select 1");
}
