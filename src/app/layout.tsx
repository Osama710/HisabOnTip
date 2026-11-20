import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Hisab On Tip",
  description: "Roz ka hisaab on WhatsApp. Hisab On Tip — no app, no signup.",
  icons: { icon: "/logo-mark.svg", apple: "/logo-mark-512.png" },
  openGraph: {
    title: "Hisab On Tip",
    description: "Roz ka kharcha, seedha WhatsApp pe.",
    images: [{ url: "/logo-mark-512.png", width: 640, height: 640, alt: "Hisab On Tip" }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f6f7f8", color: "#16202a" }}>
        {children}
      </body>
    </html>
  );
}
