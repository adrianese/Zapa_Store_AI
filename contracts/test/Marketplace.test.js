const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Marketplace", function () {
  let marketplace;
  let owner;
  let seller;
  let buyer;
  let platformWallet;
  
  const PLATFORM_FEE_PERCENT = 5; // 5%
  const ONE_ETH = ethers.parseEther("1");
  
  beforeEach(async function () {
    [owner, seller, buyer, platformWallet] = await ethers.getSigners();
    
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(platformWallet.address, PLATFORM_FEE_PERCENT);
    await marketplace.waitForDeployment();
  });
  
  describe("Deployment", function () {
    it("Should set the correct platform fee", async function () {
      expect(await marketplace.platformFeePercent()).to.equal(PLATFORM_FEE_PERCENT);
    });
    
    it("Should set the owner correctly", async function () {
      expect(await marketplace.owner()).to.equal(owner.address);
    });
  });
  
  describe("Create Item", function () {
    it("Should create an item successfully", async function () {
      await expect(
        marketplace.connect(seller).createItem(ONE_ETH, "product-123")
      ).to.emit(marketplace, "ItemCreated");
    });
  });
  
  describe("Purchase", function () {
    let itemId;
    
    beforeEach(async function () {
      await marketplace.connect(seller).createItem(ONE_ETH, "product-123");
      itemId = 1;
    });
    
    it("Should complete purchase with correct amount", async function () {
      await expect(
        marketplace.connect(buyer).purchaseItem(itemId, { value: ONE_ETH })
      ).to.emit(marketplace, "ItemPurchased");
    });
    
    it("Should fail with insufficient payment", async function () {
      const halfEth = ethers.parseEther("0.5");
      
      await expect(
        marketplace.connect(buyer).purchaseItem(itemId, { value: halfEth })
      ).to.be.revertedWith("Incorrect payment amount");
    });
  });
  
  describe("Confirm Reception", function () {
    let itemId;
    
    beforeEach(async function () {
      await marketplace.connect(seller).createItem(ONE_ETH, "product-123");
      itemId = 1;
      await marketplace.connect(buyer).purchaseItem(itemId, { value: ONE_ETH });
    });
    
    it("Should allow buyer to confirm reception", async function () {
      await expect(
        marketplace.connect(buyer).confirmReception(itemId)
      ).to.emit(marketplace, "FundsReleased");
    });
    
    it("Should not allow seller to confirm reception", async function () {
      await expect(
        marketplace.connect(seller).confirmReception(itemId)
      ).to.be.revertedWith("Only the buyer can confirm reception");
    });
  });
  
  describe("Disputes", function () {
    let itemId;
    
    beforeEach(async function () {
      await marketplace.connect(seller).createItem(ONE_ETH, "product-123");
      itemId = 1;
      await marketplace.connect(buyer).purchaseItem(itemId, { value: ONE_ETH });
    });
    
    it("Should allow buyer to raise dispute", async function () {
      await marketplace.connect(buyer).raiseDispute(itemId);
      const item = await marketplace.items(itemId);
      expect(item.state).to.equal(3); // State.Disputed
    });
    
    it("Should allow owner to resolve dispute with refund", async function () {
      await marketplace.connect(buyer).raiseDispute(itemId);
      
      await expect(
        marketplace.connect(owner).resolveDispute(itemId, true)
      ).to.emit(marketplace, "FundsRefunded");
    });
    
    it("Should allow owner to resolve dispute without refund", async function () {
      await marketplace.connect(buyer).raiseDispute(itemId);
      
      await expect(
        marketplace.connect(owner).resolveDispute(itemId, false)
      ).to.emit(marketplace, "FundsReleased");
    });
  });
  
  describe("Admin Functions", function () {
    it("Should allow owner to update platform fee", async function () {
      const newFee = 10; // 10%
      await marketplace.connect(owner).updatePlatformFee(newFee);
      expect(await marketplace.platformFeePercent()).to.equal(newFee);
    });
    
    it("Should not allow non-owner to update platform fee", async function () {
      await expect(
        marketplace.connect(seller).updatePlatformFee(10)
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });
    
    it("Should not allow fee above 100%", async function () {
      await expect(
        marketplace.connect(owner).updatePlatformFee(101)
      ).to.be.revertedWith("Fee cannot exceed 100%");
    });
  });
  
  describe("Withdrawals", function () {
    it("Should allow withdrawal of pending funds", async function () {
      await marketplace.connect(seller).createItem(ONE_ETH, "product-123");
      await marketplace.connect(buyer).purchaseItem(1, { value: ONE_ETH });
      await marketplace.connect(buyer).confirmReception(1);
      
      // Seller should be able to withdraw
      await expect(
        marketplace.connect(seller).withdraw()
      ).to.not.be.reverted;
    });
    
    it("Should fail withdrawal with no pending funds", async function () {
      await expect(
        marketplace.connect(seller).withdraw()
      ).to.be.revertedWith("No funds to withdraw");
    });
  });
});
