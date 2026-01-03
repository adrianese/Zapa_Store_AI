const hre = require("hardhat");
const path = require("path");

// Función para actualizar addresses.json en el frontend
function updateFrontendAddresses(network, addresses) {
  const fs = require("fs");
  const addressesPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'contracts', 'addresses.json');
  
  let addressesData = {
    _comment: "Actualizado automáticamente por el script de deploy",
    _lastUpdate: null,
    networks: {}
  };
  
  // Leer archivo existente si existe
  if (fs.existsSync(addressesPath)) {
    try {
      addressesData = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
    } catch (e) {
      console.log("⚠️ No se pudo leer addresses.json, creando nuevo");
    }
  }
  
  // Obtener chainId
  const chainIds = {
    localhost: 31337,
    hardhat: 31337,
    sepolia: 11155111,
    mainnet: 1,
    polygon: 137,
    arbitrum: 42161
  };
  
  // Actualizar network
  addressesData._lastUpdate = new Date().toISOString();
  addressesData.networks[network] = {
    chainId: chainIds[network] || 0,
    ...addresses
  };
  
  // Guardar
  fs.writeFileSync(addressesPath, JSON.stringify(addressesData, null, 2));
  console.log(`\n✅ Frontend addresses.json actualizado para ${network}`);
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("=".repeat(60));
  console.log("ZSTORE CONTRACTS DEPLOYMENT");
  console.log("=".repeat(60));
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("-".repeat(60));
  
  // Configuration
  const PLATFORM_WALLET = process.env.PLATFORM_WALLET || deployer.address;
  const PLATFORM_FEE_BPS = process.env.PLATFORM_FEE_BPS || 250; // 2.5%
  
  // Deploy Marketplace
  console.log("\n📦 Deploying Marketplace...");
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(PLATFORM_WALLET, PLATFORM_FEE_BPS);
  await marketplace.waitForDeployment();
  
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ Marketplace deployed to:", marketplaceAddress);
  
  // Deploy Auction
  console.log("\n🔨 Deploying Auction...");
  const Auction = await hre.ethers.getContractFactory("Auction");
  const auction = await Auction.deploy(PLATFORM_WALLET, PLATFORM_FEE_BPS);
  await auction.waitForDeployment();
  
  const auctionAddress = await auction.getAddress();
  console.log("✅ Auction deployed to:", auctionAddress);
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:", hre.network.name);
  console.log("Platform Wallet:", PLATFORM_WALLET);
  console.log("Platform Fee:", PLATFORM_FEE_BPS / 100, "%");
  console.log("-".repeat(60));
  console.log("Marketplace:", marketplaceAddress);
  console.log("Auction:", auctionAddress);
  console.log("=".repeat(60));
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      Marketplace: {
        address: marketplaceAddress,
        platformWallet: PLATFORM_WALLET,
        platformFeeBps: PLATFORM_FEE_BPS
      },
      Auction: {
        address: auctionAddress,
        platformWallet: PLATFORM_WALLET,
        platformFeeBps: PLATFORM_FEE_BPS
      }
    }
  };
  
  const fs = require("fs");
  const deploymentPath = `./deployments/${hre.network.name}`;
  
  if (!fs.existsSync("./deployments")) {
    fs.mkdirSync("./deployments");
  }
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath);
  }
  
  fs.writeFileSync(
    `${deploymentPath}/deployment-${Date.now()}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n📁 Deployment info saved to:", deploymentPath);
  
  // Actualizar addresses.json en frontend
  updateFrontendAddresses(hre.network.name, {
    Marketplace: marketplaceAddress,
    Auction: auctionAddress
  });
  
  // Sincronizar ABIs al frontend
  console.log("\n🔄 Sincronizando ABIs al frontend...");
  const { syncAbis } = require('./sync-abis');
  syncAbis();

  // Verify contracts on Etherscan (if not localhost)
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\n⏳ Waiting for block confirmations before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
    
    try {
      console.log("\n🔍 Verifying Marketplace on Etherscan...");
      await hre.run("verify:verify", {
        address: marketplaceAddress,
        constructorArguments: [PLATFORM_WALLET, PLATFORM_FEE_BPS],
      });
      console.log("✅ Marketplace verified!");
    } catch (error) {
      console.log("⚠️ Marketplace verification failed:", error.message);
    }
    
    try {
      console.log("\n🔍 Verifying Auction on Etherscan...");
      await hre.run("verify:verify", {
        address: auctionAddress,
        constructorArguments: [PLATFORM_WALLET, PLATFORM_FEE_BPS],
      });
      console.log("✅ Auction verified!");
    } catch (error) {
      console.log("⚠️ Auction verification failed:", error.message);
    }
  }
  
  return { marketplace: marketplaceAddress, auction: auctionAddress };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
