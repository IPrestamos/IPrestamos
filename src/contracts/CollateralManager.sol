// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CollateralManager is Ownable {
    address public hyperlaneMailbox; // Hyperlane mailbox contract address
    address public loanManagerRemote; // LoanManager contract on Arbitrum/Scroll

    struct Collateral {
        address owner;
        address nftAddress;
        uint256 tokenId;
        bool locked;
    }

    mapping(bytes32 => Collateral) public collaterals; // Use a unique ID per loan

    modifier onlyHyperlane() {
        require(msg.sender == hyperlaneMailbox, "Not Hyperlane");
        _;
    }

    // Called by Hyperlane when a loan is requested
    function lockCollateral(
        bytes32 loanId,
        address owner,
        address nftAddress,
        uint256 tokenId
    ) external onlyHyperlane {
        IERC721(nftAddress).transferFrom(owner, address(this), tokenId);
        collaterals[loanId] = Collateral(owner, nftAddress, tokenId, true);
    }

    // Called by Hyperlane when loan is repaid or liquidated
    function releaseCollateral(bytes32 loanId, address to) external onlyHyperlane {
        Collateral storage c = collaterals[loanId];
        require(c.locked, "Not locked");
        c.locked = false;
        IERC721(c.nftAddress).transferFrom(address(this), to, c.tokenId);
    }
}