import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./safepay-fixes.css";
import "./safepay-settings.css";
import "./safepay-polish.css";
import "./safepay-responsive.css";
import "./safepay-theme.css";
import "./cyenoo-contrast.css";
import "./cyenoo-layout.css";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "Cyenoo",
  description: "Cyenoo — paiements sécurisés au Togo",
  applicationName: "Cyenoo",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Cyenoo",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192?v=20260914clean", sizes: "192x192", type: "image/png" },
      { url: "/icon-512?v=20260914clean", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon?v=20260914clean", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0032C7" },
    { media: "(prefers-color-scheme: dark)", color: "#0032C7" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const themeBootstrap = `(() => { try { const t = localStorage.getItem('cyenoo-theme'); if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; const l = localStorage.getItem('cyenoo-language'); if (l === 'en' || l === 'fr') document.documentElement.lang = l; } catch (_) {} })()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
