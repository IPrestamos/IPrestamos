// src/app/layout.tsx
'use client';

import './globals.css';
import { ReactNode } from 'react';
import { WagmiConfig, createConfig, http } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { basecampTestnet, scrollSepolia, arbitrumSepolia } from 'wagmi/chains';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';

const config = createConfig({
  chains: [basecampTestnet, scrollSepolia, arbitrumSepolia],
  transports: {
    [basecampTestnet.id]: http(), // Camp network
    [scrollSepolia.id]: http(), // Scroll testnet
    [arbitrumSepolia.id]: http(), // Arbitrum testnet
  },
  ssr: true,
});

export default function RootLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en">
      <head>
        <title>IP-Collateralized Cross-Chain Loans</title>
        <meta name="description" content="Use your IP as collateral for loans across chains" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white min-h-screen">
        <QueryClientProvider client={queryClient}>
          <WagmiConfig config={config}>
            <RainbowKitProvider theme={darkTheme()}>
              <nav className="fixed w-full bg-black/30 backdrop-blur-lg p-4 z-50">
                <div className="container mx-auto flex flex-wrap items-center justify-between">
                  <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
                    IP Finance
                  </Link>
                  <div className="flex items-center space-x-4">
                    <Link href="/" className="hover:text-pink-400 transition">Register IP</Link>
                    <Link href="/my-assets" className="hover:text-pink-400 transition">My Assets</Link>
                    <Link href="/loans" className="hover:text-pink-400 transition">Loan Market</Link>
                    <Link href="/request-loan" className="hover:text-pink-400 transition px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-violet-500">Request Loan</Link>
                  </div>
                </div>
              </nav>
              <main className="pt-24 pb-12">
                {children}
              </main>
              <footer className="bg-black/20 backdrop-blur-md py-8">
                <div className="container mx-auto text-center">
                  <p className="text-gray-400">Powered by Hyperlane & IP Registry • © 2023</p>
                </div>
              </footer>
            </RainbowKitProvider>
          </WagmiConfig>
        </QueryClientProvider>
      </body>
    </html>
  );
}
