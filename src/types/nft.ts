export interface NFT {
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