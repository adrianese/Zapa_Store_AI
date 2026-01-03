// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Zstore Marketplace
 * @dev A simple marketplace for selling goods with an escrow system.
 */
contract Marketplace is ReentrancyGuard, Ownable {
    uint256 private _itemIds;
    uint256 private _itemsSold;

    address payable private _feeAccount;
    uint256 public platformFeePercent; // e.g., 5 for 5%

    struct Item {
        uint256 id;
        address payable seller;
        address payable buyer;
        uint256 price;
        State state;
        // Reference to off-chain product details (e.g., SKU or IPFS hash)
        string externalId; 
    }

    enum State {
        Created,
        Locked, // Purchased and in escrow
        Released, // Buyer confirmed reception
        Disputed,
        Resolved
    }

    mapping(uint256 => Item) public items;
    mapping(address => uint256) public pendingWithdrawals;

    event ItemCreated(
        uint256 indexed id,
        address indexed seller,
        uint256 price,
        string externalId
    );
    event ItemPurchased(uint256 indexed id, address indexed buyer);
    event ItemShipped(uint256 indexed id); // Placeholder, logic can be added
    event FundsReleased(uint256 indexed id, address seller, uint256 amount);
    event FundsRefunded(uint256 indexed id, address buyer, uint256 amount);
    event FeeAccountUpdated(address indexed newAccount);
    event PlatformFeeUpdated(uint256 indexed newFee);

    constructor(address payable initialFeeAccount, uint256 initialFeePercent) Ownable(msg.sender) {
        require(initialFeeAccount != address(0), "Fee account cannot be zero address");
        require(initialFeePercent <= 100, "Fee cannot exceed 100%");
        _feeAccount = initialFeeAccount;
        platformFeePercent = initialFeePercent;
    }

    function updateFeeAccount(address payable newAccount) external onlyOwner {
        require(newAccount != address(0), "New fee account cannot be zero");
        _feeAccount = newAccount;
        emit FeeAccountUpdated(newAccount);
    }
    
    function updatePlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 100, "Fee cannot exceed 100%");
        platformFeePercent = newFeePercent;
        emit PlatformFeeUpdated(newFeePercent);
    }

    function createItem(uint256 price, string calldata externalId) external {
        _itemIds++;
        uint256 itemId = _itemIds;

        items[itemId] = Item(
            itemId,
            payable(msg.sender),
            payable(address(0)),
            price,
            State.Created,
            externalId
        );

        emit ItemCreated(itemId, msg.sender, price, externalId);
    }
    
    function purchaseItem(uint256 id) external payable nonReentrant {
        Item storage item = items[id];

        require(item.id != 0, "Item does not exist");
        require(item.state == State.Created, "Item is not available for purchase");
        require(msg.value == item.price, "Incorrect payment amount");

        item.buyer = payable(msg.sender);
        item.state = State.Locked;

        emit ItemPurchased(id, msg.sender);
    }
    
    function confirmReception(uint256 id) external nonReentrant {
        Item storage item = items[id];

        require(item.state == State.Locked, "Item not in a state to be confirmed");
        require(msg.sender == item.buyer, "Only the buyer can confirm reception");

        uint256 platformFee = (item.price * platformFeePercent) / 100;
        uint256 sellerProceeds = item.price - platformFee;

        pendingWithdrawals[_feeAccount] += platformFee;
        pendingWithdrawals[item.seller] += sellerProceeds;

        item.state = State.Released;
        _itemsSold++;

        emit FundsReleased(id, item.seller, sellerProceeds);
    }

    function raiseDispute(uint256 id) external {
        Item storage item = items[id];

        require(item.state == State.Locked, "Can only dispute a locked item");
        require(msg.sender == item.buyer, "Only the buyer can raise a dispute");

        item.state = State.Disputed;
    }

    function resolveDispute(uint256 id, bool refundToBuyer) external onlyOwner nonReentrant {
        Item storage item = items[id];
        require(item.state == State.Disputed, "Item is not in dispute");

        if (refundToBuyer) {
            // Refund the full amount to the buyer
            pendingWithdrawals[item.buyer] += item.price;
            emit FundsRefunded(id, item.buyer, item.price);
        } else {
            // Process the sale as normal
            uint256 platformFee = (item.price * platformFeePercent) / 100;
            uint256 sellerProceeds = item.price - platformFee;

            pendingWithdrawals[_feeAccount] += platformFee;
            pendingWithdrawals[item.seller] += sellerProceeds;
            
            _itemsSold++;
            emit FundsReleased(id, item.seller, sellerProceeds);
        }

        item.state = State.Resolved;
    }

    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");

        // Zero the balance before the transfer to prevent reentrancy
        pendingWithdrawals[msg.sender] = 0;

        payable(msg.sender).transfer(amount);
    }
}
