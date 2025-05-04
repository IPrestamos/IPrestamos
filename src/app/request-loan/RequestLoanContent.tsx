'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// Mock function to simulate sending a hyperlane message
const simulateHyperlaneMessage = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 2000);
  });
};

export default function RequestLoanContent() {
  const { address, isConnected } = useAccount();
  const searchParams = useSearchParams();
  const assetId = searchParams.get('assetId');
  
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<string>('');
  const [duration, setDuration] = useState<string>('30');
  const [selectedChain, setSelectedChain] = useState<string>('scroll');
  const [processingLoan, setProcessingLoan] = useState(false);
  const [loanStatus, setLoanStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Mock data for demonstration purposes
  const mockAssets = {
    '1': {
      id: 1,
      name: 'Digital Artwork #1',
      description: 'Abstract digital artwork with vibrant colors',
      image: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=300&h=300&auto=format&fit=crop',
      commercialUse: true,
      derivativeWorks: false,
      expiry: '2024-12-31',
      estimatedValue: 0.5 // ETH
    },
    '2': {
      id: 2,
      name: 'Music Composition',
      description: 'Original electronic music track',
      image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=300&h=300&auto=format&fit=crop',
      commercialUse: false,
      derivativeWorks: true,
      expiry: '2025-06-15',
      estimatedValue: 0.3 // ETH
    }
  };

  useEffect(() => {
    if (assetId && mockAssets[assetId as keyof typeof mockAssets]) {
      setAsset(mockAssets[assetId as keyof typeof mockAssets]);
    }
    setLoading(false);
  }, [assetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!asset || !amount || !duration || !selectedChain) {
      alert('Please fill all fields');
      return;
    }
    
    setProcessingLoan(true);
    setLoanStatus('Initiating cross-chain loan request via Hyperlane...');
    
    // Step 1: Simulate locking collateral on Camp network
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoanStatus('Locking your IP NFT as collateral on Camp network...');
    
    // Step 2: Simulate sending Hyperlane message
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoanStatus('Sending cross-chain message via Hyperlane to Scroll...');
    
    // Step 3: Simulate loan issued on destination chain
    await new Promise(resolve => setTimeout(resolve, 2000));
    const mockTxHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    setTxHash(mockTxHash);
    setLoanStatus('Loan successfully issued on Scroll!');
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="glassmorphism p-10 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold gradient-text mb-6">Request Loan</h1>
          <p className="mb-8 text-gray-300">Connect your wallet to request a loan</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!asset && assetId) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="glassmorphism p-10 max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Asset Not Found</h2>
          <p className="mb-6 text-gray-300">The selected IP asset could not be found.</p>
          <Link href="/my-assets" className="neo-brutalism">
            Return to My Assets
          </Link>
        </div>
      </div>
    );
  }

  if (!assetId) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="glassmorphism p-10 max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">No Asset Selected</h2>
          <p className="mb-6 text-gray-300">Please select an IP asset to use as collateral.</p>
          <Link href="/my-assets" className="neo-brutalism">
            Browse My Assets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold glow mb-3">Request Cross-Chain Loan</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Use your IP asset as collateral to request a loan on Scroll or Arbitrum via Hyperlane.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Asset Preview */}
        <div className="glassmorphism p-6">
          <h2 className="text-2xl font-bold mb-4 gradient-text">Collateral</h2>
          
          <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
            <Image 
              src={asset.image} 
              alt={asset.name}
              fill
              className="object-cover"
            />
          </div>
          
          <h3 className="text-xl font-bold mb-2">{asset.name}</h3>
          <p className="text-gray-300 mb-4">{asset.description}</p>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-400">Estimated Value:</span>
              <span className="text-green-400">{asset.estimatedValue} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Max Loan Amount:</span>
              <span className="text-blue-400">{(asset.estimatedValue * 0.7).toFixed(3)} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Commercial Use:</span>
              <span className={asset.commercialUse ? "text-green-400" : "text-red-400"}>
                {asset.commercialUse ? "Allowed" : "Not Allowed"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Expiry:</span>
              <span className="text-blue-400">{asset.expiry}</span>
            </div>
          </div>
        </div>
        
        {/* Loan Form */}
        <div className="glassmorphism p-6">
          <h2 className="text-2xl font-bold mb-4 gradient-text">Loan Details</h2>
          
          {loanStatus ? (
            <div className="space-y-6">
              <div className="bg-black/30 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Loan Status</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="animate-pulse mr-3 h-3 w-3 rounded-full bg-pink-500"></div>
                    <p className="text-gray-200">{loanStatus}</p>
                  </div>
                  
                  {txHash && (
                    <div className="mt-4 p-4 bg-black/20 rounded-lg">
                      <p className="text-sm text-gray-300 mb-2">Transaction Hash:</p>
                      <a 
                        href={`https://sepolia.scrollscan.dev/tx/${txHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-pink-400 break-all text-sm hover:underline"
                      >
                        {txHash}
                      </a>
                    </div>
                  )}
                </div>
                
                {loanStatus === 'Loan successfully issued on Scroll!' && (
                  <div className="mt-6">
                    <Link 
                      href="/loans" 
                      className="w-full neo-brutalism flex justify-center"
                    >
                      View My Loans
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Destination Chain</label>
                <select
                  value={selectedChain}
                  onChange={(e) => setSelectedChain(e.target.value)}
                  className="w-full bg-black/30 border border-gray-700 rounded-md px-4 py-2 text-white"
                  required
                >
                  <option value="scroll">Scroll (Sepolia)</option>
                  <option value="arbitrum">Arbitrum (Sepolia)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Loan Amount (ETH)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  max={(asset.estimatedValue * 0.7).toString()}
                  className="w-full bg-black/30 border border-gray-700 rounded-md px-4 py-2 text-white"
                  required
                />
                <p className="mt-1 text-sm text-gray-400">Maximum: {(asset.estimatedValue * 0.7).toFixed(3)} ETH</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Loan Duration (days)</label>
                <input
                  type="number"
                  placeholder="30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  max="365"
                  className="w-full bg-black/30 border border-gray-700 rounded-md px-4 py-2 text-white"
                  required
                />
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={processingLoan}
                  className={`w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-4 rounded-md text-center font-bold hover:brightness-110 transition ${processingLoan ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {processingLoan ? 'Processing...' : '🚀 Request Loan'}
                </button>
              </div>
              
              <div className="text-sm text-gray-400 text-center pt-4">
                <p>Your IP will be locked as collateral on Camp network.</p>
                <p>The loan will be issued on {selectedChain === 'scroll' ? 'Scroll' : 'Arbitrum'} via Hyperlane.</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 