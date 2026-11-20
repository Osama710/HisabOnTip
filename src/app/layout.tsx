import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "WhatsApp Expense Tracker",
  description: "Track expenses by chatting on WhatsApp. No app, no signup.",
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
