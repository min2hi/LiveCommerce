import React from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { NotificationManager } from '@/components/notification-manager';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const metadata = {
  title: 'LiveCommerce',
  description: 'Premium live streaming storefront',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="bg-[#0d0f14] font-sans text-white antialiased min-h-[100dvh] flex flex-col" suppressHydrationWarning>
        <NotificationManager />
        {children}
      </body>
    </html>
  );
}
