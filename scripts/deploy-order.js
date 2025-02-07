// const fs = require("fs");
// const hre = require("hardhat");

// async function main() {
//   // Load existing deployments
//   const deploymentData = JSON.parse(fs.readFileSync('./src/auto-artifacts/deployments.json', 'utf8'));

//   // Extract existing contract addresses
//   const {
//     RoleManager,
//     ObatTradisional
//   } = deploymentData;

//   const CdobCertificate = await hre.ethers.getContractFactory("CdobCertificate");
//   const deployedCdobCertificate = await CdobCertificate.deploy();
//   await deployedCdobCertificate.waitForDeployment();
//   console.log("CdobCertificate deployed to:", deployedCdobCertificate.target);

//   const ObatShared = await hre.ethers.getContractFactory("ObatShared");
//   const deployedObatShared = await ObatShared.deploy();
//   await deployedObatShared.waitForDeployment();
//   console.log("ObatShared deployed to:", deployedObatShared.target);

//   // Deploy OrderManagement
//   const OrderManagementPbf = await hre.ethers.getContractFactory("OrderManagementPbf");
//   const deployedOrderManagementPbf = await OrderManagementPbf.deploy(    
//     ObatTradisional.address,
//     RoleManager.address,
//     deployedObatShared.target,
//     deployedCdobCertificate.target);
//   await deployedOrderManagementPbf.waitForDeployment();
//   console.log("OrderManagementPbf deployed to:", deployedOrderManagementPbf.target);


//   // Deploy OrderManagementRetail
//   const OrderManagementRetail = await hre.ethers.getContractFactory("OrderManagementRetail");
//   const deployedOrderManagementRetail = await OrderManagementRetail.deploy(
//     RoleManager.address,
//     deployedObatShared.target
//   );
//   await deployedOrderManagementRetail.waitForDeployment();
//   console.log("OrderManagementRetail deployed to:", deployedOrderManagementRetail.target);

//   // Update deployment data
//   deploymentData.OrderManagementPbf = {
//     address: deployedOrderManagementPbf.target,
//     abi: (await hre.artifacts.readArtifact("OrderManagementPbf")).abi
//   };
//   deploymentData.OrderManagementRetail = {
//     address: deployedOrderManagementRetail.target,
//     abi: (await hre.artifacts.readArtifact("OrderManagementRetail")).abi
//   };
//   // deploymentData.OrderManagement = {
//   //   address: deployedOrderManagement.target,
//   //   abi: (await hre.artifacts.readArtifact("OrderManagement")).abi
//   // }

//   fs.writeFileSync('./src/auto-artifacts/deployments.json', JSON.stringify(deploymentData, null, 2));
// }

// main()
// .then(() => process.exit(0))
// .catch((error) => {
//   console.error(error);
//   process.exit(1);
// });

const fs = require("fs");
const hre = require("hardhat");

async function main() {
  // Load existing deployments
  const deploymentData = JSON.parse(fs.readFileSync('./src/auto-artifacts/deployments.json', 'utf8'));

  // Extract existing contract addresses
  const {
    RoleManager,
    ObatTradisional,
    ObatShared
  } = deploymentData;

  // Deploy BaseOrderManagement
  const BaseOrderManagement = await hre.ethers.getContractFactory("BaseOrderManagement");
  const deployedBaseOrderManagement = await BaseOrderManagement.deploy();
  await deployedBaseOrderManagement.waitForDeployment();
  console.log("BaseOrderManagement deployed to:", deployedBaseOrderManagement.target);

  const CdobCertificate = await hre.ethers.getContractFactory("CdobCertificate");
  const deployedCdobCertificate = await CdobCertificate.deploy();
  await deployedCdobCertificate.waitForDeployment();
  console.log("CdobCertificate deployed to:", deployedCdobCertificate.target);

    // Deploy OrderManagement
  const OrderManagementPbf = await hre.ethers.getContractFactory("OrderManagementPbf");
  const deployedOrderManagementPbf = await OrderManagementPbf.deploy(    
    ObatTradisional.address,
    RoleManager.address,
    ObatShared.address,
    deployedCdobCertificate.target);
  await deployedOrderManagementPbf.waitForDeployment();
  console.log("OrderManagementPbf deployed to:", deployedOrderManagementPbf.target);


  // Deploy OrderManagementRetail
  const OrderManagementRetail = await hre.ethers.getContractFactory("OrderManagementRetail");
  const deployedOrderManagementRetail = await OrderManagementRetail.deploy(
    RoleManager.address,
    ObatShared.address
  );
  await deployedOrderManagementRetail.waitForDeployment();
  console.log("OrderManagementRetail deployed to:", deployedOrderManagementRetail.target);

  // Update deployment data
  deploymentData.BaseOrderManagement = {
    address: deployedBaseOrderManagement.target,
    abi: (await hre.artifacts.readArtifact("BaseOrderManagement")).abi
  };
  deploymentData.OrderManagementPbf = {
    address: deployedOrderManagementPbf.target,
    abi: (await hre.artifacts.readArtifact("OrderManagementPbf")).abi
  };
  deploymentData.OrderManagementRetail = {
    address: deployedOrderManagementRetail.target,
    abi: (await hre.artifacts.readArtifact("OrderManagementRetail")).abi
  };

  fs.writeFileSync('./src/auto-artifacts/deployments.json', JSON.stringify(deploymentData, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
