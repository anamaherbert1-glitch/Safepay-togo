import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./safepay-fixes.css";
import "./safepay-settings.css";
import "./safepay-polish.css";
import "./safepay-responsive.css";
import "./safepay-theme.css";
import "./cyenoo-contrast.css";

export const metadata: Metadata = {
  title: "Cyenoo",
  description: "Cyenoo — paiements sécurisés au Togo",
  applicationName: "Cyenoo",
  appleWebApp: {
    capable: true,
    title: "Cyenoo",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#123A6B" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1F3A" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const themeBootstrap = `(() => { try { const t = localStorage.getItem('safepay-theme'); if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; const l = localStorage.getItem('safepay-language'); if (l === 'en' || l === 'fr') document.documentElement.lang = l; } catch (_) {} })()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  );
}
