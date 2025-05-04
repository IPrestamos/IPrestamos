'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Image from 'next/image';
import Link from 'next/link';

export default function LoansContent() {
  const { address, isConnected } = useAccount();
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRepayment, setProcessingRepayment] = useState<string | null>(null);
  const [repaymentStatus, setRepaymentStatus] = useState<string | null>(null);

  // Mock data for demonstration purposes
  const mockLoans = [
    {
      id: '0x1234567890abcdef',
      assetId: 1,
      assetName: 'Digital Artwork #1',
      assetImage: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=300&h=300&auto=format&fit=crop',
      amount: 0.35,
      dueDate: '2024-09-15',
      issuedDate: '2024-06-15',
      sourceChain: 'Camp Network',
      destinationChain: 'Scroll',
      status: 'active',
      interestRate: 5.2
    },
    {
      id: '0xabcdef1234567890',
      assetId: 2,
      assetName: 'Music Composition',
      assetImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=300&h=300&auto=format&fit=crop',
      amount: 0.2,
      dueDate: '2024-07-25',
      issuedDate: '2024-06-10',
      sourceChain: 'Camp Network',
      destinationChain: 'Arbitrum',
      status: 'active',
      interestRate: 4.8
    }
  ];

  useEffect(() => {
    if (isConnected) {
      // In a real app, you would fetch the user's loans from the contracts
      // For demo purposes, we're using mock data
      setTimeout(() => {
        setActiveLoans(mockLoans);
        setLoading(false);
      }, 1000);
    }
  }, [isConnected, address]);

  const handleRepay = async (loanId: string) => {
    setProcessingRepayment(loanId);
    setRepaymentStatus('Initiating loan repayment...');
    
    // Step 1: Simulate repayment on destination chain
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRepaymentStatus('Processing payment on ' + (activeLoans.find(l => l.id === loanId)?.destinationChain || 'destination chain') + '...');
    
    // Step 2: Simulate Hyperlane message to release collateral
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRepaymentStatus('Sending Hyperlane message to release your IP collateral...');
    
    // Step 3: Simulate collateral release on source chain
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRepaymentStatus('Success! Your IP has been released on Camp Network.');
    
    // Update loans list
    setTimeout(() => {
      setActiveLoans(activeLoans.filter(loan => loan.id !== loanId));
      setProcessingRepayment(null);
      setRepaymentStatus(null);
    }, 3000);
  };

  const calculateTimeLeft = (dueDate: string) => {
    const due = new Date(dueDate).getTime();
    const now = new Date().getTime();
    const difference = due - now;
    
    if (difference <= 0) {
      return 'Overdue';
    }
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    return `${days} days left`;
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="glassmorphism p-10 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold gradient-text mb-6">My Loans</h1>
          <p className="mb-8 text-gray-300">Connect your wallet to view your loans</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold glow mb-3">My Cross-Chain Loans</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Manage your active loans and collateral across different blockchains.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      ) : activeLoans.length === 0 ? (
        <div className="glassmorphism p-10 max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">No Active Loans</h2>
          <p className="mb-6 text-gray-300">You don't have any active loans.</p>
          <Link href="/my-assets" className="neo-brutalism">
            Request a Loan
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {repaymentStatus && processingRepayment && (
            <div className="glassmorphism p-6 mb-8">
              <div className="flex items-center mb-4">
                <div className="animate-pulse mr-3 h-3 w-3 rounded-full bg-pink-500"></div>
                <h3 className="text-xl font-bold gradient-text">Processing...</h3>
              </div>
              <p className="text-gray-200">{repaymentStatus}</p>
            </div>
          )}
          
          {activeLoans.map(loan => (
            <div key={loan.id} className={`relative glassmorphism p-6 ${processingRepayment === loan.id ? 'opacity-50' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left - Asset Info */}
                <div className="flex flex-col md:border-r border-white/10 pr-4">
                  <h3 className="text-xl font-bold mb-3">Collateral</h3>
                  <div className="flex items-center">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <Image 
                        src={loan.assetImage} 
                        alt={loan.assetName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">{loan.assetName}</p>
                      <p className="text-xs text-gray-400">ID: {loan.assetId}</p>
                      <p className="text-xs text-gray-400">Locked on {loan.sourceChain}</p>
                    </div>
                  </div>
                </div>
                
                {/* Middle - Loan Details */}
                <div className="md:border-r border-white/10 pr-4">
                  <h3 className="text-xl font-bold mb-3">Loan Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-green-400">{loan.amount} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Interest Rate:</span>
                      <span>{loan.interestRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Issued Date:</span>
                      <span>{loan.issuedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Due Date:</span>
                      <span className="text-blue-400">{loan.dueDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time Left:</span>
                      <span className={`${calculateTimeLeft(loan.dueDate) === 'Overdue' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {calculateTimeLeft(loan.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Right - Actions */}
                <div>
                  <h3 className="text-xl font-bold mb-3">Payment</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Network:</span>
                      <span>{loan.destinationChain}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Repayment:</span>
                      <span className="text-green-400">{(loan.amount * (1 + loan.interestRate/100)).toFixed(4)} ETH</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRepay(loan.id)}
                    disabled={!!processingRepayment}
                    className={`w-full py-3 px-4 rounded-md text-center font-bold transition ${
                      processingRepayment ? 
                      'bg-gray-700 text-gray-300 cursor-not-allowed' : 
                      'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:brightness-110'
                    }`}
                  >
                    {processingRepayment === loan.id ? 'Processing...' : '🔄 Repay Loan'}
                  </button>
                  
                  <div className="text-xs text-gray-400 mt-3 text-center">
                    <p>Repaying will release your IP on {loan.sourceChain}</p>
                    <p>via Hyperlane cross-chain messaging</p>
                  </div>
                </div>
              </div>
              
              {/* Chain Badges */}
              <div className="absolute -top-3 right-6 flex space-x-2">
                <div className="bg-black/50 px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                  {loan.sourceChain}
                </div>
                <div className="bg-gradient-to-r from-pink-500/30 to-purple-500/30 px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                  {loan.destinationChain}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 