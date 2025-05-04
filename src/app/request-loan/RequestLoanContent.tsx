'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CONTRACT_ADDRESS, ABI, LOAN_MANAGER_ADDRESS, LOAN_MANAGER_ABI, COLLATERAL_MANAGER_ADDRESS } from '@/lib/contract';
import { parseEther, type Hash } from 'viem';
import { useContractReads, useTransaction, useContractWrite, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import type { BaseError } from 'viem';
import type { Config } from 'wagmi';
import { LOAN_MANAGER_ABI as ContractLOAN_MANAGER_ABI, type LoanManagerFunctions } from '@/lib/contract';

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

interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  commercialUse: boolean;
  derivativeWorks: boolean;
  expiry: string;
  mediaType: 'image' | 'video';
  estimatedValue: number;
}

export default function RequestLoanContent() {
  const { address, isConnected } = useAccount();
  const searchParams = useSearchParams();
  const assetId = searchParams.get('assetId');
  
  const [asset, setAsset] = useState<NFT | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<string>('');
  const [duration, setDuration] = useState<string>('30');
  const [selectedChain, setSelectedChain] = useState<string>('arbitrum');
  const [processingLoan, setProcessingLoan] = useState(false);
  const [loanStatus, setLoanStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hash | undefined>();
  const [isApproved, setIsApproved] = useState(false);

  // Contract read to check if NFT is approved
  const { data: approvalData } = useContractReads({
    contracts: [
      {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: ABI,
        functionName: 'getApproved',
        args: assetId ? [BigInt(assetId)] : undefined,
      },
      {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: ABI,
        functionName: 'isApprovedForAll',
        args: address && COLLATERAL_MANAGER_ADDRESS ? [address, COLLATERAL_MANAGER_ADDRESS] : undefined,
      }
    ],
  });

  // Update approval status when data changes
  useEffect(() => {
    if (approvalData) {
      const isApprovedForToken = approvalData[0]?.result === COLLATERAL_MANAGER_ADDRESS;
      const isApprovedForAll = approvalData[1]?.result === true;
      setIsApproved(isApprovedForToken || isApprovedForAll);
    }
  }, [approvalData]);

  // Contract write for NFT approval
  const { writeContract: approveNFT, isPending: isApprovePending } = useWriteContract();

  // Watch transaction status for approval
  const { isLoading: isApproving } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleApprove = async () => {
    if (!asset) {
      console.error('Missing asset data');
      return;
    }
    if (!COLLATERAL_MANAGER_ADDRESS) {
      console.error('Missing collateral manager address');
      return;
    }
    if (!approveNFT) {
      console.error('Missing approve function');
      return;
    }

    console.log('Starting approval with data:', {
      tokenContract: CONTRACT_ADDRESS,
      spender: COLLATERAL_MANAGER_ADDRESS,
      tokenId: asset.id
    });

    setProcessingLoan(true);
    setLoanStatus('Approving NFT for collateral...');

    try {
      const tx = await approveNFT({
        abi: ABI,
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'approve',
        args: [COLLATERAL_MANAGER_ADDRESS as `0x${string}`, BigInt(asset.id)],
      });

      // The transaction will be tracked by the useWaitForTransactionReceipt hook
      if (typeof tx === 'string') {
        setTxHash(tx as `0x${string}`);
        setLoanStatus('Approval transaction submitted. Waiting for confirmation...');
      }
    } catch (error: any) {
      console.error('Error approving NFT:', error);
      setLoanStatus(`Error approving NFT: ${error.message || 'Please try again'}`);
      setProcessingLoan(false);
    }
  };

  // Update button text based on approval state
  const getApproveButtonText = () => {
    if (isApprovePending) return 'Confirm in Wallet...';
    if (isApproving) return 'Approving...';
    return 'Approve NFT as Collateral';
  };

  // Contract write hook
  const { data, error, isPending, writeContract } = useWriteContract<Config, typeof LOAN_MANAGER_ABI, 'requestLoan'>();

  // Watch transaction status
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!asset || !amount || !duration || !selectedChain || !address || !writeContract) {
      alert('Please fill all fields');
      return;
    }

    if (!isApproved) {
      alert('Please approve the NFT first');
      return;
    }
    
    setProcessingLoan(true);
    setLoanStatus('Initiating cross-chain loan request via Hyperlane...');
    
    try {
      const amountInWei = parseEther(amount);
      const durationInSeconds = BigInt(parseInt(duration) * 24 * 60 * 60);

      const hash = await writeContract({
        address: LOAN_MANAGER_ADDRESS,
        abi: LOAN_MANAGER_ABI,
        functionName: 'requestLoan',
        args: [
          CONTRACT_ADDRESS,
          BigInt(asset.id),
          amountInWei,
          durationInSeconds
        ],
        value: amountInWei + (amountInWei / BigInt(10))
      });

      setTxHash(hash);
      setLoanStatus(`Transaction sent! Hash: ${hash}`);
    } catch (err) {
      console.error('Error processing loan:', err);
      setLoanStatus(`Error processing loan: ${err instanceof Error ? err.message : 'Please try again'}`);
    }
  };

  // Fetch token URI and license data from IP Registry
  const { data: tokenInfo, isLoading: isLoadingTokenInfo } = useContractReads({
    contracts: assetId ? [
      {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: ABI,
        functionName: 'tokenURI',
        args: [BigInt(assetId)],
      },
      {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: ABI,
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
          id: assetId,
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

          {!isApproved && (
            <button
              onClick={handleApprove}
              disabled={isApprovePending || isApproving || processingLoan}
              className="w-full neo-brutalism-white mb-4"
            >
              {getApproveButtonText()}
            </button>
          )}
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
                        href={`https://${selectedChain === 'arbitrum' ? 'sepolia.arbiscan.io' : 'sepolia.scrollscan.dev'}/tx/${txHash}`} 
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
                  <option value="arbitrum">Arbitrum (Sepolia)</option>
                  <option value="scroll">Scroll (Sepolia)</option>
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
                disabled={isPending || isConfirming}
                className={`w-full ${isApproved ? 'neo-brutalism-white' : 'neo-brutalism-disabled'}`}
              >
                {isPending ? 'Confirming in Wallet...' : 
                 isConfirming ? 'Confirming on Chain...' : 
                 'Request Loan'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 