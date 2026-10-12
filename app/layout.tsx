import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Frame Studio · Higgsfield rebuild",
  description: "One idea. One cinematic shot. A focused creative studio with visible iterations.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
