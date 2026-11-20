export default function Privacy() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 20px", lineHeight: 1.6 }}>
      <h1>Privacy Policy</h1>
      <p>
        This service lets you track expenses by sending messages on WhatsApp. This page explains what we store and how to remove it.
      </p>
      <h2>What we store</h2>
      <ul>
        <li>Your WhatsApp phone number and profile name (to identify your account).</li>
        <li>The entries you send: amount, category, note, date and optional payment tag (cash, bank, wallet), plus budgets, goals and your language choice.</li>
      </ul>
      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell or share your data with advertisers.</li>
        <li>We do not read your other WhatsApp chats; we only receive messages you send to this number.</li>
      </ul>
      <h2>Processors</h2>
      <p>
        Messages pass through Meta&apos;s WhatsApp Business Platform. Data is stored with our database provider (Neon) and
        served from Vercel. If an optional AI fallback is enabled, only the text of a message the app could not understand
        may be sent to the AI provider, without your phone number. Voice notes you send are sent to a speech-to-text provider (Google) to be turned into text; we do not keep the audio.
      </p>
      <h2>Deleting your data</h2>
      <p>Send <b>delete my data</b> to the bot and confirm. Your account and all entries are permanently removed.</p>
      <h2>Contact</h2>
      <p>Add your contact email here before going public.</p>
    </main>
  );
}
