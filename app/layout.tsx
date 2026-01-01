import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { WEBSITE_URL } from "@/lib/utils/constants";
import { AuthProvider } from "@/lib/auth/clerk";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f9fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0c1418' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || WEBSITE_URL),
  title: "Mollei™ | Emotionally Intelligent AI Companion",
  description: "Open source emotionally intelligent AI companion",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Mollei™ | Emotionally Intelligent AI Companion",
    description: "Open source emotionally intelligent AI companion",
    siteName: "Mollei",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mollei™ | Emotionally Intelligent AI Companion",
    description: "Open source emotionally intelligent AI companion",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var theme = localStorage.getItem('theme');
                    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                      document.documentElement.classList.add('dark');
                    }
                  } catch (e) {}
                })();
              `,
            }}
          />
        </head>
        <body
          className={`${inter.variable} ${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
        >
          {children}
        </body>
      </html>
    </AuthProvider>
  );
}
