'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useContractReads, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESS, ABI } from '@/lib/contract';
import Link from 'next/link';
import Image from 'next/image';
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

export default function MyAssetsContent() {
  const { address, isConnected } = useAccount();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const publicClient = usePublicClient();

  // Get owned token IDs using events
  const [tokenIds, setTokenIds] = useState<bigint[]>([]);

  // Separate useEffect for token ID fetching
  useEffect(() => {
    let mounted = true;

    async function getOwnedTokens() {
      if (!isConnected || !address || !publicClient) {
        console.log('Skipping token fetch - not connected:', { isConnected, hasAddress: !!address, hasClient: !!publicClient });
        return;
      }

      setLoading(true);

      try {
        console.log('Fetching transfer events...');
        
        // Get current block number
        const currentBlock = await publicClient.getBlockNumber();
        // Look back approximately 2 weeks (assuming 2s block time)
        const startBlock = currentBlock - BigInt(604_800);
        
        // Increase chunk size to reduce number of requests
        const CHUNK_SIZE = 50_000;
        const ownedTokens = new Set<bigint>();
        
        // Track processed blocks to avoid duplicates
        const processedBlocks = new Set<string>();
        
        for (let fromBlock = startBlock; fromBlock < currentBlock; fromBlock += BigInt(CHUNK_SIZE)) {
          if (!mounted) return;

          const toBlock = fromBlock + BigInt(CHUNK_SIZE) > currentBlock ? currentBlock : fromBlock + BigInt(CHUNK_SIZE);
          const blockRange = `${fromBlock}-${toBlock}`;
          
          // Skip if we've already processed this block range
          if (processedBlocks.has(blockRange)) {
            console.log(`Skipping already processed block range: ${blockRange}`);
            continue;
          }
          processedBlocks.add(blockRange);
          
          console.log(`Querying blocks ${fromBlock.toString()} to ${toBlock.toString()}`);

          try {
            // Add delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Get both incoming and outgoing transfers in parallel
            const [toEvents, fromEvents] = await Promise.all([
              publicClient.getContractEvents({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: ABI as Abi,
                eventName: 'Transfer',
                args: {
                  to: address as `0x${string}`
                },
                fromBlock: fromBlock,
                toBlock: toBlock
              }),
              publicClient.getContractEvents({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: ABI as Abi,
                eventName: 'Transfer',
                args: {
                  from: address as `0x${string}`
                },
                fromBlock: fromBlock,
                toBlock: toBlock
              })
            ]);

            if (!mounted) return;

            console.log(`Found ${toEvents.length} incoming and ${fromEvents.length} outgoing transfers in this chunk`);
            
            toEvents.forEach(event => {
              const args = event.args as { tokenId: bigint };
              if (args.tokenId) {
                ownedTokens.add(args.tokenId);
              }
            });

            fromEvents.forEach(event => {
              const args = event.args as { tokenId: bigint };
              if (args.tokenId) {
                ownedTokens.delete(args.tokenId);
              }
            });
          } catch (error) {
            console.error(`Error fetching chunk ${fromBlock} to ${toBlock}:`, error);
            // Add longer delay on error before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        }

        if (!mounted) return;

        const tokenIdsArray = Array.from(ownedTokens);
        console.log('Final owned tokens:', tokenIdsArray);
        setTokenIds(tokenIdsArray);
      } catch (error) {
        console.error('Error fetching transfer events:', error);
        if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
          console.error('Error message:', error.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    getOwnedTokens();
    return () => {
      mounted = false;
    };
  }, [isConnected, address, publicClient]); // Only re-run when connection state changes

  // Contract reads for token URIs and licenses
  const { data: tokenInfo, isLoading: isLoadingTokenInfo } = useContractReads({
    contracts: tokenIds.flatMap(tokenId => [
      {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: ABI as Abi,
        functionName: 'tokenURI',
        args: [tokenId],
      },
      {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: ABI as Abi,
        functionName: 'getLicense',
        args: [tokenId],
      }
    ]),
  });

  // Separate useEffect for NFT metadata fetching
  useEffect(() => {
    let mounted = true;

    async function fetchNFTs() {
      if (!isConnected || !address || !tokenIds.length) {
        console.log('Skipping metadata fetch - prerequisites not met:', {
          isConnected,
          hasAddress: !!address,
          tokenIdsLength: tokenIds.length
        });
        return;
      }

      if (!tokenInfo || isLoadingTokenInfo) {
        console.log('Waiting for token info to load...');
        return;
      }

      setLoading(true);
      
      try {
        const nftPromises = tokenIds.map(async (tokenId, index) => {
          if (!mounted) return null;

          console.log(`Processing token ID ${tokenId} at index ${index}`);
          const uri = tokenInfo[index * 2]?.result as string;
          const license = tokenInfo[index * 2 + 1]?.result as LicenseTerms;

          console.log('Token URI:', uri);
          console.log('License:', license);

          if (!uri || !license) {
            console.log(`Missing uri or license for token ${tokenId}`);
            return null;
          }

          try {
            // Fetch metadata from IPFS
            const metadataUrl = convertIpfsUrl(uri);
            console.log('Fetching metadata from:', metadataUrl);
            const response = await fetch(metadataUrl);
            const metadata = await response.json();
            console.log('Received metadata:', metadata);
            
            if (!mounted) return null;

            // Convert the nested image URL
            const imageUrl = convertIpfsUrl(metadata.image);
            console.log('Converted image URL:', imageUrl);

            return {
              id: Number(tokenId),
              name: metadata.name,
              description: metadata.description,
              image: imageUrl,
              commercialUse: license.commercialUse,
              derivativeWorks: license.derivativeWorksAllowed,
              expiry: new Date(Number(license.expiryTimestamp) * 1000).toISOString().split('T')[0],
              mediaType: getMediaType(metadata.name)
            };
          } catch (error) {
            console.error(`Error fetching metadata for token ${tokenId}:`, error);
            return null;
          }
        });

        if (!mounted) return;

        const fetchedNfts = (await Promise.all(nftPromises)).filter(Boolean) as NFT[];
        console.log('Final fetched NFTs:', fetchedNfts);
        
        if (mounted) {
          setNfts(fetchedNfts);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in fetchNFTs:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchNFTs();
    return () => {
      mounted = false;
    };
  }, [isConnected, address, tokenIds, tokenInfo, isLoadingTokenInfo]);

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="glassmorphism p-10 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold gradient-text mb-6">My IP Assets</h1>
          <p className="mb-8 text-gray-300">Connect your wallet to view your assets</p>
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
          <p className="mb-6 text-gray-300">You don&apos;t have any registered IP assets yet.</p>
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
                    {nft.mediaType === 'image' ? (
                      <Image 
                        src={nft.image} 
                        alt={nft.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-110"
                      />
                    ) : (
                      <video 
                        src={nft.image}
                        controls
                        className="w-full h-full object-cover"
                        poster={nft.image.replace(/\.[^/.]+$/, '_thumbnail.jpg')}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
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