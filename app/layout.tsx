import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fanmilk-togo-dashboard.djatadamienne5.chatgpt.site';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'FanMilk Dashboard — Pilotage commercial',
  description: 'Suivez les ventes, stocks et performances des revendeurs FanMilk Togo en temps réel.',
  openGraph: {
    title: 'FanMilk Dashboard',
    description: 'Chaque vente devient une décision claire.',
    images: [{ url: '/og.png', width: 1536, height: 1024, alt: 'FanMilk Dashboard' }],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FanMilk Dashboard',
    description: 'Chaque vente devient une décision claire.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
