import type { Metadata } from "next";
import "./globals.css";
import "./safepay-fixes.css";
import "./safepay-settings.css";
import "./safepay-polish.css";
import "./safepay-responsive.css";
import "./safepay-theme.css";

export const metadata: Metadata = {
  title: "SafePay",
  description: "SafePay — secure payments",
};

const themeBootstrap = `(() => { try { const t = localStorage.getItem('safepay-theme'); if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; const l = localStorage.getItem('safepay-language'); if (l === 'en' || l === 'fr') document.documentElement.lang = l; } catch (_) {} })()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootstrap }} /></head>
      <body>{children}</body>
    </html>
  );
}
