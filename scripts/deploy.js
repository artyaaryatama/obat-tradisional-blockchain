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

  // Deploy BaseOrderManagement
  const BaseOrderManagement = await hre.ethers.getContractFactory("BaseOrderManagement");
  const deployedBaseOrderManagement = await BaseOrderManagement.deploy();
  await deployedBaseOrderManagement.waitForDeployment();
  console.log("BaseOrderManagement deployed to:", deployedBaseOrderManagement.target);

  // Deploy OrderManagementPbf
  const OrderManagementPbf = await hre.ethers.getContractFactory("OrderManagementPbf");
  const deployedOrderManagementPbf = await OrderManagementPbf.deploy(deployedObatTradisional.target, deployedRoleManager.target, deployedObatShared.target, deployedCdobCertificate.target);
  await deployedOrderManagementPbf.waitForDeployment();
  console.log("OrderManagementPbf deployed to:", deployedOrderManagementPbf.target);

  // Deploy OrderManagementRetail
  const OrderManagementRetail = await hre.ethers.getContractFactory("OrderManagementRetail");
  const deployedOrderManagementRetail = await OrderManagementRetail.deploy(deployedRoleManager.target, deployedObatShared.target);
  await deployedOrderManagementRetail.waitForDeployment();
  console.log("OrderManagementRetail deployed to:", deployedOrderManagementRetail.target);

  const deploymentData = {
    ObatTradisional: {
      address: deployedObatTradisional.target,
      abi: (await hre.artifacts.readArtifact("ObatTradisional")).abi
    },
    OrderManagementPbf: {
      address: deployedOrderManagementPbf.target,
      abi: (await hre.artifacts.readArtifact("OrderManagementPbf")).abi
    },
    OrderManagementRetail: {
      address: deployedOrderManagementRetail.target,
      abi: (await hre.artifacts.readArtifact("OrderManagementRetail")).abi
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
    }
  };

  fs.writeFileSync('./src/auto-artifacts/deployments.json', JSON.stringify(deploymentData, null, 2));
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});
