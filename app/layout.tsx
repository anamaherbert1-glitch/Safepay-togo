import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./cyenoo-fixes.css";
import "./cyenoo-settings.css";
import "./cyenoo-polish.css";
import "./cyenoo-responsive.css";
import "./cyenoo-theme.css";
import "./cyenoo-contrast.css";
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
    icon: [{ url: "/icons/cyenoo-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/cyenoo-icon.svg", type: "image/svg+xml" }],
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
