import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paper Birthdays",
  description: "Celebrating papers published on today's date",
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
