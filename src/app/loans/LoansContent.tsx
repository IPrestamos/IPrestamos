'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useContractReads, useWriteContract, useSimulateContract } from 'wagmi';
import Image from 'next/image';
import Link from 'next/link';
import { LOAN_MANAGER_ADDRESS, LOAN_MANAGER_ABI } from '@/lib/contract';
import { Abi, parseEther } from 'viem';

const IPFS_GATEWAY = 'https://moccasin-mere-chinchilla-829.mypinata.cloud/ipfs/';

function convertIpfsUrl(url: string): string {
  console.log('Converting IPFS URL:', url);
  // First remove any malformed prefix
  const cleanUrl = url.replace('https://sample.com', '');
  
  if (cleanUrl.startsWith('ipfs://')) {
    const converted = cleanUrl.replace('ipfs://', IPFS_GATEWAY);
    console.log('Converted to:', converted);
    return converted;
  }
  console.log('URL not converted (no ipfs:// prefix):', cleanUrl);
  return cleanUrl;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
}

interface LoanData {
  tokenId: bigint;
  amount: bigint;
  dueDate: bigint;
  issuedDate: bigint;
  interestRate: bigint;
  destinationChain: string;
  status: 'active' | 'repaid' | 'defaulted';
}

interface Loan {
  id: string;
  assetId: number;
  assetName: string;
  assetImage: string;
  amount: number;
  dueDate: string;
  issuedDate: string;
  sourceChain: string;
  destinationChain: string;
  status: 'active' | 'repaid' | 'defaulted';
  interestRate: number;
  mediaType: 'image' | 'video';
}

interface ContractReadResult {
  error?: Error;
  result?: unknown;
  status: 'success' | 'failure';
}

// Helper function to determine media type
function getMediaType(filename: string): 'image' | 'video' {
  const videoExtensions = ['.mov', '.mp4', '.webm', '.ogg', '.MOV', '.MP4', '.WEBM', '.OGG'];
  return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext.toLowerCase())) ? 'video' : 'image';
}

// Helper function to format date
function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toISOString().split('T')[0];
}

// Helper function to format amount from wei to ETH
function formatAmount(amount: bigint): number {
  return Number(amount) / 1e18;
}

export default function LoansContent() {
  const { address, isConnected } = useAccount();
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRepayment, setProcessingRepayment] = useState<string | null>(null);
  const [repaymentStatus, setRepaymentStatus] = useState<string | null>(null);

  // Fetch active loans
  const { data: loansData, isLoading: isLoadingLoans } = useContractReads({
    contracts: [
      {
        address: LOAN_MANAGER_ADDRESS as `0x${string}`,
        abi: LOAN_MANAGER_ABI as Abi,
        functionName: 'getActiveLoans',
      }
    ],
  });

  // Simulate repayment
  const { data: simulateRepayment } = useSimulateContract({
    address: LOAN_MANAGER_ADDRESS as `0x${string}`,
    abi: LOAN_MANAGER_ABI as Abi,
    functionName: 'repayLoan',
    args: processingRepayment ? [BigInt(processingRepayment)] : undefined,
  });

  // Contract write for repayment
  const { writeContract: repayLoan, isPending: isRepayPending } = useWriteContract();

  // Fetch NFT metadata and loan details
  useEffect(() => {
    async function fetchLoansData() {
      if (!isConnected || !address || !loansData || isLoadingLoans) {
        setLoading(false);
        return;
      }

      try {
        const contractResult = loansData[0] as ContractReadResult;
        if (contractResult.status === 'failure' || !contractResult.result) {
          console.error('Failed to fetch loans:', contractResult.error);
          setLoading(false);
          return;
        }

        const loans = Array.isArray(contractResult.result) ? 
          (contractResult.result as LoanData[]) : [];
        
        // Fetch NFT metadata for each loan
        const loanPromises = loans.map(async (loan) => {
          try {
            // Get token URI
            const tokenUriResult = await fetch(`${LOAN_MANAGER_ADDRESS}/token/${loan.tokenId}/uri`);
            const tokenUri = await tokenUriResult.text();
            
            // Fetch metadata from IPFS
            const metadataUrl = convertIpfsUrl(tokenUri);
            const metadataResponse = await fetch(metadataUrl);
            const metadata: NFTMetadata = await metadataResponse.json();
            
            // Convert image URL
            const imageUrl = convertIpfsUrl(metadata.image);

            return {
              id: loan.tokenId.toString(),
              assetId: Number(loan.tokenId),
              assetName: metadata.name,
              assetImage: imageUrl,
              amount: formatAmount(loan.amount),
              dueDate: formatDate(loan.dueDate),
              issuedDate: formatDate(loan.issuedDate),
              sourceChain: 'Camp Network',
              destinationChain: loan.destinationChain,
              status: loan.status,
              interestRate: Number(loan.interestRate) / 100, // Convert basis points to percentage
              mediaType: getMediaType(metadata.name)
            } as Loan;
          } catch (error) {
            console.error(`Error fetching metadata for loan ${loan.tokenId}:`, error);
            return null;
          }
        });

        const fetchedLoans = (await Promise.all(loanPromises)).filter((loan): loan is Loan => loan !== null);
        setActiveLoans(fetchedLoans);
      } catch (error) {
        console.error('Error fetching loans data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLoansData();
  }, [isConnected, address, loansData, isLoadingLoans]);

  const handleRepay = async (loanId: string) => {
    if (!simulateRepayment?.request) {
      console.error('Cannot simulate repayment');
      return;
    }

    setProcessingRepayment(loanId);
    setRepaymentStatus('Initiating loan repayment...');
    
    try {
      const loan = activeLoans.find(l => l.id === loanId);
      if (!loan) throw new Error('Loan not found');

      // Calculate repayment amount with interest
      const repaymentAmount = loan.amount * (1 + loan.interestRate / 100);
      
      // Call repayLoan function
      await repayLoan({
        ...simulateRepayment.request,
        value: parseEther(repaymentAmount.toString()),
      });

      setRepaymentStatus('Processing payment...');
      
      // Remove the loan from the list after a delay
      setTimeout(() => {
        setActiveLoans(prev => prev.filter(l => l.id !== loanId));
        setProcessingRepayment(null);
        setRepaymentStatus('Success! Your IP has been released on Camp Network.');
        
        // Clear status after a delay
        setTimeout(() => {
          setRepaymentStatus(null);
        }, 3000);
      }, 5000);
    } catch (error) {
      console.error('Error processing repayment:', error);
      setRepaymentStatus('Error processing repayment. Please try again.');
      setTimeout(() => {
        setProcessingRepayment(null);
        setRepaymentStatus(null);
      }, 3000);
    }
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
          <p className="mb-6 text-gray-300">You don&apos;t have any active loans.</p>
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
                      {loan.mediaType === 'image' ? (
                        <Image 
                          src={loan.assetImage} 
                          alt={loan.assetName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <video 
                          src={loan.assetImage}
                          className="w-full h-full object-cover"
                          poster={loan.assetImage.replace(/\.[^/.]+$/, '_thumbnail.jpg')}
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}
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
                      <span className="text-green-400">{(loan.amount * (1 + loan.interestRate / 100)).toFixed(3)} ETH</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRepay(loan.id)}
                    disabled={isRepayPending || processingRepayment !== null}
                    className="w-full neo-brutalism-white"
                  >
                    {isRepayPending ? 'Processing...' : 'Repay Loan'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 