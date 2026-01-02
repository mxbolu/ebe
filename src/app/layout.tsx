import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ToastContainer";

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
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
