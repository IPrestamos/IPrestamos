// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@hyperlane-xyz/core/interfaces/IMailbox.sol";

contract LoanManager {
    IMailbox public hyperlaneMailbox;
    uint32 public campDomain;
    bytes32 public collateralManagerAddress;

    struct Loan {
        address borrower;
        uint256 amount;
        uint256 dueDate;
        uint256 interestRate; // In basis points (1% = 100)
        bool active;
    }

    mapping(bytes32 => Loan) public loans;

    event LoanRequested(bytes32 loanId, address borrower, uint256 amount);
    event LoanRepaid(bytes32 loanId, address borrower);

    constructor(
        address _hyperlaneMailbox,
        uint32 _campDomain,
        address _collateralManager
    ) {
        hyperlaneMailbox = IMailbox(_hyperlaneMailbox);
        campDomain = _campDomain;
        collateralManagerAddress = bytes32(uint256(uint160(_collateralManager)));
    }

    function requestLoan(
        address nftAddress,
        uint256 tokenId,
        uint256 amount,
        uint256 duration // Duration in days
    ) external payable returns (bytes32) {
        require(amount > 0, "Amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");

        // Calculate loan ID
        bytes32 loanId = keccak256(
            abi.encodePacked(
                msg.sender,
                nftAddress,
                tokenId,
                amount,
                block.timestamp
            )
        );

        // Create loan
        loans[loanId] = Loan({
            borrower: msg.sender,
            amount: amount,
            dueDate: block.timestamp + (duration * 1 days),
            interestRate: 500, // 5% fixed interest rate
            active: true
        });

        // Send message to Camp to lock NFT
        bytes memory message = abi.encodeWithSignature(
            "lockCollateral(bytes32,address,address,uint256)",
            loanId,
            msg.sender,
            nftAddress,
            tokenId
        );

        hyperlaneMailbox.dispatch(
            campDomain,
            collateralManagerAddress,
            message
        );

        // Transfer loan amount to borrower
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send loan amount");

        emit LoanRequested(loanId, msg.sender, amount);
        return loanId;
    }

    function repayLoan(bytes32 loanId) external payable {
        Loan storage loan = loans[loanId];
        require(loan.active, "Loan not active");
        require(msg.sender == loan.borrower, "Not the borrower");

        // Calculate repayment amount with interest
        uint256 interest = (loan.amount * loan.interestRate * 
            (block.timestamp - (loan.dueDate - 30 days))) / (10000 * 365 days);
        uint256 totalRepayment = loan.amount + interest;
        
        require(msg.value >= totalRepayment, "Insufficient repayment amount");

        // Mark loan as inactive
        loan.active = false;

        // Send message to Camp to release NFT
        bytes memory message = abi.encodeWithSignature(
            "releaseCollateral(bytes32)",
            loanId
        );

        hyperlaneMailbox.dispatch(
            campDomain,
            collateralManagerAddress,
            message
        );

        emit LoanRepaid(loanId, msg.sender);

        // Return excess payment if any
        if (msg.value > totalRepayment) {
            (bool sent, ) = msg.sender.call{value: msg.value - totalRepayment}("");
            require(sent, "Failed to return excess payment");
        }
    }

    // View function to get loan details
    function getLoan(bytes32 loanId) external view returns (
        address borrower,
        uint256 amount,
        uint256 dueDate,
        uint256 interestRate,
        bool active
    ) {
        Loan storage loan = loans[loanId];
        return (
            loan.borrower,
            loan.amount,
            loan.dueDate,
            loan.interestRate,
            loan.active
        );
    }

    // Function to calculate current repayment amount
    function getRepaymentAmount(bytes32 loanId) external view returns (uint256) {
        Loan storage loan = loans[loanId];
        require(loan.active, "Loan not active");
        
        uint256 interest = (loan.amount * loan.interestRate * 
            (block.timestamp - (loan.dueDate - 30 days))) / (10000 * 365 days);
        return loan.amount + interest;
    }

    receive() external payable {}
}