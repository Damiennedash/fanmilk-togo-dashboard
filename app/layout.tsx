import type { Metadata } from 'next';
import { Baloo_2, Geist_Mono, Nunito } from 'next/font/google';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fanmilk-togo-dashboard.djatadamienne5.chatgpt.site';

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
});

const baloo = Baloo_2({
  variable: '--font-baloo',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'FanMilk Togo — Délicieux, Onctueux',
  description: 'Découvrez les produits FanMilk Togo et accédez au Dashboard de pilotage commercial.',
  openGraph: {
    title: 'FanMilk Togo — Délicieux, Onctueux',
    description: 'Produits FanMilk et pilotage commercial.',
    images: [{ url: '/og.png', width: 1680, height: 941, alt: 'FanMilk Togo — Délicieux, Onctueux' }],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FanMilk Togo — Délicieux, Onctueux',
    description: 'Produits FanMilk et pilotage commercial.',
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
        className={`${nunito.variable} ${baloo.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
