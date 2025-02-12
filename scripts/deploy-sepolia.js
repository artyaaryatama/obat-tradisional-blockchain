const fs = require("fs");
const hre = require("hardhat");

async function main() {

  const deployedContracts = {
    RoleManager: "0x9B26B853655e7F26828d25EAACFaFaC0caf8cC56",
    ObatShared: "0xD88AA28325CcC3156353Eb2CAf9846ae28039964",
    CpotbCertificate: "0x1543e9EE6e5Bdc64093f1df7480aDE70de0cBd97",
    CdobCertificate: "0x6C5a3CA75c5Abb25201B42229daBa887e95322bF",
    CertificateManager: "0xD9C8Aff5cd19e9d883261616f5E48C8CC7a67A2E",
    NieManager: "0xD8622FF38245018583F75BCbD1aa880f1cae7a9C",
    ObatTradisional: "0x44AC6209DD242A22Ed40CF4E25c1b455dC39efDf",
    OrderManagement: "0x19c8510884E7A3A52a2e4ac1CB3ae5F49c16EE59",
  };

  console.log("Using hardcoded contract addresses:", deployedContracts);

  const deploymentData = {
    ObatTradisional: {
      address: deployedContracts.ObatTradisional,
      abi: (await hre.artifacts.readArtifact("ObatTradisional")).abi,
    },
    OrderManagement: {
      address: deployedContracts.OrderManagement,
      abi: (await hre.artifacts.readArtifact("OrderManagement")).abi,
    },
    RoleManager: {
      address: deployedContracts.RoleManager,
      abi: (await hre.artifacts.readArtifact("RoleManager")).abi,
    },
    CertificateManager: {
      address: deployedContracts.CertificateManager,
      abi: (await hre.artifacts.readArtifact("CertificateManager")).abi,
    },
    NieManager: {
      address: deployedContracts.NieManager,
      abi: (await hre.artifacts.readArtifact("NieManager")).abi,
    },
    ObatShared: {
      address: deployedContracts.ObatShared,
      abi: (await hre.artifacts.readArtifact("ObatShared")).abi,
    },
    CdobCertificate: {
      address: deployedContracts.CdobCertificate,
      abi: (await hre.artifacts.readArtifact("CdobCertificate")).abi,
    },
  };

  fs.writeFileSync("./src/auto-artifacts/deployments_sepolia.json", JSON.stringify(deploymentData, null, 2));
  console.log("Deployment data saved.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });