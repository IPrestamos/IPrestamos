import { HyperlaneCore } from '@hyperlane-xyz/sdk';
import { ethers } from 'hardhat';

async function main() {
  // Get network information
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);

  // Hyperlane configuration
  const campDomain = 1234; // Replace with actual Camp Network domain ID
  const scrollDomain = 5678; // Replace with actual Scroll domain ID

  // Deploy on Camp Network
  console.log('Deploying CollateralManager...');
  const CollateralManager = await ethers.getContractFactory('CollateralManager');
  const collateralManager = await CollateralManager.deploy(
    process.env.CAMP_HYPERLANE_MAILBOX,
    process.env.SCROLL_LOAN_MANAGER, // Will be updated after LoanManager deployment
    scrollDomain
  );
  await collateralManager.deployed();
  console.log('CollateralManager deployed to:', collateralManager.address);

  // Deploy on Scroll
  console.log('Deploying LoanManager...');
  const LoanManager = await ethers.getContractFactory('LoanManager');
  const loanManager = await LoanManager.deploy(
    process.env.SCROLL_HYPERLANE_MAILBOX,
    campDomain,
    collateralManager.address
  );
  await loanManager.deployed();
  console.log('LoanManager deployed to:', loanManager.address);

  // Update CollateralManager with LoanManager address
  const collateralManagerContract = CollateralManager.attach(collateralManager.address);
  await collateralManagerContract.setLoanManagerRemote(loanManager.address);
  console.log('Updated CollateralManager with LoanManager address');

  console.log('Deployment complete!');
  console.log({
    CollateralManager: collateralManager.address,
    LoanManager: loanManager.address,
    CampDomain: campDomain,
    ScrollDomain: scrollDomain
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 