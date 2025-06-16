import type { Metadata } from 'next';
import { Providers } from './_providers/providers';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Flex Report',
  description: 'Analytics and reporting platform',
};

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
    <body className={inter.className}>
    <Providers>{children}</Providers>
    </body>
    </html>
  );
}