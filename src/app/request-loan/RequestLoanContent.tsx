'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useContractReads } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CONTRACT_ADDRESS, ABI } from '@/lib/contract';
import { Abi } from 'viem';

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

interface NFT {
  id: number;
  name: string;
  description: string;
  image: string;
  commercialUse: boolean;
  derivativeWorks: boolean;
  expiry: string;
  mediaType: 'image' | 'video';
  estimatedValue: number;
}

interface LicenseTerms {
  commercialUse: boolean;
  derivativeWorksAllowed: boolean;
  expiryTimestamp: bigint;
}

// Helper function to determine media type
function getMediaType(filename: string): 'image' | 'video' {
  const videoExtensions = ['.mov', '.mp4', '.webm', '.ogg', '.MOV', '.MP4', '.WEBM', '.OGG'];
  return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext.toLowerCase())) ? 'video' : 'image';
}

export default function RequestLoanContent() {
  const { address, isConnected } = useAccount();
  const searchParams = useSearchParams();
  const assetId = searchParams.get('assetId');
  
  const [asset, setAsset] = useState<NFT | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<string>('');
  const [duration, setDuration] = useState<string>('30');
  const [selectedChain, setSelectedChain] = useState<string>('scroll');
  const [processingLoan, setProcessingLoan] = useState(false);
  const [loanStatus, setLoanStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Fetch token URI and license data
  const { data: tokenInfo, isLoading: isLoadingTokenInfo } = useContractReads({
    contracts: assetId ? [
      {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: ABI as Abi,
        functionName: 'tokenURI',
        args: [BigInt(assetId)],
      },
      {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: ABI as Abi,
        functionName: 'getLicense',
        args: [BigInt(assetId)],
      }
    ] : [],
  });

  useEffect(() => {
    async function fetchAssetData() {
      if (!assetId || !tokenInfo || isLoadingTokenInfo) {
        setLoading(false);
        return;
      }

      try {
        const uri = tokenInfo[0]?.result as string;
        const license = tokenInfo[1]?.result as LicenseTerms;

        if (!uri || !license) {
          console.log('Missing uri or license data');
          setLoading(false);
          return;
        }

        // Fetch metadata from IPFS
        const metadataUrl = convertIpfsUrl(uri);
        console.log('Fetching metadata from:', metadataUrl);
        const response = await fetch(metadataUrl);
        const metadata = await response.json();
        
        // Convert the nested image URL
        const imageUrl = convertIpfsUrl(metadata.image);
        console.log('Converted image URL:', imageUrl);

        // Create NFT object
        const nft: NFT = {
          id: Number(assetId),
          name: metadata.name,
          description: metadata.description,
          image: imageUrl,
          commercialUse: license.commercialUse,
          derivativeWorks: license.derivativeWorksAllowed,
          expiry: new Date(Number(license.expiryTimestamp) * 1000).toISOString().split('T')[0],
          mediaType: getMediaType(metadata.name),
          // For now, use a simple calculation for estimated value
          estimatedValue: license.commercialUse ? 0.5 : 0.3
        };

        setAsset(nft);
      } catch (error) {
        console.error('Error fetching asset data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAssetData();
  }, [assetId, tokenInfo, isLoadingTokenInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!asset || !amount || !duration || !selectedChain) {
      alert('Please fill all fields');
      return;
    }
    
    setProcessingLoan(true);
    setLoanStatus('Initiating cross-chain loan request via Hyperlane...');
    
    try {
      // Step 1: Lock collateral on Camp network
      setLoanStatus('Locking your IP NFT as collateral on Camp network...');
      // TODO: Add contract call to lock NFT
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 2: Send Hyperlane message
      setLoanStatus('Sending cross-chain message via Hyperlane to Scroll...');
      // TODO: Add Hyperlane message sending
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 3: Wait for loan issuance on destination chain
      setLoanStatus('Waiting for loan issuance on Scroll...');
      // TODO: Add destination chain transaction monitoring
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockTxHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      setTxHash(mockTxHash);
      setLoanStatus('Loan successfully issued on Scroll!');
    } catch (error) {
      console.error('Error processing loan:', error);
      setLoanStatus('Error processing loan. Please try again.');
    }
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

  if (!asset) {
    return null;
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
            {asset.mediaType === 'image' ? (
              <Image 
                src={asset.image} 
                alt={asset.name}
                fill
                className="object-cover"
              />
            ) : (
              <video 
                src={asset.image}
                controls
                className="w-full h-full object-cover"
                poster={asset.image.replace(/\.[^/.]+$/, '_thumbnail.jpg')}
              >
                Your browser does not support the video tag.
              </video>
            )}
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
              <span className="text-gray-400">Derivatives:</span>
              <span className={asset.derivativeWorks ? "text-green-400" : "text-red-400"}>
                {asset.derivativeWorks ? "Allowed" : "Not Allowed"}
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
                  max={asset.estimatedValue * 0.7}
                  className="w-full bg-black/30 border border-gray-700 rounded-md px-4 py-2 text-white"
                  required
                />
                <p className="mt-1 text-sm text-gray-400">
                  Max: {(asset.estimatedValue * 0.7).toFixed(3)} ETH
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Loan Duration (Days)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-black/30 border border-gray-700 rounded-md px-4 py-2 text-white"
                  required
                >
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                  <option value="90">90 Days</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={processingLoan}
                className="w-full neo-brutalism-white"
              >
                {processingLoan ? 'Processing...' : 'Request Loan'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 