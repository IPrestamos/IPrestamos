'use client';

import { CONTRACT_ADDRESS, ABI } from '@/lib/contract';
import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract } from 'wagmi';
import { NFTStorage, File } from 'nft.storage';
import { uploadToPinata, uploadMetadataToPinata } from '@/lib/pinata';
import Link from 'next/link';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [commercialUse, setCommercialUse] = useState(false);
  const [derivatives, setDerivatives] = useState(false);
  const [expiry, setExpiry] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !address || !expiry) return alert('Fill all fields');
  
    setProcessing(true);
    try {
      // Upload image to IPFS via Pinata
      const imageURI = await uploadToPinata(file);
    
      // Build and upload metadata
      const metadata = {
        name: file.name,
        description,
        image: imageURI,
        attributes: [
          { trait_type: 'Commercial Use', value: commercialUse },
          { trait_type: 'Derivatives Allowed', value: derivatives },
          { trait_type: 'Expiry', value: expiry }
        ]
      };
    
      const tokenURI = await uploadMetadataToPinata(metadata);
      const expiryUnix = Math.floor(new Date(expiry).getTime() / 1000);
    
      const tx = await writeContractAsync({
        abi: ABI,
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'registerIP',
        args: [address, tokenURI, commercialUse, derivatives, expiryUnix]
      });

      setTxHash(tx);
    
      alert('✅ IP Registered via Pinata!');
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      alert('Error registering IP. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold glow mb-4">Register Your Intellectual Property</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Secure your digital creations on-chain and use them as collateral for cross-chain loans.
        </p>
      </div>

      <div className="max-w-2xl mx-auto glassmorphism p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h2 className="text-2xl font-bold gradient-text">Register Your IP</h2>
          <ConnectButton />
        </div>

        {!isConnected ? (
          <div className="text-center py-8">
            <p className="mb-6 text-gray-300">Connect your wallet to register your intellectual property</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Upload File</label>
              <input
                type="file"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-300 bg-black/30 border border-gray-700 rounded-md px-4 py-2 
                file:mr-4 file:rounded-md file:border-0 file:bg-purple-500/20 file:px-4 file:py-2 file:text-white file:font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <input
                type="text"
                placeholder="e.g. Digital artwork, melody, design..."
                className="w-full bg-black/30 border border-gray-700 rounded-md px-4 py-2 placeholder-gray-500 text-white"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="inline-flex items-center text-gray-200 font-medium">
                <input
                  type="checkbox"
                  checked={commercialUse}
                  onChange={() => setCommercialUse(!commercialUse)}
                  className="mr-2 h-4 w-4 rounded border-gray-700 bg-black/30 text-pink-500 transition-all duration-150 ease-in-out focus:ring-2 focus:ring-pink-500"
                />
                Allow Commercial Use
              </label>

              <label className="inline-flex items-center text-gray-200 font-medium">
                <input
                  type="checkbox"
                  checked={derivatives}
                  onChange={() => setDerivatives(!derivatives)}
                  className="mr-2 h-4 w-4 rounded border-gray-700 bg-black/30 text-pink-500 transition-all duration-150 ease-in-out focus:ring-2 focus:ring-pink-500"
                />
                Allow Derivative Works
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">License Expiry</label>
              <input
                type="date"
                placeholder="yyyy-mm-dd"
                className="w-full bg-black/30 border border-gray-700 rounded-md px-4 py-2 placeholder-gray-500 text-white"
                onChange={e => setExpiry(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={processing}
              className={`w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-4 rounded-md hover:brightness-110 transition ${
                processing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {processing ? 'Processing...' : '🚀 Register IP'}
            </button>
          </form>
        )}

        {txHash && (
          <div className="mt-6 p-4 bg-black/30 rounded-lg gradient-border">
            <h3 className="font-bold text-green-400 mb-2">✅ Transaction Submitted</h3>
            <a
              href={`https://basecamp.cloud.blockscout.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 text-sm break-all hover:underline"
            >
              {txHash}
            </a>
          </div>
        )}

        {submitted && file && (
          <div className="mt-6 border-t border-white/10 pt-6 relative z-10">
            <h2 className="text-xl font-bold mb-4 gradient-text">IP Registration Summary</h2>
            <div className="bg-black/30 p-4 rounded-lg">
              <ul className="text-gray-200 space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-400">File:</span>
                  <span>{file.name}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-400">Description:</span>
                  <span>{description}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-400">Commercial Use:</span>
                  <span className={commercialUse ? "text-green-400" : "text-red-400"}>
                    {commercialUse ? 'Allowed' : 'Not allowed'}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-400">Derivatives:</span>
                  <span className={derivatives ? "text-green-400" : "text-red-400"}>
                    {derivatives ? 'Allowed' : 'Not allowed'}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-400">Expiry:</span>
                  <span className="text-blue-400">{expiry || 'Not set'}</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-6 text-center">
              <Link 
                href="/my-assets" 
                className="neo-brutalism inline-block"
              >
                View My Assets
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
