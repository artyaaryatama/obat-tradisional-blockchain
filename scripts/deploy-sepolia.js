const fs = require("fs");
const hre = require("hardhat");

async function main() {

  const deployedContracts = {
    RoleManager: "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690",
    ObatShared: "0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB",
    CpotbCertificate: "0x9E545E3C0baAB3E08CdfD552C960A1050f373042",
    CdobCertificate: "0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9",
    CertificateManager: "0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8",
    NieManager: "0x851356ae760d987E095750cCeb3bC6014560891C",
    ObatTradisional: "0xf5059a5D33d5853360D16C683c16e67980206f36",
    OrderManagement: "0x95401dc811bb5740090279Ba06cfA8fcF6113778",
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