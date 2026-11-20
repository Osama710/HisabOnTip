import crypto from "crypto";

const version = () => process.env.WHATSAPP_API_VERSION || "v21.0";
const endpoint = () => `https://graph.facebook.com/${version()}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

export function verifySignature(raw: string, header: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !header) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function post(body: object): Promise<boolean> {
  try {
    const r = await fetch(endpoint(), {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
    });
    if (!r.ok) {
      console.error("whatsapp send failed", r.status, (await r.text()).slice(0, 300));
      return false;
    }
    return true;
  } catch (e) {
    console.error("whatsapp send error", e instanceof Error ? e.message : "unknown");
    return false;
  }
}

export const sendText = (to: string, text: string) =>
  post({ to, type: "text", text: { body: text.slice(0, 4000), preview_url: false } });

export const sendImage = (to: string, link: string, caption?: string) =>
  post({ to, type: "image", image: { link, caption: caption?.slice(0, 1000) } });

export const sendDocument = (to: string, link: string, filename: string, caption?: string) =>
  post({ to, type: "document", document: { link, filename, caption } });

export const markRead = (messageId: string) => post({ status: "read", message_id: messageId });

const MAX_AUDIO_BYTES = 2 * 1024 * 1024;

/** Voice notes arrive as a media id. Fetch the temporary URL, then the bytes (both need the token). */
export async function downloadMedia(mediaId: string): Promise<{ data: Buffer; mime: string } | null> {
  try {
    const headers = { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` };
    const meta = await fetch(`https://graph.facebook.com/${version()}/${encodeURIComponent(mediaId)}`, { headers });
    if (!meta.ok) return null;
    const j: any = await meta.json();
    if (!j?.url || (j.file_size && Number(j.file_size) > MAX_AUDIO_BYTES)) return null;
    const r = await fetch(j.url, { headers });
    if (!r.ok) return null;
    const data = Buffer.from(await r.arrayBuffer());
    if (!data.length || data.length > MAX_AUDIO_BYTES) return null;
    return { data, mime: String(j.mime_type || "audio/ogg").split(";")[0].trim() };
  } catch (e) {
    console.error("media download failed", e instanceof Error ? e.message : "unknown");
    return null;
  }
}
