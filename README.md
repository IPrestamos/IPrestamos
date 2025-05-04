# IP-Backed Lending Protocol

A decentralized lending protocol that enables NFT holders to use their intellectual property as collateral for loans, built during ETHGlobal Camp and deployed on Arbitrum.

## Overview

This protocol enables creators to:
1. Register their intellectual property as NFTs
2. Use these IP NFTs as collateral for loans
3. Manage loan terms and repayments across chains using Hyperlane

## Smart Contracts

### On Camp Chain
- **IP Registry (NFT Contract)**
  - Address: `${CONTRACT_ADDRESS}`
  - Features:
    - Mint soulbound IP tokens
    - Set license terms (commercial use, derivatives)
    - Implement EIP-2981 for royalties
    - Store metadata on Pinata IPFS

- **Collateral Manager**
  - Address: `${COLLATERAL_MANAGER_ADDRESS}`
  - Features:
    - Lock NFT collateral during loan period
    - Release collateral upon loan repayment
    - Cross-chain communication via Hyperlane

### On Arbitrum
- **Loan Manager**
  - Address: `${LOAN_MANAGER_ADDRESS}`
  - Features:
    - Process loan requests
    - Handle loan repayments
    - Calculate interest (5% fixed rate)
    - Cross-chain collateral management

## Architecture

```mermaid
flowchart TD
    User --> IPRegistry[IP Registry]
    User --> LoanManager[Loan Manager]
    LoanManager --> CollateralManager[Collateral Manager]
    CollateralManager --> Hyperlane
    LoanManager --> Hyperlane
    IPRegistry --> Hyperlane
```

## Key Features

- **Cross-chain Lending**: Utilize Hyperlane for secure cross-chain communication
- **IP Registration**: Secure intellectual property registration with customizable license terms
- **Flexible Loan Terms**: Configurable loan amounts and durations
- **Automated Interest**: 5% fixed interest rate calculated based on loan duration
- **Collateral Management**: Automatic locking and release of NFT collateral

## Technical Stack

- **Frontend**: Next.js, RainbowKit, Wagmi
- **Storage**: Pinata IPFS
- **Cross-chain**: Hyperlane Protocol
- **Smart Contracts**: Solidity 0.8.20
- **Development**: Hardhat, TypeScript

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Environment Variables

Create a `.env` file with:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=your_ip_registry_address
NEXT_PUBLIC_LOAN_MANAGER_ADDRESS=your_loan_manager_address
NEXT_PUBLIC_COLLATERAL_MANAGER_ADDRESS=your_collateral_manager_address
```

## Contributing

This project was built during ETHGlobal Camp hackathon. Feel free to submit issues and enhancement requests.

## License

MIT

## Acknowledgments

- ETH 5 de Mayo
- Frutero Club
