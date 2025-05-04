import axios from 'axios';

const PINATA_GATEWAY = 'https://api.pinata.cloud/pinning';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`
};

export async function uploadToPinata(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axios.post(`${PINATA_GATEWAY}/pinFileToIPFS`, formData, {
    headers: {
      ...headers,
      'Content-Type': 'multipart/form-data'
    }
  });

  return `ipfs://${res.data.IpfsHash}`;
}

export async function uploadMetadataToPinata(metadata: any) {
  const res = await axios.post(`${PINATA_GATEWAY}/pinJSONToIPFS`, metadata, {
    headers
  });

  return `ipfs://${res.data.IpfsHash}`;
}
