// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract IPRegistry is ERC721, Ownable, IERC2981 {
    uint256 public nextTokenId;
    string public baseURI;

    struct LicenseTerms {
        bool commercialUse;
        bool derivativeWorksAllowed;
        uint256 expiryTimestamp;
    }

    mapping(uint256 => LicenseTerms) public licenses;
    mapping(uint256 => address) public creators;
    mapping(uint256 => string) private tokenURIs;

    uint96 public constant ROYALTY_FEE_BASIS_POINTS = 500; // 5%

    constructor() ERC721("IPRegistry", "IPR") Ownable(msg.sender) {
        baseURI = 'https://sample.com';
    }

    /// @notice Mint a new soulbound IP token with a tokenURI
    function registerIP(
        address to,
        string memory uri,
        bool commercialUse,
        bool derivativeWorksAllowed,
        uint256 expiryTimestamp
    ) external onlyOwner {
        uint256 tokenId = nextTokenId;
        _safeMint(to, tokenId);

        tokenURIs[tokenId] = uri;

        licenses[tokenId] = LicenseTerms({
            commercialUse: commercialUse,
            derivativeWorksAllowed: derivativeWorksAllowed,
            expiryTimestamp: expiryTimestamp
        });

        creators[tokenId] = to;
        nextTokenId++;
    }

    /// @notice Royalties (EIP-2981)
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        require(creators[tokenId] != address(0), "Royalty: nonexistent token");
        royaltyAmount = (salePrice * ROYALTY_FEE_BASIS_POINTS) / 10000;
        return (creators[tokenId], royaltyAmount);
    }

    /// @notice License metadata
    function getLicense(uint256 tokenId) external view returns (LicenseTerms memory) {
        require(creators[tokenId] != address(0), "License: token does not exist");
        return licenses[tokenId];
    }

    /// @notice Return full tokenURI
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(creators[tokenId] != address(0), "Query for nonexistent token");
        return string(abi.encodePacked(baseURI, tokenURIs[tokenId]));
    }

    /// @notice Base metadata URI fallback
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    /// @notice Support for EIP-2981
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
