# ZStore Smart Contracts

Smart contracts for the ZStore marketplace and auction system, built with Solidity and Hardhat.

## Contracts

### Marketplace.sol
A marketplace contract with escrow functionality for secure transactions.

**Features:**
- Create listings with external product references
- Secure purchase with escrow
- Buyer confirmation before fund release
- Dispute resolution system
- Platform fee collection

### Auction.sol
An advanced auction contract with anti-sniping protection and withdraw pattern.

**Features:**
- **English Auction (Incremental)**: Each bid must exceed the current highest bid
- **Withdraw Pattern**: Secure fund management - outbid users must call `withdraw()` (prevents reentrancy)
- **1% Outbid Penalty**: When outbid, users receive 99% back; 1% goes to fee pool
- **Increase Bid**: Highest bidder can add more ETH without penalty via `increaseBid()`
- **Anti-sniping**: Auto-extends time if bids placed in final 5 minutes
- **Configurable minimum bid increment** (default 5%)
- **Optional deposit system** for serious bidders
- **Reserve price support**
- **Complete bid history tracking**
- **Fee pool** for accumulated penalties (admin can withdraw)

## Setup

1. Install dependencies:
```bash
cd contracts
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure your `.env` file with:
   - `PRIVATE_KEY`: Your deployer wallet private key
   - `SEPOLIA_RPC_URL`: RPC URL for Sepolia testnet
   - `MAINNET_RPC_URL`: RPC URL for Ethereum mainnet
   - `ETHERSCAN_API_KEY`: For contract verification
   - `PLATFORM_WALLET`: Address to receive platform fees
   - `PLATFORM_FEE_BPS`: Platform fee in basis points (250 = 2.5%)

## Commands

### Compile Contracts
```bash
npm run compile
```

### Run Tests
```bash
npm test
```

### Start Local Node
```bash
npm run node
```

### Deploy

**Local (Hardhat Network):**
```bash
npm run deploy:local
```

**Sepolia Testnet:**
```bash
npm run deploy:sepolia
```

**Ethereum Mainnet:**
```bash
npm run deploy:mainnet
```

## Contract Architecture

### Marketplace Flow
1. Seller creates listing → `createItem(price, externalId)`
2. Buyer purchases → `purchaseItem(itemId)` (funds held in escrow)
3. Buyer receives goods and confirms → `confirmReception(itemId)`
4. Funds distributed to seller (minus platform fee)
5. If dispute: `raiseDispute(itemId)` → Owner resolves

### Auction Flow
1. Seller creates auction → `createAuction(params)`
2. Bidders place bids → `placeBid(auctionId)` (previous bid gets 99%, 1% penalty)
3. Highest bidder can increase → `increaseBid(auctionId)` (no penalty)
4. Anti-sniping: Bids in last 5 minutes extend auction by 5 minutes
5. Auction ends → `endAuction(auctionId)`
6. Winner claims prize → `claimPrize(auctionId)`
7. Outbid users withdraw → `withdraw()` (gets their 99%)
8. Admin withdraws fees → `withdrawFeePool()` (accumulated 1% penalties)

## Security Features

- **ReentrancyGuard**: Protection against reentrancy attacks
- **Ownable**: Admin functions restricted to contract owner
- **Pull over Push**: Users withdraw funds to prevent stuck ETH
- **Input Validation**: Comprehensive checks on all inputs

## Testing

The contracts include comprehensive test suites covering:
- Deployment verification
- Happy path scenarios
- Edge cases
- Permission checks
- Anti-sniping behavior
- Fund distribution

Run tests with coverage:
```bash
npx hardhat coverage
```

## Gas Optimization

Contracts are optimized with:
- Solidity optimizer (200 runs)
- viaIR compilation for better optimization
- Efficient storage patterns

## License

MIT
