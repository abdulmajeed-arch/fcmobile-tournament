import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FC Mobile Championship",
  description: "The official FC Mobile tournament hub.",
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