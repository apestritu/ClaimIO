import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClaimIO — AI Claim Processing",
  description:
    "Multi-agent insurance claim processing with OpenAI Agents SDK, A2A, and MCP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
