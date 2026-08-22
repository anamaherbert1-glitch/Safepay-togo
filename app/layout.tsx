import type { Metadata } from "next";
import "./globals.css";
import "./safepay-fixes.css";

export const metadata: Metadata = {
  title: "SafePay",
  description: "SafePay — secure payments",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
