import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Lang } from "./parser";

let client: SupabaseClient | null = null;
export function db(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase env vars missing");
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

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

function ck<T>(res: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (res.error) throw new Error(`db: ${res.error.message}`);
  return res.data as T;
}

/** Returns false if this WhatsApp message id was already handled (Meta retries). */
export async function claimMessage(id: string): Promise<boolean> {
  const { error } = await db().from("processed_messages").insert({ wa_message_id: id });
  if (!error) return true;
  if (error.code === "23505") return false;
  throw new Error(`db: ${error.message}`);
}

export async function getOrCreateUser(phone: string, name?: string): Promise<{ user: User; isNew: boolean }> {
  const found = ck(await db().from("users").select("*").eq("phone", phone).maybeSingle());
  if (found) return { user: found as unknown as User, isNew: false };
  const ins = await db().from("users").insert({ phone, name: name ?? null }).select("*").single();
  if (ins.error?.code === "23505") {
    const again = ck(await db().from("users").select("*").eq("phone", phone).single());
    return { user: again as unknown as User, isNew: false };
  }
  return { user: ck(ins) as unknown as User, isNew: true };
}

export async function updateUser(id: string, patch: Partial<Omit<User, "id" | "phone">>) {
  ck(await db().from("users").update(patch).eq("id", id));
}

export async function deleteUser(id: string) {
  ck(await db().from("users").delete().eq("id", id));
}

export async function insertTx(rows: Array<Omit<Tx, "id" | "created_at">>): Promise<Tx[]> {
  return ck(await db().from("transactions").insert(rows).select("*")) as Tx[];
}

const norm = (r: any): Tx => ({ ...r, amount: Number(r.amount) });

export async function fetchTx(userId: string, from: Date, to: Date): Promise<Tx[]> {
  const all: Tx[] = [];
  for (let page = 0; page < 20; page++) {
    const rows = ck(
      await db().from("transactions").select("*").eq("user_id", userId).is("deleted_at", null)
        .gte("occurred_at", from.toISOString()).lt("occurred_at", to.toISOString())
        .order("occurred_at", { ascending: true }).range(page * 1000, page * 1000 + 999)
    ) as any[];
    all.push(...rows.map(norm));
    if (rows.length < 1000) break;
  }
  return all;
}

export async function lastTx(userId: string, n = 1): Promise<Tx[]> {
  const rows = ck(
    await db().from("transactions").select("*").eq("user_id", userId).is("deleted_at", null)
      .order("created_at", { ascending: false }).limit(n)
  ) as any[];
  return rows.map(norm);
}

export async function softDelete(id: string) {
  ck(await db().from("transactions").update({ deleted_at: new Date().toISOString() }).eq("id", id));
}
export async function updateTxAmount(id: string, amount: number) {
  ck(await db().from("transactions").update({ amount }).eq("id", id));
}

export async function listGoals(userId: string): Promise<Goal[]> {
  const rows = ck(await db().from("savings_goals").select("id,name,target").eq("user_id", userId).order("created_at")) as any[];
  return rows.map((r) => ({ ...r, target: Number(r.target) }));
}
export async function upsertGoal(userId: string, name: string, target: number) {
  ck(await db().from("savings_goals").upsert({ user_id: userId, name, target }, { onConflict: "user_id,name" }));
}
export async function deleteGoal(userId: string, name: string): Promise<boolean> {
  const rows = ck(await db().from("savings_goals").delete().eq("user_id", userId).eq("name", name).select("id")) as any[];
  return rows.length > 0;
}
export async function goalSavedMap(userId: string): Promise<Record<string, number>> {
  const rows = ck(
    await db().from("transactions").select("goal_id,amount").eq("user_id", userId).is("deleted_at", null).not("goal_id", "is", null)
  ) as any[];
  const out: Record<string, number> = {};
  for (const r of rows) out[r.goal_id] = (out[r.goal_id] ?? 0) + Number(r.amount);
  return out;
}

export async function listBudgets(userId: string): Promise<Budget[]> {
  const rows = ck(await db().from("budgets").select("category,monthly_limit").eq("user_id", userId)) as any[];
  return rows.map((r) => ({ category: r.category, monthly_limit: Number(r.monthly_limit) }));
}
export async function setBudget(userId: string, category: string, limit: number) {
  ck(await db().from("budgets").upsert({ user_id: userId, category, monthly_limit: limit }, { onConflict: "user_id,category" }));
}
export async function removeBudget(userId: string, category: string): Promise<boolean> {
  const rows = ck(await db().from("budgets").delete().eq("user_id", userId).eq("category", category).select("id")) as any[];
  return rows.length > 0;
}

export async function listRules(userId: string): Promise<Array<{ keyword: string; category: string }>> {
  return ck(await db().from("category_rules").select("keyword,category").eq("user_id", userId)) as any[];
}
export async function addRule(userId: string, keyword: string, category: string) {
  ck(await db().from("category_rules").upsert({ user_id: userId, keyword, category }, { onConflict: "user_id,keyword" }));
}

export async function usersForCron(since: Date): Promise<User[]> {
  return ck(
    await db().from("users").select("*").eq("daily_report", true).gte("last_inbound_at", since.toISOString())
  ) as User[];
}
export async function pingDb() {
  await db().from("users").select("id").limit(1);
}
