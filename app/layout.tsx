import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Read-a-Brief | The world. In a few minutes.",
  description: "AI-powered news briefings that turn important stories into clear, concise updates.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
