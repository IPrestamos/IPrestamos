declare module 'nft.storage' {
  export class NFTStorage {
    constructor(config: { token: string });
    store(metadata: NFTMetadata): Promise<{ url: string; data: NFTMetadata }>;
  }

  export interface NFTMetadata {
    name: string;
    description: string;
    image: File | Blob;
    properties?: Record<string, unknown>;
  }

  export class File extends Blob {
    name: string;
    lastModified: number;
    constructor(
      fileBits: BlobPart[],
      fileName: string,
      options?: FilePropertyBag
    );
  }
} 