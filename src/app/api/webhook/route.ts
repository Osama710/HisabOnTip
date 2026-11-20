import { after } from "next/server";
import { handleIncoming } from "@/lib/handle";
import { verifySignature } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Meta calls this once when you add the webhook in the dashboard.
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// Meta calls this for every incoming message. Reply 200 fast, work after.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new Response("Bad signature", { status: 401 });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  after(async () => {
    await handleIncoming(body);
  });
  return new Response("ok", { status: 200 });
}
