// src/app/layout.tsx

import './globals.css';
import { ReactNode } from 'react';
import '@rainbow-me/rainbowkit/styles.css';

export const metadata = {
  title: 'IP-Collateralized Cross-Chain Loans',
  description: 'Use your IP as collateral for loans across chains'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
