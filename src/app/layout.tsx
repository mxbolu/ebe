import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ebe - Your Personal Reading Journal",
  description: "Track, discover, and share your reading journey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
