import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from '@/components/providers/Providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'HarvestPilot - Farm Intelligence Platform',
    template: '%s | HarvestPilot',
  },
  description:
    'All-in-one farm management and automation platform for specialty crop and microgreens farmers.',
  keywords: [
    'farm management',
    'agriculture software',
    'microgreens automation',
    'crop planning',
    'IoT farming',
  ],
  openGraph: {
    title: 'HarvestPilot - Farm Intelligence Platform',
    description: 'The all-in-one platform for specialty crop farmers',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
