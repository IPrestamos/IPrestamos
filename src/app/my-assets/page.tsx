'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, ABI } from '@/lib/contract';
import Link from 'next/link';
import Image from 'next/image';

export default function MyAssets() {
  const { address, isConnected } = useAccount();
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration purposes
  const mockNfts = [
    {
      id: 1,
      name: 'Digital Artwork #1',
      description: 'Abstract digital artwork with vibrant colors',
      image: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=300&h=300&auto=format&fit=crop',
      commercialUse: true,
      derivativeWorks: false,
      expiry: '2024-12-31'
    },
    {
      id: 2,
      name: 'Music Composition',
      description: 'Original electronic music track',
      image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=300&h=300&auto=format&fit=crop',
      commercialUse: false,
      derivativeWorks: true,
      expiry: '2025-06-15'
    }
  ];

  useEffect(() => {
    if (isConnected) {
      // In a real app, you would fetch the user's NFTs from the contract
      // For demo purposes, we're using mock data
      setTimeout(() => {
        setNfts(mockNfts);
        setLoading(false);
      }, 1000);
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="glassmorphism p-10 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold gradient-text mb-6">My IP Assets</h1>
          <p className="mb-8 text-gray-300">Connect your wallet to view your IP assets</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold glow mb-3">My IP Assets</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          View and manage your intellectual property assets registered on the Camp blockchain.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      ) : nfts.length === 0 ? (
        <div className="glassmorphism p-10 max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">No Assets Found</h2>
          <p className="mb-6 text-gray-300">You don't have any registered IP assets yet.</p>
          <Link href="/" className="neo-brutalism">
            Register IP
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {nfts.map((nft) => (
            <div key={nft.id} className="relative group">
              <div className="gradient-border p-px">
                <div className="glassmorphism p-6 h-full">
                  <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                    <Image 
                      src={nft.image} 
                      alt={nft.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-110"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{nft.name}</h3>
                  <p className="text-gray-300 mb-4 text-sm">{nft.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Commercial Use:</span>
                      <span className={nft.commercialUse ? "text-green-400" : "text-red-400"}>
                        {nft.commercialUse ? "Allowed" : "Not Allowed"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Derivatives:</span>
                      <span className={nft.derivativeWorks ? "text-green-400" : "text-red-400"}>
                        {nft.derivativeWorks ? "Allowed" : "Not Allowed"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Expiry:</span>
                      <span className="text-blue-400">{nft.expiry}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link 
                      href={`/request-loan?assetId=${nft.id}`}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 px-4 rounded-md text-center hover:brightness-110 transition text-sm"
                    >
                      Use as Collateral
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 