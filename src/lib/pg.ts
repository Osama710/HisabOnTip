import postgres from "postgres";

let sql: ReturnType<typeof postgres> | null = null;

function client() {
  if (!sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    sql = postgres(url, {
      ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require",
      max: 1, // serverless: one connection per instance, Neon's pooler does the rest
      prepare: false, // required for pooled (PgBouncer) connection strings
      idle_timeout: 20,
      connect_timeout: 10,
      fetch_types: false, // slightly less work on hot path
    });
  }
  return sql;
}

/** Run one parameterised SQL statement. All values go through $1, $2 ... placeholders. */
export async function q<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await client().unsafe(text, params as any[])) as unknown as T[];
}
