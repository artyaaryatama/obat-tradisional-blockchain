const fs = require("fs");
const hre = require("hardhat");

async function main() {
  const deploymentData = JSON.parse(fs.readFileSync('./src/auto-artifacts/deployments.json', 'utf8'));

  const {
    RoleManager,
    ObatTradisional,
    ObatShared,
  } = deploymentData;

  const CdobCertificate = await hre.ethers.getContractFactory("CdobCertificate");
  const deployedCdobCertificate = await CdobCertificate.deploy();
  await deployedCdobCertificate.waitForDeployment();
  console.log("CdobCertificate deployed to:", deployedCdobCertificate.target);

  const OrderManagement = await hre.ethers.getContractFactory("OrderManagement");
  const deployedOrderManagement = await OrderManagement.deploy(
    ObatTradisional.address,
    RoleManager.address,
    ObatShared.address,
    deployedCdobCertificate.target
  );
  await deployedOrderManagement.waitForDeployment();
  console.log("OrderManagement deployed to:", deployedOrderManagement.target);

  deploymentData.OrderManagement = {
    address: deployedOrderManagement.target,
    abi: (await hre.artifacts.readArtifact("OrderManagement")).abi
  };

  fs.writeFileSync('./src/auto-artifacts/deployments.json', JSON.stringify(deploymentData, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
