import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppShell } from '@/components/app-shell';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NeedRelay — AI Disaster Response',
  description:
    'NeedRelay converts raw WhatsApp messages and voice notes into a clean, verified emergency response dashboard for floods in Pakistan.',
  openGraph: {
    title: 'NeedRelay — AI Disaster Response',
    description: 'AI agents turn messy crisis messages into verified rescue tickets.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AppShell>{children}</AppShell>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
