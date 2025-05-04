// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IHyperlaneMailbox {
    function dispatch(
        uint32 destinationDomain,
        bytes32 recipientAddress,
        bytes calldata messageBody
    ) external returns (uint256);
}

contract LoanManager is Ownable {
    IHyperlaneMailbox public hyperlaneMailbox;
    uint32 public campDomain; // Camp network domain ID
    bytes32 public collateralManagerAddress; // CollateralManager on Camp

    struct Loan {
        address borrower;
        bytes32 loanId;
        uint256 amount;
        bool active;
    }

    mapping(bytes32 => Loan) public loans;

    function requestLoan(
        address borrower,
        address nftAddress,
        uint256 tokenId,
        uint256 amount
    ) external {
        bytes32 loanId = keccak256(abi.encodePacked(borrower, nftAddress, tokenId, block.timestamp));
        // Send message to Camp to lock NFT
        bytes memory message = abi.encodeWithSignature(
            "lockCollateral(bytes32,address,address,uint256)",
            loanId, borrower, nftAddress, tokenId
        );
        hyperlaneMailbox.dispatch(campDomain, collateralManagerAddress, message);

        loans[loanId] = Loan(borrower, loanId, amount, true);
        // Issue loan (e.g., transfer ERC20 or native token)
    }

    function repayLoan(bytes32 loanId) external payable {
        Loan storage loan = loans[loanId];
        require(loan.active, "Inactive loan");
        require(msg.sender == loan.borrower, "Not borrower");
        // Accept repayment (check amount, etc.)
        loan.active = false;

        // Send message to Camp to release NFT
        bytes memory message = abi.encodeWithSignature(
            "releaseCollateral(bytes32,address)",
            loanId, loan.borrower
        );
        hyperlaneMailbox.dispatch(campDomain, collateralManagerAddress, message);
    }
}