import { HyperlaneCore } from '@hyperlane-xyz/sdk';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import '@nomiclabs/hardhat-ethers';

async function main() {
  // Get Hardhat Runtime Environment
  const hre = require('hardhat');
  const { ethers } = hre;

  // Get network information
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);

  // Deploy IP Registry
  console.log('Deploying IP Registry...');
  const IPRegistry = await ethers.getContractFactory('IPRegistry');
  const ipRegistry = await IPRegistry.deploy();
  await ipRegistry.deployed();
  console.log('IP Registry deployed to:', ipRegistry.address);

  // Deploy Loan Manager
  console.log('Deploying Loan Manager...');
  const LoanManager = await ethers.getContractFactory('LoanManager');
  const loanManager = await LoanManager.deploy();
  await loanManager.deployed();
  console.log('Loan Manager deployed to:', loanManager.address);

  // Additional deployment logic...
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 