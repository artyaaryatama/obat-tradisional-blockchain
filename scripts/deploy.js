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
  const deployedOrderManagement = await OrderManagement.deploy(deployedRoleManager.target, deployedObatShared.target, deployedCdobCertificate.target);
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
    CdobCertificate: {
      address: deployedCdobCertificate.target,
      abi: (await hre.artifacts.readArtifact("CdobCertificate")).abi
    },
  };

  fs.writeFileSync('./src/auto-artifacts/deployments.json', JSON.stringify(deploymentData, null, 2));
}

// only re-deploy obattradisional and nie contract
// async function main() {
//   let deploymentData = {};
//   const deploymentsFilePath = './src/auto-artifacts/deployments.json';

//   try {
//     if (fs.existsSync(deploymentsFilePath)) {
//       deploymentData = JSON.parse(fs.readFileSync(deploymentsFilePath, 'utf8'));
//     }
//   } catch (error) {
//     console.error("Gagal membaca deployments.json, membuat file baru jika tidak ada:", error);
//   }

//   const roleManagerAddress = deploymentData.RoleManager?.address;

//   if (!roleManagerAddress) {
//     console.error("Error: Alamat RoleManager tidak ditemukan di deployments.json. Pastikan RoleManager sudah di-deploy dan datanya tersimpan.");
//     process.exit(1); 
//   }

//   console.log("Menggunakan RoleManager yang sudah ada di alamat:", roleManagerAddress);

//   let deployedObatShared;
//   if (deploymentData.ObatShared?.address) {
//     deployedObatShared = await hre.ethers.getContractAt("ObatShared", deploymentData.ObatShared.address);
//     console.log("Menggunakan ObatShared yang sudah ada di alamat:", deployedObatShared.target);
//   } else {
//     const ObatShared = await hre.ethers.getContractFactory("ObatShared");
//     deployedObatShared = await ObatShared.deploy();
//     await deployedObatShared.waitForDeployment();
//     console.log("ObatShared di-deploy ke:", deployedObatShared.target);
//     deploymentData.ObatShared = {
//       address: deployedObatShared.target,
//       abi: (await hre.artifacts.readArtifact("ObatShared")).abi
//     };
//   }
  
//   const NieManager = await hre.ethers.getContractFactory("NieManager");
//   const deployedNieManager = await NieManager.deploy(roleManagerAddress);
//   await deployedNieManager.waitForDeployment();
//   console.log("NieManager di-deploy ulang ke:", deployedNieManager.target);

//   const ObatTradisional = await hre.ethers.getContractFactory("ObatTradisional");
//   const deployedObatTradisional = await ObatTradisional.deploy(roleManagerAddress, deployedObatShared.target, deployedNieManager.target);
//   await deployedObatTradisional.waitForDeployment();
//   console.log("ObatTradisional di-deploy ulang ke:", deployedObatTradisional.target);

//   deploymentData.NieManager = {
//     address: deployedNieManager.target,
//     abi: (await hre.artifacts.readArtifact("NieManager")).abi
//   };
//   deploymentData.ObatTradisional = {
//     address: deployedObatTradisional.target,
//     abi: (await hre.artifacts.readArtifact("ObatTradisional")).abi
//   };
//   fs.writeFileSync(deploymentsFilePath, JSON.stringify(deploymentData, null, 2));
//   console.log("Data deployment diperbarui di:", deploymentsFilePath);
// }

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});
