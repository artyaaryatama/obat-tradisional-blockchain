const fs = require("fs");
const hre = require("hardhat");

async function main() {
  // Deploy RoleManager
  const RoleManager = await hre.ethers.getContractFactory("RoleManager");
  const deployedRoleManager = await RoleManager.deploy();
  await deployedRoleManager.waitForDeployment();
  console.log("RoleManager deployed to:", deployedRoleManager.target);
  
  // Deploy ObatShared
  const ObatShared = await hre.ethers.getContractFactory("ObatShared");
  const deployedObatShared = await ObatShared.deploy();
  await deployedObatShared.waitForDeployment();
  console.log("ObatShared deployed to:", deployedObatShared.target);
  
  // Deploy CpotbCertificate
  const CpotbCertificate = await hre.ethers.getContractFactory("CpotbCertificate");
  const deployedCpotbCertificate = await CpotbCertificate.deploy();
  await deployedCpotbCertificate.waitForDeployment();
  console.log("CpotbCertificate deployed to:", deployedCpotbCertificate.target);

  // Deploy CdobCertificate
  const CdobCertificate = await hre.ethers.getContractFactory("CdobCertificate");
  const deployedCdobCertificate = await CdobCertificate.deploy();
  await deployedCdobCertificate.waitForDeployment();
  console.log("CdobCertificate deployed to:", deployedCdobCertificate.target);
  
  // Deploy CertificateManager
  const CertificateManager = await hre.ethers.getContractFactory("CertificateManager");
  const deployedCertificateManager = await CertificateManager.deploy(deployedRoleManager.target, deployedCpotbCertificate.target, deployedCdobCertificate.target);
  await deployedCertificateManager.waitForDeployment();
  console.log("CertificateManager deployed to:", deployedCertificateManager.target);

  // Deploy NIE
  const NieManager = await hre.ethers.getContractFactory("NieManager");
  const deployedNieManager = await NieManager.deploy(deployedRoleManager.target);
  await deployedNieManager.waitForDeployment();
  console.log("NieManager deployed to:", deployedNieManager.target);

  // Deploy ObatTradisional
  const ObatTradisional = await hre.ethers.getContractFactory("ObatTradisional");
  const deployedObatTradisional = await ObatTradisional.deploy(deployedRoleManager.target, deployedObatShared.target, deployedNieManager.target);
  await deployedObatTradisional.waitForDeployment();
  console.log("ObatTradisional deployed to:", deployedObatTradisional.target);

  // Deploy OrderManagement
  const OrderManagement = await hre.ethers.getContractFactory("OrderManagement");
  const deployedOrderManagement = await OrderManagement.deploy(deployedObatTradisional.target, deployedRoleManager.target, deployedObatShared.target, deployedCdobCertificate.target);
  await deployedOrderManagement.waitForDeployment();
  console.log("OrderManagement deployed to:", deployedOrderManagement.target);

  const deploymentData = {
    ObatTradisional: {
      address: deployedObatTradisional.target,
      abi: (await hre.artifacts.readArtifact("ObatTradisional")).abi
    },
    OrderManagement: {
      address: deployedOrderManagement.target,
      abi: (await hre.artifacts.readArtifact("OrderManagement")).abi
    },
    RoleManager: {
      address: deployedRoleManager.target,
      abi: (await hre.artifacts.readArtifact("RoleManager")).abi
    },
    CertificateManager: {
      address: deployedCertificateManager.target,
      abi: (await hre.artifacts.readArtifact("CertificateManager")).abi
    },
    NieManager: {
      address: deployedNieManager.target,
      abi: (await hre.artifacts.readArtifact("NieManager")).abi
    },
    ObatShared: {
      address: deployedObatShared.target,
      abi: (await hre.artifacts.readArtifact("ObatShared")).abi
    },
  };

  fs.writeFileSync('./src/auto-artifacts/deployments.json', JSON.stringify(deploymentData, null, 2));
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});
