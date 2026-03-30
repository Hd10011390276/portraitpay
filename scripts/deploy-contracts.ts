/**
 * deploy-contracts.ts
 * Deploy PortraitCert.sol to Sepolia using Hardhat
 *
 * Usage:
 *   npx ts-node scripts/deploy-contracts.ts --network sepolia
 *
 * Prerequisites:
 *   npm install -D ts-node hardhat @nomicfoundation/hardhat-toolbox
 *   Set ETH_WALLET_PRIVATE_KEY and ETHEREUM_SEPOLIA_RPC_URL in .env
 */

import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const PRIVATE_KEY = process.env.ETH_WALLET_PRIVATE_KEY!;
const RPC_URL = process.env.ETHEREUM_SEPOLIA_RPC_URL!;
const CONTRACT_ARTIFACT = path.join(__dirname, "../out/PortraitCert.sol/PortraitCert.json");

async function main() {
  const network = process.argv.includes("--network sepolia") ? "sepolia" : "localhost";
  console.log(`🚀 Deploying to ${network}...`);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`  Deployer: ${wallet.address}`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`  Balance:  ${ethers.formatEther(balance)} ETH`);

  // Load compiled artifact
  if (!fs.existsSync(CONTRACT_ARTIFACT)) {
    console.error("❌ Contract artifact not found. Run `npx hardhat compile` first.");
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(CONTRACT_ARTIFACT, "utf8"));
  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  console.log("  Deploying PortraitCert...");
  const contract = await factory.deploy();

  console.log(`  Tx submitted: ${contract.deploymentTransaction()?.hash}`);
  console.log("  Waiting for confirmation...");

  const deployed = await contract.waitForDeployment();
  const address = await deployed.getAddress();

  console.log(`\n✅ PortraitCert deployed!`);
  console.log(`   Address:    ${address}`);
  console.log(`   Network:    ${network}`);
  console.log(`\n   Update your .env:`);
  console.log(`   PORTRAIT_CERT_CONTRACT_ADDRESS="${address}"`);

  // Save deployed address for reference
  const deployments = path.join(__dirname, "../.deployments");
  fs.mkdirSync(deployments, { recursive: true });
  fs.writeFileSync(
    path.join(deployments, `${network}.json`),
    JSON.stringify({ address, network, deployedAt: new Date().toISOString() }, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Deployment failed:", err);
    process.exit(1);
  });
