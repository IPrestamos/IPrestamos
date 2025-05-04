// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@hyperlane-xyz/core/interfaces/IMailbox.sol";

contract CollateralManager {
    address public hyperlaneMailbox;
    address public loanManagerRemote;
    uint32 public loanManagerDomain;

    struct Collateral {
        address owner;
        address nftAddress;
        uint256 tokenId;
        bool locked;
    }

    mapping(bytes32 => Collateral) public collaterals;

    event CollateralLocked(bytes32 loanId, address owner, address nftAddress, uint256 tokenId);
    event CollateralReleased(bytes32 loanId, address owner);

    constructor(address _hyperlaneMailbox, address _loanManagerRemote, uint32 _loanManagerDomain) {
        hyperlaneMailbox = _hyperlaneMailbox;
        loanManagerRemote = _loanManagerRemote;
        loanManagerDomain = _loanManagerDomain;
    }

    modifier onlyHyperlane() {
        require(msg.sender == hyperlaneMailbox, "Not Hyperlane");
        _;
    }

    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _message
    ) external onlyHyperlane {
        require(_origin == loanManagerDomain, "Wrong domain");
        require(_sender == bytes32(uint256(uint160(loanManagerRemote))), "Wrong sender");

        // Decode the function selector
        bytes4 selector;
        assembly {
            selector := calldataload(_message.offset)
        }

        if (selector == bytes4(keccak256("lockCollateral(bytes32,address,address,uint256)"))) {
            (bytes32 loanId, address owner, address nftAddress, uint256 tokenId) = 
                abi.decode(_message[4:], (bytes32, address, address, uint256));
            _lockCollateral(loanId, owner, nftAddress, tokenId);
        } else if (selector == bytes4(keccak256("releaseCollateral(bytes32)"))) {
            bytes32 loanId = abi.decode(_message[4:], (bytes32));
            _releaseCollateral(loanId);
        }
    }

    function _lockCollateral(
        bytes32 loanId,
        address owner,
        address nftAddress,
        uint256 tokenId
    ) internal {
        require(!collaterals[loanId].locked, "Already locked");
        
        // Transfer NFT to this contract
        IERC721(nftAddress).transferFrom(owner, address(this), tokenId);
        
        // Store collateral info
        collaterals[loanId] = Collateral(owner, nftAddress, tokenId, true);
        
        emit CollateralLocked(loanId, owner, nftAddress, tokenId);
    }

    function _releaseCollateral(bytes32 loanId) internal {
        Collateral storage collateral = collaterals[loanId];
        require(collateral.locked, "Not locked");
        
        // Mark as unlocked
        collateral.locked = false;
        
        // Return NFT to owner
        IERC721(collateral.nftAddress).transferFrom(
            address(this),
            collateral.owner,
            collateral.tokenId
        );
        
        emit CollateralReleased(loanId, collateral.owner);
    }
}