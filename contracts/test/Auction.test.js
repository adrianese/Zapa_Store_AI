const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Auction", function () {
  let auction;
  let owner;
  let seller;
  let bidder1;
  let bidder2;
  let bidder3;
  let platformWallet;
  
  const PLATFORM_FEE_PERCENT = 5; // 5%
  const ONE_ETH = ethers.parseEther("1");
  const TWO_ETH = ethers.parseEther("2");
  const DEPOSIT_AMOUNT = ethers.parseEther("0.1");
  const ONE_HOUR = 3600;
  const ONE_DAY = 86400;
  
  // Helper function to create auction with new signature (8 params)
  async function createAuction(
    signerAccount,
    externalId = "product-123",
    startingPrice = ONE_ETH,
    reservePrice = ONE_ETH,
    duration = ONE_DAY,
    depositRequired = 0,
    startImmediately = true,
    customMinBidIncrement = 0,
    customMinBidIncrementPct = 0
  ) {
    return auction.connect(signerAccount).createAuction(
      externalId,
      startingPrice,
      reservePrice,
      duration,
      depositRequired,
      startImmediately,
      customMinBidIncrement,
      customMinBidIncrementPct
    );
  }
  
  beforeEach(async function () {
    [owner, seller, bidder1, bidder2, bidder3, platformWallet] = await ethers.getSigners();
    
    const Auction = await ethers.getContractFactory("Auction");
    auction = await Auction.deploy(platformWallet.address, PLATFORM_FEE_PERCENT);
    await auction.waitForDeployment();
  });
  
  describe("Deployment", function () {
    it("Should set the correct platform fee", async function () {
      expect(await auction.platformFeePercent()).to.equal(PLATFORM_FEE_PERCENT);
    });
    
    it("Should set the correct owner", async function () {
      expect(await auction.owner()).to.equal(owner.address);
    });
    
    it("Should set default anti-sniping window (5 min)", async function () {
      expect(await auction.antiSnipingWindow()).to.equal(300);
    });
    
    it("Should set default min bid increment percent (5%)", async function () {
      expect(await auction.minBidIncrementPercent()).to.equal(5);
    });
    
    it("Should set default min absolute bid increment (0.005 ETH)", async function () {
      expect(await auction.minAbsoluteBidIncrement()).to.equal(ethers.parseEther("0.005"));
    });
    
    it("Should set default outbid penalty (1%)", async function () {
      expect(await auction.outbidPenaltyPercent()).to.equal(1);
    });
    
    it("Should start with zero fee pool", async function () {
      expect(await auction.getFeePool()).to.equal(0);
    });
  });
  
  describe("Create Auction", function () {
    it("Should create an auction successfully with all parameters", async function () {
      await expect(
        createAuction(seller)
      ).to.emit(auction, "AuctionCreated");
    });
    
    it("Should create auction with custom min bid increments", async function () {
      const customAbsolute = ethers.parseEther("0.1"); // 0.1 ETH min
      const customPercent = 10; // 10%
      
      await createAuction(
        seller,
        "custom-product",
        ONE_ETH,
        ONE_ETH,
        ONE_DAY,
        0,
        true,
        customAbsolute,
        customPercent
      );
      
      const auctionData = await auction.auctions(1);
      expect(auctionData.minBidIncrement).to.equal(customAbsolute);
      expect(auctionData.minBidIncrementPct).to.equal(customPercent);
    });
    
    it("Should create auction using createAuctionSimple (uses globals)", async function () {
      await expect(
        auction.connect(seller).createAuctionSimple(
          "simple-product",
          ONE_ETH,
          ONE_ETH,
          ONE_DAY,
          0,
          true
        )
      ).to.emit(auction, "AuctionCreated");
      
      // Should use 0 which means "use global"
      const auctionData = await auction.auctions(1);
      expect(auctionData.minBidIncrement).to.equal(0);
      expect(auctionData.minBidIncrementPct).to.equal(0);
    });
    
    it("Should fail if duration is too short", async function () {
      await expect(
        createAuction(seller, "product", ONE_ETH, ONE_ETH, 300) // 5 min - too short
      ).to.be.revertedWith("Duration must be at least 1 hour");
    });
    
    it("Should fail if duration is too long", async function () {
      const thirtyOneDays = 31 * ONE_DAY;
      await expect(
        createAuction(seller, "product", ONE_ETH, ONE_ETH, thirtyOneDays)
      ).to.be.revertedWith("Duration cannot exceed 30 days");
    });
    
    it("Should fail if reserve price is below starting price", async function () {
      await expect(
        createAuction(seller, "product", ONE_ETH, ethers.parseEther("0.5"))
      ).to.be.revertedWith("Reserve must be >= starting price");
    });
  });
  
  describe("Bidding - Basic", function () {
    let auctionId;
    
    beforeEach(async function () {
      await createAuction(seller);
      auctionId = 1;
    });
    
    it("Should accept a valid first bid at starting price", async function () {
      await expect(
        auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH })
      ).to.emit(auction, "BidPlaced");
    });
    
    it("Should accept a valid first bid above starting price", async function () {
      const bidAmount = ethers.parseEther("1.5");
      await expect(
        auction.connect(bidder1).placeBid(auctionId, { value: bidAmount })
      ).to.emit(auction, "BidPlaced");
    });
    
    it("Should reject bid below starting price", async function () {
      const bidAmount = ethers.parseEther("0.5");
      await expect(
        auction.connect(bidder1).placeBid(auctionId, { value: bidAmount })
      ).to.be.revertedWith("Bid too low");
    });
    
    it("Should track bid count correctly", async function () {
      await auction.connect(bidder1).placeBid(auctionId, { value: ethers.parseEther("1.1") });
      await auction.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("1.5") });
      await auction.connect(bidder1).placeBid(auctionId, { value: ethers.parseEther("2.0") });
      
      const auctionData = await auction.auctions(auctionId);
      expect(auctionData.bidCount).to.equal(3);
    });
    
    it("Should update highest bidder correctly", async function () {
      await auction.connect(bidder1).placeBid(auctionId, { value: ethers.parseEther("1.1") });
      let auctionData = await auction.auctions(auctionId);
      expect(auctionData.highestBidder).to.equal(bidder1.address);
      
      await auction.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("1.5") });
      auctionData = await auction.auctions(auctionId);
      expect(auctionData.highestBidder).to.equal(bidder2.address);
    });
    
    it("Should not allow seller to bid on own auction", async function () {
      await expect(
        auction.connect(seller).placeBid(auctionId, { value: ONE_ETH })
      ).to.be.revertedWith("Seller cannot bid");
    });
  });
  
  describe("Minimum Bid Increment - Percentage Based", function () {
    let auctionId;
    
    beforeEach(async function () {
      // Auction with 5% increment and very low absolute (to test percentage)
      await auction.connect(owner).updateMinAbsoluteBidIncrement(1); // 1 wei
      await createAuction(seller);
      auctionId = 1;
    });
    
    it("Should reject bid below 5% increment", async function () {
      // First bid at 1 ETH
      await auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH });
      
      // Second bid must be >= 1.05 ETH (5% increment)
      // Try 1.02 ETH - should fail
      await expect(
        auction.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("1.02") })
      ).to.be.revertedWith("Bid too low");
    });
    
    it("Should accept bid at exactly 5% increment", async function () {
      await auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH });
      
      // 1 ETH + 5% = 1.05 ETH
      await expect(
        auction.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("1.05") })
      ).to.emit(auction, "BidPlaced");
    });
    
    it("Should accept bid above 5% increment", async function () {
      await auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH });
      
      await expect(
        auction.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("1.5") })
      ).to.emit(auction, "BidPlaced");
    });
  });
  
  describe("Minimum Bid Increment - Absolute Based (Anti Micro-Bid)", function () {
    let auctionId;
    
    beforeEach(async function () {
      // Set high absolute minimum (0.1 ETH ~$400) to test absolute takes precedence
      await auction.connect(owner).updateMinAbsoluteBidIncrement(ethers.parseEther("0.1"));
      await createAuction(seller);
      auctionId = 1;
    });
    
    it("Should use absolute minimum when it's higher than percentage", async function () {
      // First bid at 1 ETH
      await auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH });
      
      // 5% of 1 ETH = 0.05 ETH
      // Absolute minimum = 0.1 ETH
      // Should require 0.1 ETH increment (the higher one)
      
      // Try 1.05 ETH (5% increment) - should fail because absolute is 0.1
      await expect(
        auction.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("1.05") })
      ).to.be.revertedWith("Bid too low");
      
      // Try 1.09 ETH - still too low
      await expect(
        auction.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("1.09") })
      ).to.be.revertedWith("Bid too low");
      
      // 1.1 ETH should work (1 + 0.1)
      await expect(
        auction.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("1.1") })
      ).to.emit(auction, "BidPlaced");
    });
    
    it("Should use percentage when it's higher than absolute", async function () {
      // First bid at 10 ETH
      await auction.connect(bidder1).placeBid(auctionId, { value: ethers.parseEther("10") });
      
      // 5% of 10 ETH = 0.5 ETH
      // Absolute minimum = 0.1 ETH
      // Should require 0.5 ETH increment (percentage is higher)
      
      // Try 10.2 ETH - should fail
      await expect(
        auction.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("10.2") })
      ).to.be.revertedWith("Bid too low");
      
      // 10.5 ETH should work
      await expect(
        auction.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("10.5") })
      ).to.emit(auction, "BidPlaced");
    });
    
    it("Should prevent micro bids effectively", async function () {
      // Absolute minimum is 0.1 ETH (~$400)
      await auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH });
      
      // Micro bid of 0.001 ETH (~$4) increment should fail
      await expect(
        auction.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("1.001") })
      ).to.be.revertedWith("Bid too low");
      
      // Even 0.05 ETH (~$200) increment should fail
      await expect(
        auction.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("1.05") })
      ).to.be.revertedWith("Bid too low");
    });
  });
  
  describe("Custom Per-Auction Minimum Increments", function () {
    it("Should use auction-specific absolute minimum over global", async function () {
      // Global is 0.005 ETH
      // Create auction with custom 0.2 ETH minimum
      await createAuction(
        seller,
        "high-value-item",
        ONE_ETH,
        ONE_ETH,
        ONE_DAY,
        0,
        true,
        ethers.parseEther("0.2"), // 0.2 ETH custom absolute
        0 // use global percentage
      );
      
      await auction.connect(bidder1).placeBid(1, { value: ONE_ETH });
      
      // Try 1.1 ETH (0.1 increment) - should fail
      await expect(
        auction.connect(bidder2).placeBid(1, { value: ethers.parseEther("1.1") })
      ).to.be.revertedWith("Bid too low");
      
      // 1.2 ETH should work
      await expect(
        auction.connect(bidder2).placeBid(1, { value: ethers.parseEther("1.2") })
      ).to.emit(auction, "BidPlaced");
    });
    
    it("Should use auction-specific percentage minimum over global", async function () {
      // Global is 5%
      // Create auction with custom 15% minimum
      await createAuction(
        seller,
        "premium-item",
        ONE_ETH,
        ONE_ETH,
        ONE_DAY,
        0,
        true,
        0, // use global absolute
        15 // 15% custom percentage
      );
      
      await auction.connect(bidder1).placeBid(1, { value: ONE_ETH });
      
      // Try 1.1 ETH (10% increment) - should fail
      await expect(
        auction.connect(bidder2).placeBid(1, { value: ethers.parseEther("1.1") })
      ).to.be.revertedWith("Bid too low");
      
      // 1.15 ETH should work (15%)
      await expect(
        auction.connect(bidder2).placeBid(1, { value: ethers.parseEther("1.15") })
      ).to.emit(auction, "BidPlaced");
    });
    
    it("Should use both custom values when set", async function () {
      // Create auction with custom 0.3 ETH absolute and 20% percentage
      await createAuction(
        seller,
        "super-premium",
        ONE_ETH,
        ONE_ETH,
        ONE_DAY,
        0,
        true,
        ethers.parseEther("0.3"), // 0.3 ETH custom
        20 // 20% custom
      );
      
      await auction.connect(bidder1).placeBid(1, { value: ONE_ETH });
      
      // 20% of 1 ETH = 0.2 ETH
      // Absolute = 0.3 ETH
      // Should require 0.3 ETH (higher)
      
      await expect(
        auction.connect(bidder2).placeBid(1, { value: ethers.parseEther("1.25") })
      ).to.be.revertedWith("Bid too low");
      
      await expect(
        auction.connect(bidder2).placeBid(1, { value: ethers.parseEther("1.3") })
      ).to.emit(auction, "BidPlaced");
    });
  });
  
  describe("getMinBidInfo View Function", function () {
    it("Should return correct min bid info for first bid", async function () {
      await createAuction(seller);
      
      const info = await auction.getMinBidInfo(1);
      expect(info.minBidRequired).to.equal(ONE_ETH); // Starting price
    });
    
    it("Should return correct min bid info after bids", async function () {
      await auction.connect(owner).updateMinAbsoluteBidIncrement(ethers.parseEther("0.1"));
      await createAuction(seller);
      await auction.connect(bidder1).placeBid(1, { value: ONE_ETH });
      
      const info = await auction.getMinBidInfo(1);
      
      // 5% of 1 ETH = 0.05 ETH
      // Absolute = 0.1 ETH
      // Should be 1.1 ETH (1 + max(0.05, 0.1))
      expect(info.minBidRequired).to.equal(ethers.parseEther("1.1"));
      expect(info.percentIncrement).to.equal(ethers.parseEther("0.05"));
      expect(info.absoluteIncrement).to.equal(ethers.parseEther("0.1"));
    });
    
    it("Should return correct info with custom auction settings", async function () {
      await createAuction(
        seller,
        "custom",
        ONE_ETH,
        ONE_ETH,
        ONE_DAY,
        0,
        true,
        ethers.parseEther("0.5"), // 0.5 ETH custom
        10 // 10% custom
      );
      
      await auction.connect(bidder1).placeBid(1, { value: ONE_ETH });
      
      const info = await auction.getMinBidInfo(1);
      expect(info.pctUsed).to.equal(10); // Custom 10%
      expect(info.absUsed).to.equal(ethers.parseEther("0.5")); // Custom 0.5 ETH
    });
  });
  
  describe("getMinBidAmount View Function", function () {
    it("Should return starting price for no bids", async function () {
      await createAuction(seller);
      expect(await auction.getMinBidAmount(1)).to.equal(ONE_ETH);
    });
    
    it("Should return correct amount after bid", async function () {
      await auction.connect(owner).updateMinAbsoluteBidIncrement(1); // 1 wei
      await createAuction(seller);
      await auction.connect(bidder1).placeBid(1, { value: ONE_ETH });
      
      // Should be 1.05 ETH (5% increment)
      expect(await auction.getMinBidAmount(1)).to.equal(ethers.parseEther("1.05"));
    });
  });
  
  describe("Anti-Sniping", function () {
    let auctionId;
    
    beforeEach(async function () {
      await createAuction(seller, "product", ONE_ETH, ONE_ETH, ONE_HOUR);
      auctionId = 1;
    });
    
    it("Should extend auction when bid placed in anti-sniping window", async function () {
      // Fast forward to last 3 minutes (within 5 min window)
      await ethers.provider.send("evm_increaseTime", [ONE_HOUR - 180]);
      await ethers.provider.send("evm_mine");
      
      const auctionBefore = await auction.auctions(auctionId);
      
      await auction.connect(bidder1).placeBid(auctionId, { value: ethers.parseEther("1.1") });
      
      const auctionAfter = await auction.auctions(auctionId);
      expect(auctionAfter.endTime).to.be.gt(auctionBefore.endTime);
    });
    
    it("Should emit AuctionExtended event", async function () {
      await ethers.provider.send("evm_increaseTime", [ONE_HOUR - 180]);
      await ethers.provider.send("evm_mine");
      
      await expect(
        auction.connect(bidder1).placeBid(auctionId, { value: ethers.parseEther("1.1") })
      ).to.emit(auction, "AuctionExtended");
    });
    
    it("Should not extend when bid placed outside anti-sniping window", async function () {
      const auctionBefore = await auction.auctions(auctionId);
      
      await auction.connect(bidder1).placeBid(auctionId, { value: ethers.parseEther("1.1") });
      
      const auctionAfter = await auction.auctions(auctionId);
      expect(auctionAfter.endTime).to.equal(auctionBefore.endTime);
    });
  });
  
  describe("Outbid Penalty (1%)", function () {
    let auctionId;
    
    beforeEach(async function () {
      await createAuction(seller);
      auctionId = 1;
    });
    
    it("Should apply 1% penalty when outbid", async function () {
      await auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH });
      await auction.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("1.5") });
      
      // Bidder1 should have 99% in pending withdrawals
      const pending = await auction.pendingWithdrawals(bidder1.address);
      const expected = ONE_ETH * BigInt(99) / BigInt(100);
      expect(pending).to.equal(expected);
    });
    
    it("Should accumulate penalty in feePool", async function () {
      await auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH });
      await auction.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("1.5") });
      
      const feePool = await auction.getFeePool();
      const expected = ONE_ETH / BigInt(100); // 1%
      expect(feePool).to.equal(expected);
    });
    
    it("Should emit OutbidPenaltyApplied event", async function () {
      await auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH });
      
      const expectedPenalty = ONE_ETH / BigInt(100);
      
      await expect(
        auction.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("1.5") })
      ).to.emit(auction, "OutbidPenaltyApplied")
        .withArgs(auctionId, bidder1.address, expectedPenalty);
    });
    
    it("Should accumulate penalties from multiple outbids", async function () {
      await auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH });
      await auction.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("1.5") });
      await auction.connect(bidder3).placeBid(auctionId, { value: TWO_ETH });
      
      // Fee pool should have 1% of 1 ETH + 1% of 1.5 ETH
      const feePool = await auction.getFeePool();
      const expected = ONE_ETH / BigInt(100) + ethers.parseEther("1.5") / BigInt(100);
      expect(feePool).to.equal(expected);
    });
  });
  
  describe("Withdraw Pattern", function () {
    let auctionId;
    
    beforeEach(async function () {
      await createAuction(seller);
      auctionId = 1;
    });
    
    it("Should allow outbid user to withdraw funds", async function () {
      await auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH });
      await auction.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("1.5") });
      
      const balanceBefore = await ethers.provider.getBalance(bidder1.address);
      
      const tx = await auction.connect(bidder1).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(bidder1.address);
      const expectedRefund = ONE_ETH * BigInt(99) / BigInt(100);
      
      expect(balanceAfter + gasUsed - balanceBefore).to.equal(expectedRefund);
    });
    
    it("Should clear pending withdrawals after withdraw", async function () {
      await auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH });
      await auction.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("1.5") });
      
      await auction.connect(bidder1).withdraw();
      
      expect(await auction.pendingWithdrawals(bidder1.address)).to.equal(0);
    });
    
    it("Should emit FundsWithdrawn event", async function () {
      await auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH });
      await auction.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("1.5") });
      
      const expectedAmount = ONE_ETH * BigInt(99) / BigInt(100);
      
      await expect(
        auction.connect(bidder1).withdraw()
      ).to.emit(auction, "FundsWithdrawn")
        .withArgs(bidder1.address, expectedAmount);
    });
    
    it("Should revert if no funds to withdraw", async function () {
      await expect(
        auction.connect(bidder1).withdraw()
      ).to.be.revertedWith("No funds to withdraw");
    });
  });
  
  describe("Increase Bid (Same Bidder)", function () {
    let auctionId;
    
    beforeEach(async function () {
      await createAuction(seller);
      auctionId = 1;
      await auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH });
    });
    
    it("Should allow highest bidder to increase bid", async function () {
      await expect(
        auction.connect(bidder1).increaseBid(auctionId, { value: ethers.parseEther("0.5") })
      ).to.emit(auction, "BidIncreased");
    });
    
    it("Should sum added amount to current bid", async function () {
      await auction.connect(bidder1).increaseBid(auctionId, { value: ethers.parseEther("0.5") });
      
      const auctionData = await auction.auctions(auctionId);
      expect(auctionData.currentBid).to.equal(ethers.parseEther("1.5"));
    });
    
    it("Should NOT apply penalty when increasing own bid", async function () {
      const feePoolBefore = await auction.getFeePool();
      
      await auction.connect(bidder1).increaseBid(auctionId, { value: ethers.parseEther("0.5") });
      
      expect(await auction.getFeePool()).to.equal(feePoolBefore);
    });
    
    it("Should not allow non-highest bidder to increase", async function () {
      await expect(
        auction.connect(bidder2).increaseBid(auctionId, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Not the highest bidder");
    });
    
    it("Should extend time if in anti-sniping window", async function () {
      await createAuction(seller, "short", ONE_ETH, ONE_ETH, ONE_HOUR);
      await auction.connect(bidder1).placeBid(2, { value: ONE_ETH });
      
      await ethers.provider.send("evm_increaseTime", [ONE_HOUR - 180]);
      await ethers.provider.send("evm_mine");
      
      const before = await auction.auctions(2);
      await auction.connect(bidder1).increaseBid(2, { value: ethers.parseEther("0.1") });
      const after = await auction.auctions(2);
      
      expect(after.endTime).to.be.gt(before.endTime);
    });
  });
  
  describe("End Auction", function () {
    let auctionId;
    
    beforeEach(async function () {
      await createAuction(seller, "product", ONE_ETH, ONE_ETH, ONE_HOUR);
      auctionId = 1;
    });
    
    it("Should not end before time", async function () {
      await expect(
        auction.endAuction(auctionId)
      ).to.be.revertedWith("Auction not ended yet");
    });
    
    it("Should end successfully with winning bid", async function () {
      await auction.connect(bidder1).placeBid(auctionId, { value: ethers.parseEther("1.5") });
      
      await ethers.provider.send("evm_increaseTime", [ONE_HOUR + 10]);
      await ethers.provider.send("evm_mine");
      
      await expect(auction.endAuction(auctionId)).to.emit(auction, "AuctionEnded");
    });
    
    it("Should fail if no bids", async function () {
      await ethers.provider.send("evm_increaseTime", [ONE_HOUR + 10]);
      await ethers.provider.send("evm_mine");
      
      await expect(auction.endAuction(auctionId)).to.emit(auction, "AuctionFailed");
    });
    
    it("Should fail if reserve not met", async function () {
      // Create auction with higher reserve
      await createAuction(seller, "reserve-test", ONE_ETH, TWO_ETH, ONE_HOUR);
      
      // Bid below reserve
      await auction.connect(bidder1).placeBid(2, { value: ethers.parseEther("1.5") });
      
      await ethers.provider.send("evm_increaseTime", [ONE_HOUR + 10]);
      await ethers.provider.send("evm_mine");
      
      await expect(auction.endAuction(2)).to.emit(auction, "AuctionFailed");
    });
  });
  
  describe("Admin Functions", function () {
    it("Should allow owner to update platform fee", async function () {
      await auction.connect(owner).updatePlatformFee(10);
      expect(await auction.platformFeePercent()).to.equal(10);
    });
    
    it("Should allow owner to update anti-sniping params", async function () {
      await auction.connect(owner).updateAntiSnipingParams(600, 600);
      expect(await auction.antiSnipingWindow()).to.equal(600);
      expect(await auction.antiSnipingExtension()).to.equal(600);
    });
    
    it("Should allow owner to update min bid increment percent", async function () {
      await auction.connect(owner).updateMinBidIncrement(10);
      expect(await auction.minBidIncrementPercent()).to.equal(10);
    });
    
    it("Should allow owner to update min absolute bid increment", async function () {
      const newAmount = ethers.parseEther("0.1");
      await auction.connect(owner).updateMinAbsoluteBidIncrement(newAmount);
      expect(await auction.minAbsoluteBidIncrement()).to.equal(newAmount);
    });
    
    it("Should allow owner to update outbid penalty", async function () {
      await auction.connect(owner).updateOutbidPenalty(2);
      expect(await auction.outbidPenaltyPercent()).to.equal(2);
    });
    
    it("Should not allow penalty above 10%", async function () {
      await expect(
        auction.connect(owner).updateOutbidPenalty(15)
      ).to.be.revertedWith("Penalty cannot exceed 10%");
    });
    
    it("Should allow admin to withdraw fee pool", async function () {
      await createAuction(seller);
      await auction.connect(bidder1).placeBid(1, { value: ONE_ETH });
      await auction.connect(bidder2).placeBid(1, { value: ethers.parseEther("1.5") });
      
      const feePoolBefore = await auction.getFeePool();
      expect(feePoolBefore).to.be.gt(0);
      
      await auction.connect(owner).withdrawFeePool();
      
      expect(await auction.getFeePool()).to.equal(0);
    });
    
    it("Should revert fee pool withdrawal if empty", async function () {
      await expect(
        auction.connect(owner).withdrawFeePool()
      ).to.be.revertedWith("No fees to withdraw");
    });
    
    it("Should not allow non-owner to update settings", async function () {
      await expect(
        auction.connect(seller).updatePlatformFee(10)
      ).to.be.revertedWithCustomError(auction, "OwnableUnauthorizedAccount");
      
      await expect(
        auction.connect(seller).updateMinAbsoluteBidIncrement(1000)
      ).to.be.revertedWithCustomError(auction, "OwnableUnauthorizedAccount");
    });
  });
  
  describe("Deposit System", function () {
    let auctionId;
    
    beforeEach(async function () {
      // Create auction requiring deposit
      await createAuction(
        seller,
        "deposit-auction",
        ONE_ETH,
        ONE_ETH,
        ONE_DAY,
        DEPOSIT_AMOUNT, // 0.1 ETH deposit
        true
      );
      auctionId = 1;
    });
    
    it("Should require deposit before bidding", async function () {
      await expect(
        auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH })
      ).to.be.revertedWith("Must place deposit first");
    });
    
    it("Should allow bidding after deposit", async function () {
      await auction.connect(bidder1).placeDeposit(auctionId, { value: DEPOSIT_AMOUNT });
      
      await expect(
        auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH })
      ).to.emit(auction, "BidPlaced");
    });
    
    it("Should emit DepositPlaced event", async function () {
      await expect(
        auction.connect(bidder1).placeDeposit(auctionId, { value: DEPOSIT_AMOUNT })
      ).to.emit(auction, "DepositPlaced")
        .withArgs(auctionId, bidder1.address, DEPOSIT_AMOUNT);
    });
  });
  
  describe("Bid History", function () {
    it("Should record bid history", async function () {
      await createAuction(seller);
      
      await auction.connect(bidder1).placeBid(1, { value: ONE_ETH });
      await auction.connect(bidder2).placeBid(1, { value: ethers.parseEther("1.5") });
      
      const history = await auction.getBidHistory(1);
      
      expect(history.length).to.equal(2);
      expect(history[0].bidder).to.equal(bidder1.address);
      expect(history[0].amount).to.equal(ONE_ETH);
      expect(history[1].bidder).to.equal(bidder2.address);
      expect(history[1].amount).to.equal(ethers.parseEther("1.5"));
    });
    
    it("Should record increased bids in history", async function () {
      await createAuction(seller);
      
      await auction.connect(bidder1).placeBid(1, { value: ONE_ETH });
      await auction.connect(bidder1).increaseBid(1, { value: ethers.parseEther("0.5") });
      
      const history = await auction.getBidHistory(1);
      
      expect(history.length).to.equal(2);
      expect(history[1].amount).to.equal(ethers.parseEther("1.5")); // New total
    });
  });
  
  describe("Edge Cases", function () {
    it("Should handle auction with zero custom increments (uses global)", async function () {
      await createAuction(seller, "zero-custom", ONE_ETH, ONE_ETH, ONE_DAY, 0, true, 0, 0);
      
      await auction.connect(bidder1).placeBid(1, { value: ONE_ETH });
      
      // Should use global 5%
      const minBid = await auction.getMinBidAmount(1);
      expect(minBid).to.be.gt(ONE_ETH);
    });
    
    it("Should handle very high bid correctly", async function () {
      await createAuction(seller);
      
      const highBid = ethers.parseEther("1000");
      await auction.connect(bidder1).placeBid(1, { value: highBid });
      
      const auctionData = await auction.auctions(1);
      expect(auctionData.currentBid).to.equal(highBid);
    });
    
    it("Should handle multiple auctions independently", async function () {
      await createAuction(seller, "auction-1");
      await createAuction(seller, "auction-2");
      
      await auction.connect(bidder1).placeBid(1, { value: ONE_ETH });
      await auction.connect(bidder2).placeBid(2, { value: ethers.parseEther("2") });
      
      const auction1 = await auction.auctions(1);
      const auction2 = await auction.auctions(2);
      
      expect(auction1.currentBid).to.equal(ONE_ETH);
      expect(auction2.currentBid).to.equal(ethers.parseEther("2"));
      expect(auction1.highestBidder).to.equal(bidder1.address);
      expect(auction2.highestBidder).to.equal(bidder2.address);
    });
  });
});
