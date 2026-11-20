const number = process.env.NEXT_PUBLIC_WA_NUMBER;

export default function Home() {
  const link = number ? `https://wa.me/${number}?text=hi` : null;
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "56px 20px" }}>
      <img src="/logo.svg" alt="Hisab On Tip" width={320} height={80} style={{ display: "block", marginBottom: 16 }} />
      <p style={{ fontSize: 18, lineHeight: 1.5 }}>
        No app to install. Just text the bot like you text a friend:
      </p>
      <pre style={{ background: "#fff", padding: 16, borderRadius: 12, fontSize: 16, lineHeight: 1.7 }}>
{`chai paratha 110
petrol 2000
salary 150000
kal biryani 450
چائے 50 اور رکشہ 200`}
      </pre>
      <p style={{ lineHeight: 1.5 }}>
        English, Urdu and Roman Urdu. Daily, weekly and monthly reports with charts, budgets and savings goals.
      </p>
      {link ? (
        <a
          href={link}
          style={{ display: "inline-block", background: "#25d366", color: "#fff", padding: "14px 22px", borderRadius: 12, fontWeight: 700, textDecoration: "none" }}
        >
          Start on WhatsApp
        </a>
      ) : (
        <p style={{ color: "#888" }}>Set NEXT_PUBLIC_WA_NUMBER to show the “Start on WhatsApp” button.</p>
      )}
      <p style={{ marginTop: 40, fontSize: 14 }}>
        <a href="/privacy">Privacy policy</a>
      </p>
    </main>
  );
}
