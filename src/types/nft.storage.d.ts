declare module 'nft.storage' {
  export class NFTStorage {
    constructor(options: { token: string });
    store(metadata: any): Promise<any>;
  }
  
  export class File extends Blob {
    constructor(data: Uint8Array[], name: string, options?: { type: string });
    name: string;
  }
} 